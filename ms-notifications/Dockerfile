FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Flask-SocketIO runs by default on 5000, we'll use 5002 for this microservice.
ENV PORT=5002
EXPOSE 5002

CMD ["python", "app.py"]
