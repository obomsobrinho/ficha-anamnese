import { createBrowserRouter } from 'react-router'
import { AuthScreen } from '@/features/auth/AuthScreen'
import { PacientesScreen } from '@/features/pacientes/PacientesScreen'
import { Frame, RequireAuth } from './AppShell'

export const router = createBrowserRouter([
  {
    element: <Frame />,
    children: [
      { path: '/entrar', element: <AuthScreen /> },
      {
        element: <RequireAuth />,
        children: [{ path: '/', element: <PacientesScreen /> }],
      },
    ],
  },
])
