import { createBrowserRouter } from 'react-router'
import { AuthScreen } from '@/features/auth/AuthScreen'
import { PacienteScreen } from '@/features/pacientes/PacienteScreen'
import { PacientesScreen } from '@/features/pacientes/PacientesScreen'
import { SaudeScreen } from '@/features/pacientes/SaudeScreen'
import { Frame, RequireAuth } from './AppShell'

export const router = createBrowserRouter([
  {
    element: <Frame />,
    children: [
      { path: '/entrar', element: <AuthScreen /> },
      {
        element: <RequireAuth />,
        children: [
          { path: '/', element: <PacientesScreen /> },
          { path: '/pacientes/nova', element: <SaudeScreen /> },
          { path: '/pacientes/:pid', element: <PacienteScreen /> },
          { path: '/pacientes/:pid/saude', element: <SaudeScreen /> },
        ],
      },
    ],
  },
])
