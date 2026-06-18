FROM python:3.10-slim

# Evita que Python guarde en buffer la salida de print(); sin esto, los
# logs no aparecen en tiempo real en `docker compose logs` (o tardan en
# aparecer), lo cual complica el diagnóstico.
ENV PYTHONUNBUFFERED=1

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Flask-SocketIO runs by default on 5000, we'll use 5002 for this microservice.
ENV PORT=5002
EXPOSE 5002

CMD ["python", "app.py"]
