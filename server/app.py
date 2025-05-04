from flask import Flask, request, jsonify, session
from flask_bcrypt import Bcrypt
from flask_cors import CORS, cross_origin
from flask_session import Session
from werkzeug.utils import secure_filename
import os
import logging
from logging.handlers import RotatingFileHandler
from datetime import datetime, timedelta
import base64

from config import ApplicationConfig
from models import db, User, OCRHistory
from utils.model_utils import extract_license_plate_text
from utils.auth_utils import login_required
from utils.rsa_utils import (
    load_server_private_key,
    load_server_public_key,
    serialize_public_key,
    deserialize_public_key,
    encrypt_with_public_key,
    decrypt_with_private_key_bytes,
)

app = Flask(__name__)
app.config.from_object(ApplicationConfig)

bcrypt = Bcrypt(app)
CORS(app, supports_credentials=True)
Session(app)
db.init_app(app)

with app.app_context():
    db.create_all()

# Logging
log_dir = "logs"
os.makedirs(log_dir, exist_ok=True)
log_file = os.path.join(log_dir, "app.log")
handler = RotatingFileHandler(log_file, maxBytes=1_000_000, backupCount=3)
formatter = logging.Formatter("[%(asctime)s] %(levelname)s: %(message)s")
handler.setFormatter(formatter)
app.logger.setLevel(logging.INFO)
app.logger.addHandler(handler)

# In-memory store for client public keys
CLIENT_KEYS = {}

# === Routes ===


@cross_origin()
@app.route("/register", methods=["POST"])
def register():
    email = request.json.get("email")
    password = request.json.get("password")
    app.logger.info(f"Attempting to register user: {email}")

    if User.query.filter_by(email=email).first():
        app.logger.warning(f"Registration failed. User already exists: {email}")
        return jsonify({"error": "User already exists"}), 409

    new_user = User(email=email, password=bcrypt.generate_password_hash(password))
    new_user.generate_api_key()
    db.session.add(new_user)
    db.session.commit()
    app.logger.info(f"User registered successfully: {email} (ID: {new_user.id})")

    session["user_id"] = new_user.id
    # Store server public key in session
    server_pub_key = load_server_public_key()
    session["server_pub_key"] = serialize_public_key(server_pub_key)
    return (
        jsonify(
            {
                "id": new_user.id,
                "email": new_user.email,
                "sKey": session["server_pub_key"],
            }
        ),
        201,
    )


@cross_origin()
@app.route("/login", methods=["POST"])
def login():
    email = request.json.get("email")
    password = request.json.get("password")
    app.logger.info(f"Login attempt for user: {email}")

    user = User.query.filter_by(email=email).first()

    if user and bcrypt.check_password_hash(user.password, password):
        session["user_id"] = user.id

        # Store server public key in session
        server_pub_key = load_server_public_key()
        session["server_pub_key"] = serialize_public_key(server_pub_key)

        app.logger.info(f"User logged in: {email} (ID: {user.id})")

        return (
            jsonify(
                {"id": user.id, "email": user.email, "sKey": session["server_pub_key"]}
            ),
            200,
        )

    app.logger.warning(f"Unauthorized login attempt: {email}")
    return jsonify({"error": "Unauthorized"}), 401


@cross_origin()
@app.route("/key-exchange", methods=["POST"])
@login_required
def receive_user_pub_key():
    pem_public_key = request.json.get("client_public_key")
    user_id = session["user_id"]

    if not pem_public_key:
        app.logger.error(f"User {user_id}: Missing client public key")
        return jsonify({"error": "Missing public key"}), 400

    try:
        client_pub_key = deserialize_public_key(pem_public_key)
        CLIENT_KEYS[user_id] = client_pub_key
        app.logger.info(f"Public key stored for user: {user_id}")
        return jsonify({"message": "Public key received and stored"}), 200
    except Exception as e:
        app.logger.error(f"Failed to deserialize public key: {e}")
        return jsonify({"error": "Invalid public key format"}), 400


