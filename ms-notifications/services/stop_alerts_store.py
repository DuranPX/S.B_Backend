"""
Store en memoria para las suscripciones de alertas de llegada a paradero.

Cada ciudadano puede activar una alerta para:
  - una ruta específica (route_id)
  - un paradero específico (stop_id)
  - una anticipación en minutos (5, 10 o 15)

Cuando ms-business detecta (vía heurística de GPS + tiempo_estimado) que un
bus de esa ruta está a <= anticipación minutos del paradero, hace un POST al
webhook de alertas de ms-notifications. Este módulo decide, para esa
ruta+paradero, qué suscripciones deben dispararse (y evita reenviar la
misma alerta de forma repetida para el mismo "evento de acercamiento").

No se usa base de datos: las suscripciones son efímeras y se asocian al
socket (sid) que las creó, así que si el cliente se desconecta, se limpian
solas.
"""

import itertools
import threading
from typing import Optional

_lock = threading.Lock()
_id_counter = itertools.count(1)

# subscription_id -> dict(suscripción)
_subscriptions: dict[str, dict] = {}

# sid -> set(subscription_id) — para resolver rápido las suscripciones del
# socket actualmente conectado.
_subscriptions_by_sid: dict[str, set[str]] = {}

# user_id -> set(subscription_id) — fuente de verdad estable: sobrevive a
# que el sid cambie (recarga de página, reconexión). Solo se usa cuando el
# usuario está identificado (no en modo DISABLE_JWT).
_subscriptions_by_user: dict[str, set[str]] = {}

# (route_id, stop_id) -> set(subscription_id) — para resolver rápido a quién avisar
_subscriptions_by_room: dict[tuple[str, str], set[str]] = {}

ANTICIPATIONS_PERMITIDAS = (5, 10, 15)


def _room_key(route_id: str, stop_id: str) -> tuple[str, str]:
    return (route_id, stop_id)


def add_subscription(
    sid: str,
    user_id: Optional[str],
    route_id: str,
    stop_id: str,
    anticipation_min: int,
) -> dict:
    """Crea (o reemplaza) la suscripción del cliente para esa ruta+paradero."""
    if anticipation_min not in ANTICIPATIONS_PERMITIDAS:
        raise ValueError(
            f"anticipation_min debe ser uno de {ANTICIPATIONS_PERMITIDAS}"
        )

    with _lock:
        # Buscamos una suscripción previa para esa misma combinación
        # ruta+paradero, ya sea asociada al sid actual o (más importante)
        # al mismo user_id — así, si el usuario recargó la página y se
        # reconectó con un sid nuevo, no se duplica la suscripción.
        existing_id = None
        candidate_ids = set(_subscriptions_by_sid.get(sid, set()))
        if user_id:
            candidate_ids |= _subscriptions_by_user.get(user_id, set())

        for sub_id in candidate_ids:
            sub = _subscriptions.get(sub_id)
            if sub and sub["route_id"] == route_id and sub["stop_id"] == stop_id:
                existing_id = sub_id
                break

        sub_id = existing_id or f"sub_{next(_id_counter)}"

        subscription = {
            "id": sub_id,
            "sid": sid,
            "user_id": user_id,
            "route_id": route_id,
            "stop_id": stop_id,
            "anticipation_min": anticipation_min,
            "triggered": False,
        }

        _subscriptions[sub_id] = subscription
        _subscriptions_by_sid.setdefault(sid, set()).add(sub_id)
        if user_id:
            _subscriptions_by_user.setdefault(user_id, set()).add(sub_id)
        _subscriptions_by_room.setdefault(_room_key(route_id, stop_id), set()).add(sub_id)

        return subscription


def remove_subscription(sid: str, subscription_id: str) -> bool:
    """Elimina (de forma definitiva, por acción explícita del usuario) una
    suscripción puntual. Devuelve True si existía."""
    with _lock:
        sub = _subscriptions.get(subscription_id)
        if not sub or sub["sid"] != sid:
            return False

        _remove_locked(subscription_id)
        return True


