import eventlet
eventlet.monkey_patch()

import os
import requests
import random

from datetime import datetime
from math import radians, sin, cos, sqrt, atan2

from flask import request
from flask_socketio import SocketIO, emit, join_room

socketio = SocketIO( cors_allowed_origins="*", async_mode="eventlet", logger=True, engineio_logger=True,
)

MS_SECURITY_URL = os.getenv(
    "MS_SECURITY_URL",
    "http://ms_security:5000/api/v1/auth/validate"
)

# ==========================================================
# Estado global de simulaciones activas
# ==========================================================

from threading import Lock

active_routes = {}

routes_lock = Lock()

# ==========================================================
# Seguridad
# ==========================================================

def validate_token_with_security(token):
    """
    Realiza una petición HTTP a ms_security para validar el JWT.
    """
    if not token:
        return False, None

    try:
        headers = {
            "Authorization": f"Bearer {token}"
        }

        response = requests.get(
            MS_SECURITY_URL,
            headers=headers,
            timeout=5
        )

        if response.status_code == 200:
            return True, response.json().get("user")

        return False, None

    except Exception as e:
        print(f"Error al validar token con ms_security: {e}")
        return False, None


# ==========================================================
# Helpers GPS
# ==========================================================

def calcular_distancia(lat1, lon1, lat2, lon2):
    """
    Fórmula Haversine.
    Retorna distancia en metros.
    """

    radio_tierra = 6371000

    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)

    a = (
        sin(dlat / 2) ** 2
        + cos(radians(lat1))
        * cos(radians(lat2))
        * sin(dlon / 2) ** 2
    )

    c = 2 * atan2(sqrt(a), sqrt(1 - a))

    return radio_tierra * c


# ==========================================================
# Eventos base
# ==========================================================

@socketio.on("connect")
def handle_connect(auth):

    print(
        f"[WS] Conectado {request.sid}"
    )

    join_room("all")

    emit(
        "connected",
        {
            "status": "success",
            "message": "socket conectado"
        }
    )


@socketio.on("disconnect")
def handle_disconnect():

    print(
        f"[WS] 🔴 Desconectado (SID: {request.sid})"
    )


# ==========================================================
# Seguimiento de rutas
# ==========================================================

@socketio.on("join_route_tracking")
def join_route_tracking(data):

    route_id = data["routeId"]

    join_room(
        f"route_{route_id}"
    )

    with routes_lock:

        if route_id in active_routes:

            print(
                f"[TRACKING] Ruta ya activa {route_id}"
            )

            emit(
                "tracking_joined",
                {
                    "routeId":
                    route_id
                }
            )

            return

        active_routes[
            route_id
        ] = {

            "nodes":
            data["rutaNodos"],

            "stops":
            data["rutaParaderos"],

            "current_index":
            0,

            "running":
            True,
        }

    print(
        f"[TRACKING] Iniciando simulador {route_id}"
    )

    socketio.start_background_task(
        simulate_route,
        route_id
    )

    emit(
        "tracking_joined",
        {
            "routeId":
            route_id
        }
    )


@socketio.on("leave_route_tracking")
def leave_route_tracking(data):

    route_id = data["routeId"]

    print(
        f"[TRACKING] Cancelando ruta {route_id}"
    )

    if route_id in active_routes:
        del active_routes[route_id]


# ==========================================================
# Simulador
# ==========================================================

def simulate_route(route_id):

    print(
        f"[SIMULATOR] Iniciando simulación de ruta {route_id}"
    )

    while route_id in active_routes:

        route = active_routes[route_id]

        nodes = route["nodes"]
        stops = route["stops"]

        if not nodes:
            break

        idx = route["current_index"]

        node = nodes[idx]

        lat = float(node["nodo"]["latitud"])
        lng = float(node["nodo"]["longitud"])

        bus_id = f"BUS-{route_id[:6]}"
        placa = f"SIM-{route_id[:4]}"

        # ==========================================
        # POSICIÓN GPS
        # ==========================================

        socketio.emit(
            "route_bus_location_updated",
            {
                "busId": bus_id,
                "placa": placa,
                "routeId": route_id,
                "lat": lat,
                "lng": lng,
                "timestamp": datetime.utcnow().isoformat()
            },
            to=f"route_{route_id}"
        )

        # ==========================================
        # PARADERO MÁS CERCANO
        # ==========================================

        nearest_stop = None
        min_distance = float("inf")

        for stop_wrapper in stops:

            stop = stop_wrapper["paradero"]

            distance = calcular_distancia(
                lat,
                lng,
                float(stop["latitud"]),
                float(stop["longitud"])
            )

            if distance < min_distance:

                min_distance = distance
                nearest_stop = stop

        if nearest_stop:

            socketio.emit(
                "nearby_bus_updated",
                {
                    "busId": bus_id,
                    "paraderoId": nearest_stop["id"],
                    "paraderoNombre": nearest_stop["nombre"],
                    "paraderoLat": float(
                        nearest_stop["latitud"]
                    ),
                    "paraderoLng": float(
                        nearest_stop["longitud"]
                    ),
                    "distanciaMetros": round(
                        min_distance
                    )
                },
                to=f"route_{route_id}"
            )

        # ==========================================
        # ETA
        # ==========================================

        eta_segundos = max(
            0,
            (len(nodes) - idx) * 20
        )

        socketio.emit(
            "stop_arrival_estimation",
            {
                "busId": bus_id,
                "etaSegundos": eta_segundos,
                "ocupacionPorcentaje": random.randint(
                    10,
                    95
                )
            },
            to=f"route_{route_id}"
        )

        # ==========================================
        # RETRASO
        # ==========================================

        delay = random.randint(0, 1200)

        if delay >= 900:
            nivel = "critico"
        elif delay >= 300:
            nivel = "moderado"
        elif delay >= 60:
            nivel = "leve"
        else:
            nivel = "en_tiempo"

        socketio.emit(
            "route_delay_updated",
            {
                "busId": bus_id,
                "nivelRetraso": nivel
            },
            to=f"route_{route_id}"
        )

        # ==========================================
        # SIGUIENTE NODO
        # ==========================================

        route["current_index"] = (
            idx + 1
        ) % len(nodes)

        socketio.sleep(10)

    print(
        f"[SIMULATOR] Finalizada simulación {route_id}"
    )