from functools import wraps
from flask import session, jsonify, request, current_app
from models import User


def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if "user_id" not in session:
            current_app.logger.warning(
                "Unauthorized access attempt to '%s' from IP: %s",
                request.path,
                request.remote_addr,
            )
            return jsonify({"error": "Unauthorized"}), 401
        return f(*args, **kwargs)

    return decorated_function


def api_key_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        api_key = request.headers.get("X-API-KEY")
        if not api_key:
            return jsonify({"error": "API key missing"}), 401

        user = User.query.filter_by(api_key=api_key).first()
        if not user:
            return jsonify({"error": "Invalid API key"}), 403

        # Optionally: attach user to global context (e.g., g.user = user)
        return f(*args, **kwargs)

    return decorated_function
