import { QueryClient } from '@tanstack/react-query'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 1000 * 60 * 60 * 24,
      retry: 2,
      refetchOnWindowFocus: true,
    },
    mutations: { retry: 0 },
  },
})

/** Last known data is restored instantly on reopen, then revalidated in the background. */
export const persister = createSyncStoragePersister({
  storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  key: 'ficha-cache',
  throttleTime: 1000,
})

export function clearPersistedCache() {
  queryClient.clear()
  try {
    localStorage.removeItem('ficha-cache')
  } catch {
    /* ignore */
  }
}
