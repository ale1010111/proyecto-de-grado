// src/services/api.ts

import { getAccessToken, setAccessToken, clearAccessToken } from "./authService";

const BASE_URL = "http://127.0.0.1:8000";

export const apiFetch = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {

  const token = getAccessToken();

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

  // Si el access token expiró
  if (response.status === 401) {

    const refreshResponse = await fetch(`${BASE_URL}/api/refresh/`, {
      method: "POST",
      credentials: "include",
    });

    if (refreshResponse.ok) {
      const data = await refreshResponse.json();
      setAccessToken(data.access);

      // Reintentar request original
      return apiFetch(endpoint, options);
    } else {
      clearAccessToken();
      throw new Error("Sesión expirada");
    }
  }

  return response;
};
