import axios from "axios";
import forge from "node-forge";
import { toast } from "react-toastify";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export const loginUser = async (email: string, password: string) => {
  try {
    const response = await api.post("/login", { email, password });
    return { success: true, data: response.data };
  } catch (error: any) {
    return {
      success: false,
      error: "Login failed",
    };
  }
};

export const registerUser = async (email: string, password: string) => {
  try {
    const response = await api.post("/register", { email, password });
    return { success: true, data: response.data };
  } catch (error: any) {
    return {
      success: false,
      error: "Registration failed",
    };
  }
};

export const logoutUser = async () => {
  try {
    await api.post("/logout");
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: "Logout failed",
    };
  }
};

export const getCurrentUser = async () => {
  try {
    const response = await api.get("/@me");
    return { success: true, data: response.data };
  } catch (error: any) {
    return {
      success: false,
      error: "Failed to fetch user",
    };
  }
};

export const sendClientPublicKeyToServer = async () => {
  try {
    const keypair = forge.pki.rsa.generateKeyPair({ bits: 2048, e: 0x10001 });

    const clientPublicKeyPEM = forge.pki.publicKeyToPem(keypair.publicKey);
    const clientPrivateKeyPEM = forge.pki.privateKeyToPem(keypair.privateKey);

    const response = await api.post("/key-exchange", {
      client_public_key: clientPublicKeyPEM,
    });

    return {
      success: true,
      data: response.data,
      clientKeyPair: {
        publicKeyPEM: clientPublicKeyPEM,
        privateKeyPEM: clientPrivateKeyPEM,
      },
    };
  } catch (error: any) {
    console.error("Key exchange error:", error);
    return {
      success: false,
      error:
        error?.response?.data?.error || "Key generation or exchange failed",
    };
  }
};

export const getEncryptedApiKey = async (privateKeyPem: string) => {
  try {
    const response = await api.get("/api-key");

    const { encrypted_api_key } = response.data;

    const encryptedBytes = forge.util.decode64(encrypted_api_key);

    const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);

    const decrypted = privateKey.decrypt(encryptedBytes, "RSA-OAEP", {
      md: forge.md.sha256.create(),
    });

    const [apiKey, timestamp] = decrypted.split("|");

    return {
      success: true,
      data: {
        apiKey,
        timestamp,
      },
    };
  } catch (error: any) {
    console.error("Failed to retrieve or decrypt API key", error);
    return {
      success: false,
      error: "Failed to retrieve or decrypt API key",
    };
  }
};
