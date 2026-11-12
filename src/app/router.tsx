import { createBrowserRouter, Navigate } from 'react-router'
import { AtendimentoScreen } from '@/features/atendimentos/AtendimentoScreen'
import { ExameScreen } from '@/features/atendimentos/ExameScreen'
import { ResumoScreen } from '@/features/atendimentos/ResumoScreen'
import { RxScreen } from '@/features/atendimentos/RxScreen'
import { TermoScreen } from '@/features/atendimentos/TermoScreen'
import { TratamentoScreen } from '@/features/atendimentos/TratamentoScreen'
import { CriarAposSaude, DentesScreen, ProcScreen } from '@/features/atendimentos/NovoScreens'
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
          { path: '/pacientes/:pid/novo', element: <ProcScreen /> },
          { path: '/pacientes/:pid/novo/endodontia', element: <DentesScreen /> },
          { path: '/pacientes/:pid/novo/criar', element: <CriarAposSaude /> },
          { path: '/atendimentos/:aid', element: <AtendimentoScreen /> },
          { path: '/atendimentos/:aid/exame', element: <ExameScreen /> },
          { path: '/atendimentos/:aid/rxi', element: <RxScreen key="rxi" kind="rxi" /> },
          { path: '/atendimentos/:aid/rxf', element: <RxScreen key="rxf" kind="rxf" /> },
          { path: '/atendimentos/:aid/trat', element: <TratamentoScreen /> },
          { path: '/atendimentos/:aid/termo', element: <TermoScreen /> },
          { path: '/atendimentos/:aid/resumo', element: <ResumoScreen /> },
        ],
      },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])
