import os
import requests
from flask import Blueprint, request, jsonify

webhooks_bp = Blueprint('webhooks', __name__)

N8N_BASE_URL = os.getenv('N8N_BASE_URL', 'http://n8n:5678')
N8N_API_KEY = os.getenv('N8N_WEBHOOK_API_KEY', 'buses-api-n8n')
MS_BUSINESS_URL = os.getenv('MS_BUSINESS_URL', 'http://ms-business:3000/api')

HEADERS_N8N = {
    'Content-Type': 'application/json',
    'x-api-key': N8N_API_KEY,
}


def call_n8n(path: str, payload: dict):
    url = f"{N8N_BASE_URL}/webhook/{path}"

    response = requests.post(
        url,
        json=payload,
        headers=HEADERS_N8N,
        timeout=30
    )

    print("STATUS:", response.status_code)
    print("CONTENT-TYPE:", response.headers.get("content-type"))
    print("BODY:", response.text)

    response.raise_for_status()

    try:
        return response.json()
    except Exception:
        return {
            "raw_response": response.text,
            "content_type": response.headers.get("content-type")
        }


def call_business(method: str, path: str, payload: dict = None):
    """Helper para llamar ms-business."""
    url = f"{MS_BUSINESS_URL}/{path}"
    if method.upper() == 'GET':
        response = requests.get(url, timeout=10)
    elif method.upper() == 'PATCH':
        response = requests.patch(url, json=payload, timeout=10)
    else:
        response = requests.post(url, json=payload, timeout=10)
    response.raise_for_status()
    return response.json()


# ─────────────────────────────────────────────
# CITAS
# ─────────────────────────────────────────────

@webhooks_bp.route('/citas/disponibilidad', methods=['POST'])
def citas_disponibilidad():
    """
    Frontend → ms-notifications → n8n → Google Calendar FreeBusy → slots
    Body: { tipoAtencion, tipoConsulta }
    """
    try:
        body = request.get_json() or {}
        resultado = call_n8n('citas-disponibilidad', body)
        return jsonify(resultado), 200
    except requests.exceptions.RequestException as e:
        return jsonify({'error': 'Error consultando disponibilidad', 'detail': str(e)}), 502
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@webhooks_bp.route('/citas/confirmar', methods=['POST'])
def citas_confirmar():
    """
    Frontend → ms-notifications → n8n → Google Calendar (crea evento) → email
    Body: { nombre, email, tipoAtencion, tipoConsulta, asesorId,
            calendarId, fechaInicio, fechaFin, motivo }
    """
    try:
        body = request.get_json() or {}
        resultado = call_n8n('citas-confirmar', body)
        return jsonify(resultado), 200
    except requests.exceptions.RequestException as e:
        return jsonify({'error': 'Error confirmando cita', 'detail': str(e)}), 502
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ─────────────────────────────────────────────
# PQRS
# ─────────────────────────────────────────────

@webhooks_bp.route('/pqrs', methods=['POST'])
def pqrs_crear():
    """
    Frontend → ms-notifications → n8n (genera radicado, guarda en BD, envía emails)
    Body: { tipo, categoria, descripcion, emailContacto }
    """
    try:
        body = request.get_json() or {}
        resultado = call_n8n('pqrs-crear', body)
        return jsonify(resultado), 201
    except requests.exceptions.RequestException as e:
        return jsonify({'error': 'Error creando PQRS', 'detail': str(e)}), 502
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@webhooks_bp.route('/pqrs/<radicado>', methods=['GET'])
def pqrs_consultar(radicado: str):
    """
    Frontend → ms-notifications → ms-business (consulta estado)
    """
    try:
        resultado = call_business('GET', f'pqrs/radicado/{radicado}')
        return jsonify(resultado), 200
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 404:
            return jsonify({'error': f'PQRS {radicado} no encontrada'}), 404
        return jsonify({'error': str(e)}), 502
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@webhooks_bp.route('/pqrs/<radicado>/estado', methods=['PATCH'])
def pqrs_cambiar_estado(radicado: str):
    """
    Agente cambia estado → ms-notifications → ms-business (actualiza BD)
                                            → n8n (notifica ciudadano por email)
    Body: { estado, respuesta?, emailContacto }
    """
    try:
        body = request.get_json() or {}

        # 1. Actualizar en ms-business
        call_business('PATCH', f'pqrs/radicado/{radicado}/estado', {
            'estado': body.get('estado'),
            'respuesta': body.get('respuesta'),
        })

        # 2. Notificar al ciudadano via n8n
        call_n8n('pqrs-estado', {
            'radicado': radicado,
            'nuevoEstado': body.get('estado'),
            'respuesta': body.get('respuesta', ''),
            'emailContacto': body.get('emailContacto'),
        })

        return jsonify({'success': True, 'message': 'Estado actualizado y ciudadano notificado'}), 200
    except requests.exceptions.RequestException as e:
        return jsonify({'error': 'Error actualizando estado', 'detail': str(e)}), 502
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ─────────────────────────────────────────────
# CLIMA (toggle desde perfil)
# ─────────────────────────────────────────────

@webhooks_bp.route('/clima/alerta', methods=['PATCH'])
def clima_toggle_alerta():
    """
    Frontend → ms-notifications → ms-business (actualiza preferencia)
    Body: { ciudadanoId, activa, horarioViaje? }
    """
    try:
        body = request.get_json() or {}
        ciudadano_id = body.get('ciudadanoId')

        if not ciudadano_id:
            return jsonify({'error': 'ciudadanoId es requerido'}), 400

        resultado = call_business('PATCH', f'ciudadano/{ciudadano_id}/alerta-clima', {
            'activa': body.get('activa', False),
            'horarioViaje': body.get('horarioViaje'),
        })

        return jsonify(resultado), 200
    except requests.exceptions.RequestException as e:
        return jsonify({'error': 'Error actualizando alerta de clima', 'detail': str(e)}), 502
    except Exception as e:
        return jsonify({'error': str(e)}), 500