def detach_sid(sid: str) -> None:
    """
    Se llama al desconectarse un socket. A diferencia de antes, NO borra
    las suscripciones: simplemente deja de asociarlas a este sid, para que
    sigan vivas (indexadas por user_id) hasta que:
      a) el mismo usuario reconecte y las reclame (ver claim_subscriptions_for_user), o
      b) el usuario las desactive explícitamente (remove_subscription), o
      c) pase mucho tiempo sin reclamarlas (no implementado: limpieza por
         expiración quedaría como mejora futura si hiciera falta).

    Las suscripciones sin user_id (p.ej. en modo DISABLE_JWT, donde no hay
    identidad real) sí se eliminan, porque no hay forma de reclamarlas
    después de todos modos.
    """
    with _lock:
        for sub_id in list(_subscriptions_by_sid.get(sid, set())):
            sub = _subscriptions.get(sub_id)
            if sub and not sub.get("user_id"):
                _remove_locked(sub_id)
        _subscriptions_by_sid.pop(sid, None)


def claim_subscriptions_for_user(user_id: str, new_sid: str) -> list[dict]:
    """
    Se llama al conectarse un socket identificado. Reasocia todas las
    suscripciones previas de ese user_id (que quedaron "sueltas" tras una
    desconexión) al nuevo sid, y las devuelve para que el servidor pueda
    informárselas al cliente recién conectado.
    """
    with _lock:
        sub_ids = _subscriptions_by_user.get(user_id, set())
        claimed = []

        for sub_id in sub_ids:
            sub = _subscriptions.get(sub_id)
            if not sub:
                continue

            old_sid = sub["sid"]
            if old_sid != new_sid:
                old_sid_set = _subscriptions_by_sid.get(old_sid)
                if old_sid_set:
                    old_sid_set.discard(sub_id)
                    if not old_sid_set:
                        _subscriptions_by_sid.pop(old_sid, None)

                sub["sid"] = new_sid
                _subscriptions_by_sid.setdefault(new_sid, set()).add(sub_id)

            claimed.append(dict(sub))

        return claimed


def _remove_locked(subscription_id: str) -> None:
    """Debe llamarse ya con _lock adquirido."""
    sub = _subscriptions.pop(subscription_id, None)
    if not sub:
        return

    sid_set = _subscriptions_by_sid.get(sub["sid"])
    if sid_set:
        sid_set.discard(subscription_id)
        if not sid_set:
            _subscriptions_by_sid.pop(sub["sid"], None)

    if sub.get("user_id"):
        user_set = _subscriptions_by_user.get(sub["user_id"])
        if user_set:
            user_set.discard(subscription_id)
            if not user_set:
                _subscriptions_by_user.pop(sub["user_id"], None)

    room_set = _subscriptions_by_room.get(_room_key(sub["route_id"], sub["stop_id"]))
    if room_set:
        room_set.discard(subscription_id)
        if not room_set:
            _subscriptions_by_room.pop(_room_key(sub["route_id"], sub["stop_id"]), None)


def list_for_sid(sid: str) -> list[dict]:
    with _lock:
        return [
            dict(_subscriptions[sub_id])
            for sub_id in _subscriptions_by_sid.get(sid, set())
            if sub_id in _subscriptions
        ]


def get_subscriptions_to_trigger(route_id: str, stop_id: str, eta_min: float) -> list[dict]:
    """
    Dado el ETA actual (minutos) de un bus hacia un paradero de una ruta,
    devuelve las suscripciones que deben disparar notificación ahora
    (eta_min <= anticipation_min) y que no se hayan disparado ya para este
    acercamiento. Las marca como 'triggered' para no reenviar.

    Si el bus se aleja de nuevo (eta_min vuelve a subir por encima del
    umbral + margen), se resetea 'triggered' para permitir una próxima
    alerta en el siguiente acercamiento.
    """
    with _lock:
        sub_ids = _subscriptions_by_room.get(_room_key(route_id, stop_id), set())
        to_trigger = []

        for sub_id in sub_ids:
            sub = _subscriptions.get(sub_id)
            if not sub:
                continue

            umbral = sub["anticipation_min"]

            if eta_min <= umbral:
                if not sub["triggered"]:
                    sub["triggered"] = True
                    to_trigger.append(dict(sub))
            elif eta_min > umbral + 2:
                sub["triggered"] = False

        return to_trigger