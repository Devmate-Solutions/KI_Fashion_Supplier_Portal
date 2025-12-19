import apiClient from "../apiClient";

export async function getProductTypes(params = {}) {
  const { data } = await apiClient.get("/product-types", { params });
  return data.data;
}

export async function createProductType(payload) {
  const { data } = await apiClient.post("/product-types", payload);
  return data.data || data;
}