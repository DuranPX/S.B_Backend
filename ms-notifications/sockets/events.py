import os
import requests
from flask_socketio import SocketIO, emit, join_room, disconnect
from flask import request

from services import stop_alerts_store

socketio = SocketIO(cors_allowed_origins="*")

MS_SECURITY_URL = os.getenv("MS_SECURITY_URL", "http://ms_security:5000/api/v1/auth/validate")

# sid -> user_id, para poder asociar las suscripciones de alerta de paradero
# al usuario que las creó sin tener que volver a validar el JWT en cada evento.
_connected_users: dict[str, str] = {}

def validate_token_with_security(token):
    """
    Realiza una petición HTTP a ms_security para validar el JWT.
    """
    if not token:
        return False, None
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(MS_SECURITY_URL, headers=headers, timeout=5)
        if response.status_code == 200:
            return True, response.json().get("user")
        return False, None
    except Exception as e:
        print(f"Error al validar token con ms_security: {e}")
        return False, None

@socketio.on('connect')
def handle_connect(auth):
    """
    Maneja la conexión del websocket.
    Se espera que el frontend envíe el JWT en el objeto auth.
    """
    print(f"[WS] Intento de conexión: {request.sid}")
    
    disable_jwt = os.getenv("DISABLE_JWT", "false").lower() == "true"
    
    if disable_jwt:
        print("[WS] 🟡 MODO TEST: Revisión de JWT desactivada")
        user_data = {"id": "test-user", "role": "Admin"}
        is_valid = True
    else:
        if not auth or 'token' not in auth:
            print("[WS] 🔴 Conexión rechazada: No se proporcionó token")
            return False
        
        token = auth.get('token')
        is_valid, user_data = validate_token_with_security(token)
    
    if not is_valid:
        print("[WS] 🔴 Conexión rechazada: Token inválido")
        return False
    
    if user_data:
        user_id = user_data.get('id')
        user_role = user_data.get('role')
        
        if user_id:
            join_room(f"user_{user_id}")
            _connected_users[request.sid] = user_id
        if user_role:
            join_room(f"role_{user_role}")
            
    join_room("all")
    
    print(f"[WS] 🟢 Conectado al servidor: ms-notifications, Cliente: {request.sid}")
    emit('connected', {'status': 'success', 'message': 'Conectado a ms-notifications'})

    # Si el usuario ya tenía alertas de paradero activas de una conexión
    # anterior (p.ej. recargó la página), se reasocian a este nuevo sid y
    # se le informan, para que el frontend restaure su estado sin que el
    # ciudadano tenga que volver a activarlas manualmente.
    user_id_for_claim = _connected_users.get(request.sid)
    if user_id_for_claim:
        claimed = stop_alerts_store.claim_subscriptions_for_user(
            user_id_for_claim, request.sid
        )
        if claimed:
            print(f"[WS] 🔁 Alertas de paradero restauradas para {user_id_for_claim}: {len(claimed)}")
            emit('stop_alerts_listed', {'subscriptions': claimed})
@socketio.on('disconnect')
def handle_disconnect():
    print(f"[WS] 🔴 Desconectado: io server disconnect (SID: {request.sid})")
    _connected_users.pop(request.sid, None)
    # Ya no se eliminan las alertas: quedan "sueltas" del sid (asociadas
    # solo al user_id) y se reclaman automáticamente si el mismo usuario
    # vuelve a conectarse (ver claim_subscriptions_for_user en handle_connect).
    # Las suscripciones sin user_id sí se limpian dentro de detach_sid.
    stop_alerts_store.detach_sid(request.sid)


@socketio.on('subscribe_stop_alert')
def handle_subscribe_stop_alert(payload):
    """
    El ciudadano activa una alerta para una ruta + paradero específicos,
    con una anticipación en minutos (5, 10 o 15).

    Payload esperado:
    {
        "route_id": "uuid-de-la-ruta",
        "stop_id": "uuid-del-paradero",
        "anticipation_min": 5 | 10 | 15
    }

    Responde con 'stop_alert_confirmed' (ack) o 'stop_alert_error'.
    """
    payload = payload or {}
    route_id = payload.get('route_id')
    stop_id = payload.get('stop_id')
    anticipation_min = payload.get('anticipation_min')

    if not route_id or not stop_id:
        emit('stop_alert_error', {
            'message': 'route_id y stop_id son obligatorios',
        })
        return

    try:
        anticipation_min = int(anticipation_min)
    except (TypeError, ValueError):
        emit('stop_alert_error', {
            'message': 'anticipation_min debe ser un número (5, 10 o 15)',
        })
        return

    try:
        subscription = stop_alerts_store.add_subscription(
            sid=request.sid,
            user_id=_connected_users.get(request.sid),
            route_id=route_id,
            stop_id=stop_id,
            anticipation_min=anticipation_min,
        )
    except ValueError as e:
        emit('stop_alert_error', {'message': str(e)})
        return

    join_room(f"stop_eta:{route_id}:{stop_id}")

    print(f"[WS] 🔔 Alerta de paradero activada: {subscription}")
    emit('stop_alert_confirmed', subscription)


@socketio.on('unsubscribe_stop_alert')
def handle_unsubscribe_stop_alert(payload):
    """
    Desactiva una suscripción de alerta activa.

    Payload esperado: { "subscription_id": "sub_123" }
    """
    payload = payload or {}
    subscription_id = payload.get('subscription_id')

    if not subscription_id:
        emit('stop_alert_error', {
            'message': 'subscription_id es obligatorio',
        })
        return

    removed = stop_alerts_store.remove_subscription(request.sid, subscription_id)

    if removed:
        print(f"[WS] 🔕 Alerta de paradero desactivada: {subscription_id}")
    emit('stop_alert_unsubscribed', {
        'subscription_id': subscription_id,
        'removed': removed,
    })


@socketio.on('list_stop_alerts')
def handle_list_stop_alerts():
    """Devuelve las suscripciones activas del cliente actual (útil al reconectar)."""
    subscriptions = stop_alerts_store.list_for_sid(request.sid)
    emit('stop_alerts_listed', {'subscriptions': subscriptions})