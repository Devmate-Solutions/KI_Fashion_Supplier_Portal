import apiClient from "../apiClient";

export async function getPendingBalances(supplierId) {
  const response = await apiClient.get(`/balances/pending`, {
    params: { supplierId },
  });
  // Handle different response structures
  const data = response?.data || response;
  // Return the data structure matching CRM expectations
  return {
    balances: data?.data?.balances || data?.balances || [],
    totals: data?.data?.totals || data?.totals || { cashPending: 0, bankPending: 0, totalPending: 0 }
  };
}

