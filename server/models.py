from flask_sqlalchemy import SQLAlchemy
from uuid import uuid4

db = SQLAlchemy()


def get_uuid():
    return uuid4().hex


class User(db.Model):
    __tablename__ = "users"
    id = db.Column(db.String(32), primary_key=True, default=get_uuid)
    email = db.Column(db.String(345), unique=True, nullable=False)
    password = db.Column(db.Text, nullable=False)
    api_key = db.Column(db.String(64), unique=True)

    def generate_api_key(self):
        self.api_key = uuid4().hex  # 32-char secure key
