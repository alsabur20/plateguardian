import axios from "axios";

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
