import apiClient from "../apiClient";

export async function getSupplierLedger(supplierId, params = {}) {
  const { data } = await apiClient.get(`/ledger/supplier/${supplierId}`, {
    params,
  });
  return data.data;
}

export async function getSupplierBalance(supplierId) {
  const { data } = await apiClient.get(`/ledger/balance/supplier/${supplierId}`);
  return data.data;
}
