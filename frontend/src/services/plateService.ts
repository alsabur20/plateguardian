import axios from "axios";
import { ApiResponse, PlateResult } from "../types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export const recognizePlate = async (file: File, apiKey: string) => {
  const formData = new FormData();
  formData.append("image", file);

  try {
    const res = await api.post("/ocr", formData, {
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;
  } catch (error) {
    return { error: "Failed to extract plate" };
  }
};

export const getPlateHistory = async () => {
  try {
    const res = await api.get("/history");
    return res.data; // array of { image_name, extracted_text, timestamp }
  } catch (error) {
    return { error: "Failed to fetch history" };
  }
};
