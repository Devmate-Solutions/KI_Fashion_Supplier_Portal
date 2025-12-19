import apiClient from "../apiClient";

export async function login(credentials) {
  const { data } = await apiClient.post("/auth/login", credentials);
  return data;
}

export async function register(payload) {
  const { data } = await apiClient.post("/auth/register", payload);
  return data;
}

export async function getCurrentUser() {
  const { data } = await apiClient.get("/auth/me");
  return data;
}

export async function refreshToken() {
  const { data } = await apiClient.post("/auth/refresh");
  return data;
}

export async function forgotPassword(email, portalSource) {
  const { data } = await apiClient.post("/auth/forgot-password", {
    email,
    portalSource
  });
  return data;
}