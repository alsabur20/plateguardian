from functools import wraps
from flask import session, jsonify, request, current_app


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
