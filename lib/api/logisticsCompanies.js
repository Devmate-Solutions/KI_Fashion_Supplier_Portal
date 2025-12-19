import apiClient from "../apiClient";

export async function getLogisticsCompanies(params = {}) {
  const { data } = await apiClient.get("/logistics-companies", {
    params: { ...params, isActive: true },
  });
  return data.data || data;
}

