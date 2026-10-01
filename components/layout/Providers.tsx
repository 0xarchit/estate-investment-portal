"use client";
import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { Toaster } from "react-hot-toast";
export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30000, retry: 1, refetchOnWindowFocus: false },
        },
      }),
  );
  useEffect(() => {
    (window as Window & { __queryClient?: QueryClient }).__queryClient = client;
  }, [client]);
  return (
    <QueryClientProvider client={client}>
      <AuthProvider>
        {children}
        <Toaster position="top-right" toastOptions={{ duration: 5000 }} />
      </AuthProvider>
    </QueryClientProvider>
  );
}
