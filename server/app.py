from flask import Flask, request, jsonify, session
from flask_bcrypt import Bcrypt
from flask_cors import CORS, cross_origin
from flask_session import Session
from werkzeug.utils import secure_filename
import os
import logging
from logging.handlers import RotatingFileHandler


from config import ApplicationConfig
from models import db, User
from utils.model_utils import extract_license_plate_text
from utils.auth_utils import login_required, api_key_required


app = Flask(__name__)
app.config.from_object(ApplicationConfig)

bcrypt = Bcrypt(app)
CORS(app, supports_credentials=True)
server_session = Session(app)
db.init_app(app)

with app.app_context():
    # db.drop_all() only use once after making changes to the database schema
    db.create_all()


# Setup Logging
log_dir = "logs"
os.makedirs(log_dir, exist_ok=True)

log_file = os.path.join(log_dir, "app.log")
handler = RotatingFileHandler(log_file, maxBytes=1_000_000, backupCount=3)
formatter = logging.Formatter("[%(asctime)s] %(levelname)s: %(message)s")
handler.setFormatter(formatter)

app.logger.setLevel(logging.INFO)
app.logger.addHandler(handler)


@app.route("/ocr", methods=["POST"])
@cross_origin()
@api_key_required
@login_required
def ocr_license_plate():
    app.logger.info("OCR request received from IP: %s", request.remote_addr)

    if "image" not in request.files:
        app.logger.warning("OCR request failed: No image file provided")
        return jsonify({"error": "No image file provided"}), 400

    file = request.files["image"]
    filename = secure_filename(file.filename)
    upload_dir = "temp_uploads"
    os.makedirs(upload_dir, exist_ok=True)
    filepath = os.path.join(upload_dir, filename)
    file.save(filepath)

    try:
        extracted_text = extract_license_plate_text(filepath)
        app.logger.info("OCR success for file: %s", filename)
        return jsonify({"extracted_text": extracted_text}), 200
    except Exception as e:
        app.logger.error("OCR failed for file: %s with error: %s", filename, str(e))
        return jsonify({"error": str(e)}), 500
    finally:
        if os.path.exists(filepath):
            os.remove(filepath)


@cross_origin()
@app.route("/@me", methods=["GET"])
def get_current_user():
    user_id = session.get("user_id")
    if not user_id:
        app.logger.warning(
            "Unauthorized /@me access attempt from IP: %s", request.remote_addr
        )
        return jsonify({"error": "Unauthorized"}), 401

    user = User.query.filter_by(id=user_id).first()
    if not user:
        app.logger.warning("User not found for session user_id: %s", user_id)
        return jsonify({"error": "User not found"}), 404

    app.logger.info("User info fetched for user_id: %s", user_id)
    return jsonify({"id": user.id, "email": user.email}), 200


@cross_origin()
@app.route("/register", methods=["POST"])
def register():
    email = request.json.get("email")
    password = request.json.get("password")

    user_exists = User.query.filter_by(email=email).first() is not None

    if user_exists:
        app.logger.warning(
            "Registration attempt failed: User already exists (%s)", email
        )
        return jsonify({"error": "User already exists"}), 409

    new_user = User(email=email, password=bcrypt.generate_password_hash(password))
    new_user.generate_api_key()

    db.session.add(new_user)
    db.session.commit()

    session["user_id"] = new_user.id
    app.logger.info("New user registered: %s (id: %s)", email, new_user.id)

    return (
        jsonify(
            {"id": new_user.id, "email": new_user.email, "api_key": new_user.api_key}
        ),
        201,
    )


@cross_origin()
@app.route("/login", methods=["POST"])
def login():
    email = request.json.get("email")
    password = request.json.get("password")

    user = User.query.filter_by(email=email).first()

    if user and bcrypt.check_password_hash(user.password, password):
        session["user_id"] = user.id
        app.logger.info("User logged in: %s (id: %s)", email, user.id)
        return jsonify({"id": user.id, "email": user.email}), 200

    app.logger.warning("Failed login attempt for: %s", email)
    return jsonify({"error": "Unauthorized"}), 401


@cross_origin()
@app.route("/logout", methods=["POST"])
def logout():
    user_id = session.get("user_id")
    session.pop("user_id", None)
    app.logger.info("User logged out (user_id: %s)", user_id)
    return jsonify({"message": "Logged out successfully"}), 200


@app.errorhandler(Exception)
def handle_exception(e):
    app.logger.exception("Unhandled Exception occurred: %s", str(e))
    return jsonify({"error": "Something went wrong"}), 500


if __name__ == "__main__":
    app.run(debug=True)
