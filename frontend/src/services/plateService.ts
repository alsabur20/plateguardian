import axios from "axios";
import forge from "node-forge";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export const recognizePlate = async (
  file: File,
  apiKeyObj: { api: string; timestamp: string },
  serverPublicKeyPEM: string
) => {
  try {
    const payload = `${apiKeyObj.api}|${apiKeyObj.timestamp}`;

    const serverPublicKey = forge.pki.publicKeyFromPem(serverPublicKeyPEM);

    const encrypted = serverPublicKey.encrypt(payload, "RSA-OAEP", {
      md: forge.md.sha256.create(),
    });

    const encryptedBase64 = forge.util.encode64(encrypted);

    const formData = new FormData();
    formData.append("image", file);
    formData.append("encrypted_api_key", encryptedBase64);

    const res = await api.post("/ocr", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return {
      success: true,
      data: res.data,
    };
  } catch (error) {
    console.error("recognizePlate error:", error);
    return { error: "Failed to extract plate" };
  }
};

export const getPlateHistory = async () => {
  try {
    const res = await api.get("/history");
    return res.data;
  } catch (error) {
    return { error: "Failed to fetch history" };
  }
};
