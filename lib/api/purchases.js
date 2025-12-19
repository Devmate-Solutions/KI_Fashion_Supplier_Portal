import apiClient from "../apiClient";

export async function getPurchaseOrders(params = {}) {
  const { data } = await apiClient.get("/purchases", { params });
  return data;
}

export async function getPurchaseOrder(purchaseId) {
  const { data } = await apiClient.get(`/purchases/${purchaseId}`);
  return data.data;
}

export async function updatePurchaseDeliveryStatus(purchaseId, payload) {
  const { data } = await apiClient.patch(`/purchases/${purchaseId}`, payload);
  return data.data || data;
}

export async function updatePurchaseFulfillment(purchaseId, payload) {
  const { data } = await apiClient.patch(`/purchases/${purchaseId}/fulfillment`, payload);
  return data.data || data;
}

export async function createQualityCheck(purchaseId, payload) {
  const { data } = await apiClient.post(`/purchases/${purchaseId}/qa-checks`, payload);
  return data.data || data;
}
