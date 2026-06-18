import os
from functools import wraps
from flask import Blueprint, request, jsonify
from sockets.events import socketio

from services import stop_alerts_store

webhooks_bp = Blueprint('webhooks', __name__)

INTERNAL_API_KEY = os.getenv("N8N_WEBHOOK_API_KEY", "default-dev-api-key")

def require_api_key(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        api_key = request.headers.get("X-API-Key")
        if not api_key or api_key != INTERNAL_API_KEY:
            return jsonify({"error": "No autorizado"}), 401
        return f(*args, **kwargs)
    return decorated

def emit_event(data):
    """
    Procesa el payload estándar y lo emite por WebSocket.
    """
    event_type = data.get("event_type", "general_alert")
    target = data.get("target", {})
    scope = target.get("scope", "all")
    target_id = target.get("id")
    
    # Determinar la sala (room) a la cual enviar el evento
    room = None
    if scope == "all":
        room = "all"
    elif scope == "user" and target_id:
        room = f"user_{target_id}"
    elif scope == "role" and target_id:
        room = f"role_{target_id}"
    elif scope == "route" and target_id:
        room = f"route_{target_id}"
    elif scope == "zone" and target_id:
        room = f"zone_{target_id}"
    else:
        room = "all"
        
    socketio.emit(event_type, data, to=room)

@webhooks_bp.route('/webhooks/alerts', methods=['POST'])
@require_api_key
def webhook_alerts():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Payload inválido"}), 400
    
    emit_event(data)
    return jsonify({"status": "ok", "message": "Alerta emitida"}), 200

@webhooks_bp.route('/webhooks/messages', methods=['POST'])
@require_api_key
def webhook_messages():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Payload inválido"}), 400
    
    emit_event(data)
    return jsonify({"status": "ok", "message": "Mensaje emitido"}), 200

@webhooks_bp.route('/webhooks/stop-arrival', methods=['POST'])
@require_api_key
def webhook_stop_arrival():
    """
    Webhook que dispara las alertas de 'bus a X minutos del paradero'.

    Lo invoca ms-business cada vez que recalcula el ETA de un bus hacia los
    paraderos de su ruta (al recibir una actualización de GPS).

    Payload esperado:
    {
        "route_id": "uuid-ruta",
        "stop_id": "uuid-paradero",
        "bus_id": "uuid-bus",
        "placa": "ABC-123",
        "eta_min": 4.5
    }

    Por cada suscripción que cumpla (eta_min <= anticipation_min) y no se
    haya disparado ya para este acercamiento, se emite el evento
    'stop_alert_triggered' directamente al socket (sid) del ciudadano.
    """
    data = request.get_json()
    if not data:
        return jsonify({"error": "Payload inválido"}), 400

    route_id = data.get("route_id")
    stop_id = data.get("stop_id")
    eta_min = data.get("eta_min")

    if not route_id or not stop_id or eta_min is None:
        return jsonify({
            "error": "route_id, stop_id y eta_min son obligatorios"
        }), 400

    try:
        eta_min = float(eta_min)
    except (TypeError, ValueError):
        return jsonify({"error": "eta_min debe ser numérico"}), 400

    subscriptions = stop_alerts_store.get_subscriptions_to_trigger(
        route_id, stop_id, eta_min
    )

    for sub in subscriptions:
        socketio.emit(
            "stop_alert_triggered",
            {
                "subscription_id": sub["id"],
                "route_id": route_id,
                "stop_id": stop_id,
                "bus_id": data.get("bus_id"),
                "placa": data.get("placa"),
                "eta_min": eta_min,
                "anticipation_min": sub["anticipation_min"],
                "title": "🚌 Tu bus está cerca",
                "body": f"Llega en aproximadamente {round(eta_min)} min a tu paradero.",
            },
            to=sub["sid"],
        )

    return jsonify({
        "status": "ok",
        "triggered_count": len(subscriptions),
    }), 200
