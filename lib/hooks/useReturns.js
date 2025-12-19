import useSWR from "swr";
import { getReturns, getReturn } from "@/lib/api/returns";

export function useReturns(params = {}) {
  const { data, error, isLoading, mutate } = useSWR(
    ["returns", params],
    () => getReturns(params)
  );

  return {
    data: data?.returns || data?.rows || data || [],
    isLoading,
    error,
    mutate,
  };
}

export function useReturn(returnId) {
  const { data, error, isLoading, mutate } = useSWR(
    returnId ? ["return", returnId] : null,
    () => getReturn(returnId)
  );

  return {
    data: data?.data || data,
    isLoading,
    error,
    mutate,
  };
}

