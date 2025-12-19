import apiClient from "../apiClient";

export async function getSupplierProfile(supplierId) {
  const { data } = await apiClient.get(`/suppliers/${supplierId}`);
  return data.data;
}

export async function updateSupplierProfile(supplierId, payload) {
  const { data } = await apiClient.put(`/suppliers/${supplierId}`, payload);
  return data.data;
}

export async function createSupplierProfile(payload) {
  const { data } = await apiClient.post("/suppliers", payload);
  return data.data;
}
