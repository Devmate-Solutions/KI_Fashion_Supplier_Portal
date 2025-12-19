import apiClient from "../apiClient";

export async function getProducts(params = {}) {
  const { data } = await apiClient.get("/products", { params });
  return data.data;
}

export async function getProduct(productId) {
  const { data } = await apiClient.get(`/products/${productId}`);
  return data.data;
}

export async function createProduct(payload) {
  const { data } = await apiClient.post("/products", payload);
  return data.data;
}

export async function updateProduct(productId, payload) {
  const { data } = await apiClient.put(`/products/${productId}`, payload);
  return data.data;
}

export async function generateProductQr(productId) {
  const { data } = await apiClient.post(`/products/${productId}/qr`);
  return data.data || data;
}

export async function uploadProductMedia(productId, formData) {
  const { data } = await apiClient.post(`/products/${productId}/media`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return data.data;
}

export async function uploadProductImage(productId, imageFile) {
  const formData = new FormData();
  formData.append('image', imageFile);
  
  const { data } = await apiClient.post(`/products/${productId}/images`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return data.data;
}

export async function deleteProductImage(productId, imageUrl) {
  const { data } = await apiClient.delete(`/products/${productId}/images`, {
    data: { imageUrl },
  });
  return data.data;
}