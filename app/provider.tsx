'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Configuración de caché
            staleTime: 5 * 60 * 1000, // 5 minutos - datos considerados "frescos"
            gcTime: 10 * 60 * 1000, // 10 minutos - tiempo en caché
            refetchOnWindowFocus: false, // No refetch al enfocar ventana
            refetchOnReconnect: true, // Sí refetch al reconectar
            retry: 1, // Reintentar 1 vez si falla
          },
          mutations: {
            retry: 0, // No reintentar mutaciones
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* DevTools solo en desarrollo */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />
      )}
    </QueryClientProvider>
  );
}