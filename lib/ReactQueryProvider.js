
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

export default function ReactQueryProvider({ children }) {
  // ✅ On-demand revalidation: data never goes stale by time.
  // Cache is invalidated explicitly when mutations happen.
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: Infinity,              // Data never auto-stales — invalidated on-demand only
        gcTime: 30 * 60 * 1000,          // 30 minutes garbage collection for memory management
        retry: 1,                         // Retry failed requests once
        refetchOnWindowFocus: false,      // Don't refetch on window focus
        refetchOnMount: false,            // Don't refetch if data exists
        refetchOnReconnect: false,        // Don't auto-refetch on reconnect
        networkMode: 'online',            // Only fetch when online
      },
      mutations: {
        retry: 1,
        retryDelay: 1000,
        networkMode: 'online',
      },
    },
  }));

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      queryClient.clear();
    };
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Enable React Query DevTools in development */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
      )}
    </QueryClientProvider>
  );
}