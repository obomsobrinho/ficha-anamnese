import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { Toaster } from 'sonner'
import { router } from '@/app/router'
import { AuthProvider } from '@/features/auth/AuthProvider'
import { persister, queryClient } from '@/lib/queryClient'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister, maxAge: 1000 * 60 * 60 * 24, buster: 'v1' }}
    >
      <AuthProvider>
        <RouterProvider router={router} />
        <Toaster
          position="bottom-center"
          offset={112}
          toastOptions={{
            style: {
              background: '#2B2421',
              color: '#FFFCF6',
              border: 0,
              borderRadius: 14,
              fontFamily: 'Jost, system-ui, sans-serif',
              fontSize: 14,
            },
          }}
        />
      </AuthProvider>
    </PersistQueryClientProvider>
  </StrictMode>,
)
