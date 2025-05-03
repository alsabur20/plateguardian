from flask_bcrypt import Bcrypt

bcrypt = Bcrypt()


def hash_password(password):
    return bcrypt.generate_password_hash(password)


def check_password(password, hashed):
    return bcrypt.check_password_hash(hashed, password)
