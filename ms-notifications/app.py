import os
from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

from sockets.events import socketio

def create_app():
    app = Flask(__name__)
    CORS(app, resources={r"/*": {"origins": "*"}})
    
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'default-secret-key')

    # Register blueprints for webhooks
    from routes.webhooks import webhooks_bp
    app.register_blueprint(webhooks_bp, url_prefix='/api/v1')

    socketio.init_app(app, cors_allowed_origins="*")
    return app

if __name__ == '__main__':
    app = create_app()
    port = int(os.getenv('PORT', 5002))
    # Run the app via SocketIO
    socketio.run(app, host='0.0.0.0', port=port, debug=True, allow_unsafe_werkzeug=True)
