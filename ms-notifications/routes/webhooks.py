import os
from functools import wraps
from flask import Blueprint, request, jsonify
from sockets.events import socketio

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

@webhooks_bp.route('/webhooks/positions', methods=['POST'])
@require_api_key
def webhook_positions():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Payload inválido"}), 400
    
    emit_event(data)
    return jsonify({"status": "ok", "message": "Posición emitida"}), 200