@cross_origin()
@app.route("/api-key", methods=["GET"])
@login_required
def get_encrypted_api_key():
    user_id = session["user_id"]
    app.logger.info(f"User {user_id} requested encrypted API key")

    user = User.query.get(user_id)
    client_pub_key = CLIENT_KEYS.get(user_id)

    if not client_pub_key:
        app.logger.warning(f"User {user_id} has no client public key registered")
        return jsonify({"error": "No client key registered"}), 400

    # Timestamp with expiry
    timestamp = datetime.utcnow().isoformat()
    payload = f"{user.api_key}|{timestamp}".encode("utf-8")

    encrypted = encrypt_with_public_key(client_pub_key, payload)
    encrypted_b64 = base64.b64encode(encrypted).decode("utf-8")

    app.logger.info(f"API key encrypted and returned to user: {user_id}")
    return jsonify({"encrypted_api_key": encrypted_b64}), 200


@cross_origin()
@app.route("/ocr", methods=["POST"])
@login_required
def ocr_license_plate():
    if "image" not in request.files or "encrypted_api_key" not in request.form:
        app.logger.warning("OCR attempt with missing data.")
        return jsonify({"error": "Missing image or API key"}), 400

    encrypted_key = base64.b64decode(request.form["encrypted_api_key"])
    server_private_key = load_server_private_key()

    try:
        decrypted = decrypt_with_private_key_bytes(server_private_key, encrypted_key)
        api_key_str, timestamp_str = decrypted.decode("utf-8").split("|")

        timestamp = datetime.fromisoformat(timestamp_str)

        app.logger.info(f"Decrypted API key timestamp: {timestamp_str}")

        if datetime.utcnow() - timestamp > timedelta(minutes=20):
            app.logger.warning(f"API key expired | Provided: {timestamp_str}")
            return jsonify({"error": "API key expired"}), 403

        user = User.query.get(session["user_id"])
        if user.api_key != api_key_str:
            app.logger.warning(
                f"API key mismatch | Expected: {user.api_key[:5]}..., Got: {api_key_str[:5]}..."
            )
            return jsonify({"error": "Invalid API key"}), 403
    except Exception as e:
        app.logger.error(f"Decryption/Validation failed: {str(e)}")
        return jsonify({"error": "Invalid API key or format"}), 403

    # Save image and process OCR
    file = request.files["image"]
    filename = secure_filename(file.filename)
    filepath = os.path.join("temp_uploads", filename)
    os.makedirs("temp_uploads", exist_ok=True)
    file.save(filepath)
    app.logger.info(f"Image uploaded: {filename} by user {user.email}")

    try:
        extracted_text = extract_license_plate_text(filepath)
        app.logger.info(f"OCR result: {extracted_text}")
        db.session.add(
            OCRHistory(
                user_id=session["user_id"],
                image_name=filename,
                extracted_text=extracted_text,
            )
        )
        db.session.commit()
        return jsonify({"extracted_text": extracted_text}), 200
    finally:
        if os.path.exists(filepath):
            os.remove(filepath)


@cross_origin()
@app.route("/logout", methods=["POST"])
@login_required
def logout():
    user_id = session.get("user_id")  # Save before clearing
    session.clear()  # Now it's safe to clear

    response = jsonify({"message": "Logged out successfully"})
    response.set_cookie(
        key="session",
        value="",
        expires=0,
        samesite="Lax",
        secure=True,  # True in production
    )

    if user_id:
        app.logger.info(f"User {user_id} logged out successfully")
    else:
        app.logger.warning("Logout attempt without active session")

    return response


@cross_origin()
@app.route("/@me", methods=["GET"])
@login_required
def get_current_user():
    user = User.query.get(session["user_id"])
    return jsonify({"id": user.id, "email": user.email}), 200


@cross_origin()
@app.route("/history", methods=["GET"])
@login_required
def get_ocr_history():
    user_id = session["user_id"]
    app.logger.info(f"Fetching OCR history for user: {user_id}")
    history = (
        OCRHistory.query.filter_by(user_id=user_id)
        .order_by(OCRHistory.timestamp.desc())
        .all()
    )
    return (
        jsonify(
            [
                {
                    "image_name": h.image_name,
                    "extracted_text": h.extracted_text,
                    "timestamp": h.timestamp.isoformat(),
                }
                for h in history
            ]
        ),
        200,
    )


@app.errorhandler(Exception)
def handle_exception(e):
    app.logger.exception("Unhandled Exception: %s", str(e))
    return jsonify({"error": "Something went wrong"}), 500


if __name__ == "__main__":
    app.run(debug=True)  # For development use

    # For production use
    # from gevent import pywsgi

    # http_server = pywsgi.WSGIServer(
    #     ("0.0.0.0", 443), app, keyfile="server.key", certfile="server.crt"
    # )
    # http_server.serve_forever()
