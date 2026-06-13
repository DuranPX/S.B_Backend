# Contrato de Eventos - ms-notifications

Todas las aplicaciones (backend, webhooks, frontend) deben respetar el siguiente contrato de payload JSON para la emisión y recepción de eventos a través de los webhooks y WebSockets.

## Payload Estándar

```json
{
  "event_type": "alert_urgent",
  "target": {
    "scope": "all" | "route" | "zone" | "user" | "role",
    "id": "valor_opcional_segun_scope"
  },
  "payload": {
    "title": "Título de la alerta o evento",
    "body": "Cuerpo del mensaje",
    "data": {
      "extra_info": "Cualquier información adicional necesaria"
    }
  },
  "timestamp": "2026-06-12T10:00:00Z"
}
```

## Canales (Rooms / Scopes)

El campo `target.scope` determina a quiénes llegará el mensaje:
- `all`: Broadcast a todos los usuarios conectados.
- `user`: Se enviará solo al usuario especificado en `target.id`.
- `role`: Se enviará a los usuarios que tengan el rol especificado en `target.id`.
- `route`: Se enviará a los clientes suscritos a la ruta especificada en `target.id`.
- `zone`: Se enviará a los clientes suscritos a la zona especificada en `target.id`.

## Tipos de Eventos (`event_type`)

Se pueden crear nuevos tipos de eventos bajo demanda, pero los principales sugeridos para este proyecto son:
- `alert_urgent`: Alertas críticas del sistema o de rutas.
- `messages`: Mensajes directos o de sistema para usuarios.
- `position_update`: Actualizaciones de coordenadas GPS de los buses.

## Consumo vía Webhook

Para disparar un evento desde `ms-business` o `n8n`, se debe hacer un POST a los siguientes endpoints de `ms-notifications`:

- `POST /api/v1/webhooks/alerts`
- `POST /api/v1/webhooks/messages`
- `POST /api/v1/webhooks/positions`

**Autenticación**:
Se debe incluir el header de autorización `X-API-Key`.
Ejemplo:
```http
POST /api/v1/webhooks/alerts HTTP/1.1
Host: ms-notifications:5002
X-API-Key: N8N_WEBHOOK_API_KEY_AQUI
Content-Type: application/json
```
