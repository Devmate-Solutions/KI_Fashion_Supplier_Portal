import apiClient from "../apiClient";

export async function getReturns(params = {}) {
  const { data } = await apiClient.get("/returns", { params });
  return data.data || data;
}

export async function getReturn(returnId) {
  const { data } = await apiClient.get(`/returns/${returnId}`);
  return data.data || data;
}

export async function getReturnsByDispatchOrder(dispatchOrderId) {
  const { data } = await apiClient.get(`/returns/dispatch-order/${dispatchOrderId}`);
  return data.data || data;
}

