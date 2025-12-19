"use client";

import { SWRConfig } from "swr";
import apiClient from "@/lib/apiClient";
import { AuthProvider } from "@/components/providers/AuthProvider";

const fetcher = async (url) => {
  const response = await apiClient.get(url);
  return response.data;
};

export default function Providers({ children }) {
  return (
    <SWRConfig
      value={{
        fetcher,
        revalidateOnFocus: true,
        shouldRetryOnError: false,
        dedupingInterval: 30000, // 30 seconds - prevents duplicate requests within this window
        focusThrottleInterval: 30000, // 30 seconds - throttle revalidation on focus
        errorRetryInterval: 5000, // 5 seconds - wait before retrying on error
      }}
    >
      <AuthProvider>{children}</AuthProvider>
    </SWRConfig>
  );
}
