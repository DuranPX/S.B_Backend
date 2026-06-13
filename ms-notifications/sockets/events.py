import os
import requests
from flask_socketio import SocketIO, emit, join_room, disconnect
from flask import request

socketio = SocketIO(cors_allowed_origins="*")

MS_SECURITY_URL = os.getenv("MS_SECURITY_URL", "http://ms_security:5000/api/v1/auth/validate")

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
        if user_role:
            join_room(f"role_{user_role}")
            
    join_room("all")
    
    print(f"[WS] 🟢 Conectado al servidor: ms-notifications, Cliente: {request.sid}")
    emit('connected', {'status': 'success', 'message': 'Conectado a ms-notifications'})

@socketio.on('disconnect')
def handle_disconnect():
    print(f"[WS] 🔴 Desconectado: io server disconnect (SID: {request.sid})")
