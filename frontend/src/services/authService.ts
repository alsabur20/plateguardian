import axios from "axios";
import forge from "node-forge";

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

export const sendClientPublicKeyToServer = async (
  serverPublicKeyPEM: string
) => {
  try {
    const keypair = forge.pki.rsa.generateKeyPair({ bits: 2048, e: 0x10001 });

    const clientPublicKeyPEM = forge.pki.publicKeyToPem(keypair.publicKey);
    const clientPrivateKeyPEM = forge.pki.privateKeyToPem(keypair.privateKey);

    const serverPublicKey = forge.pki.publicKeyFromPem(serverPublicKeyPEM);

    const encrypted = serverPublicKey.encrypt(clientPublicKeyPEM, "RSA-OAEP", {
      md: forge.md.sha256.create(),
    });

    const encryptedBase64 = forge.util.encode64(encrypted);

    const response = await fetch("http://localhost:5000/key-exchange", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ encrypted_key: encryptedBase64 }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error || "Failed to send public key",
      };
    }

    const responseData = await response.json();

    return {
      success: true,
      data: responseData,
      clientKeyPair: {
        publicKeyPEM: clientPublicKeyPEM,
        privateKeyPEM: clientPrivateKeyPEM,
      },
    };
  } catch (error: any) {
    console.error("Key exchange error:", error);
    return {
      success: false,
      error: "Key generation or exchange failed",
    };
  }
};
