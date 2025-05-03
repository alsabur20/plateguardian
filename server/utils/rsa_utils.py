from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.backends import default_backend
import os

KEYS_DIR = "keys"
SERVER_PRIVATE_KEY_PATH = os.path.join(KEYS_DIR, "private.pem")
SERVER_PUBLIC_KEY_PATH = os.path.join(KEYS_DIR, "public.pem")


# === Server Key Loading ===


def load_server_private_key():
    with open(SERVER_PRIVATE_KEY_PATH, "rb") as f:
        private_key = serialization.load_pem_private_key(
            f.read(), password=None, backend=default_backend()
        )
    return private_key


def load_server_public_key():
    with open(SERVER_PUBLIC_KEY_PATH, "rb") as f:
        public_key = serialization.load_pem_public_key(
            f.read(), backend=default_backend()
        )
    return public_key


# === Serialization ===


def serialize_public_key(public_key):
    return public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    ).decode("utf-8")


def deserialize_public_key(pem_data):
    if isinstance(pem_data, str):
        pem_data = pem_data.encode("utf-8")

    return serialization.load_pem_public_key(pem_data, backend=default_backend())


# === Encryption/Decryption ===


def encrypt_with_public_key(public_key, data: bytes) -> bytes:
    return public_key.encrypt(
        data,
        padding.OAEP(
            mgf=padding.MGF1(algorithm=hashes.SHA256()),
            algorithm=hashes.SHA256(),
            label=None,
        ),
    )


def decrypt_with_private_key(private_key, encrypted_data: bytes) -> bytes:
    return private_key.decrypt(
        encrypted_data,
        padding.OAEP(
            mgf=padding.MGF1(algorithm=hashes.SHA256()),
            algorithm=hashes.SHA256(),
            label=None,
        ),
    )


# Convenience: for decryption using only private key file
def decrypt_with_private_key_bytes(private_key, encrypted_data: bytes) -> bytes:
    return decrypt_with_private_key(private_key, encrypted_data)
