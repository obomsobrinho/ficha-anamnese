import { useState } from 'react'
import { useNavigate } from 'react-router'
import { FloatingAction, Screen } from '@/components/layout'
import { PrimaryButton, Skeleton } from '@/components/ui'
import { usePacientes, type PacienteRow } from '@/data/pacientes'
import { useAuth } from '@/features/auth/AuthProvider'
import { profLine, useProfissional } from '@/features/profissional/useProfissional'
import { isoToBR, tsToBR } from '@/lib/dates'
import { PROCEDIMENTOS, STATUS_STYLE } from '@/types'
import { patientView } from './view'

export function ProfHeader() {
  const { data: prof, isPending } = useProfissional()
  const { signOut } = useAuth()
  return (
    <div className="pt-safe">
      <div className="flex items-center gap-3 px-5 pt-2.5 pb-[18px]">
        <div className="box-border size-12 flex-none rounded-full border border-line bg-sand p-[9px]" />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          {isPending && !prof ? (
            <>
              <Skeleton className="h-[22px] w-48" />
              <Skeleton className="h-3.5 w-36" />
            </>
          ) : (
            <>
              <div className="truncate font-serif text-xl leading-[1.1] font-semibold">{prof?.nome}</div>
              <div className="truncate text-xs tracking-[.02em] text-muted">{profLine(prof)}</div>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={signOut}
          className="h-11 flex-none cursor-pointer border-0 bg-transparent px-1 text-[13px] text-muted"
        >
          Sair
        </button>
      </div>
    </div>
  )
}

const norm = (t: string) =>
  (t || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

function Row({ p, onOpen }: { p: PacienteRow; onOpen: () => void }) {
  const v = patientView(p)
  const last = p.atendimentos.length ? p.atendimentos[p.atendimentos.length - 1] : null
  const status = last
    ? `${PROCEDIMENTOS[last.procedimento]?.name ?? last.procedimento} · ${last.dentes.join(', ')} · ${last.status}`
    : 'Sem atendimentos'
  const dot = last ? STATUS_STYLE[last.status]?.dot ?? '#D7BFB3' : '#D7BFB3'
  const date = (last ? isoToBR(last.iniciado_em) : tsToBR(p.saude_atualizada_em)).slice(0, 5)
  return (
    <div
      onClick={onOpen}
      className="flex cursor-pointer items-center gap-3.5 rounded-2xl px-3 py-3.5 hover:bg-hover active:bg-hover"
    >
      <div className="flex size-11 flex-none items-center justify-center rounded-full bg-avatar text-[15px] font-medium text-terra-dark">
        {v.ini}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
        <div className="truncate text-base font-medium">{p.nome || 'Novo paciente'}</div>
        <div className="flex min-w-0 items-center gap-1.5 text-[13px] text-muted">
          <span className="size-[7px] flex-none rounded-full" style={{ background: dot }} />
          <span className="truncate">{status}</span>
        </div>
      </div>
      <div className="flex flex-none flex-col items-end gap-[3px]">
        <div className="text-[13px] text-muted2">{date}</div>
        <div className="text-xs text-muted">{v.ageLabel}</div>
      </div>
    </div>
  )
}

export function PacientesScreen() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const { data, isPending, isError, refetch } = usePacientes()
  const list = (data || []).filter((p) => norm(p.nome).includes(norm(q)) || (p.telefone || '').includes(q))

  return (
    <Screen>
      <ProfHeader />
      <div className="flex flex-col gap-3.5 px-5">
        <div className="flex items-baseline justify-between">
          <div className="font-serif text-[34px] font-medium">Pacientes</div>
          <div className="text-[13px] text-muted">{data ? `${data.length} fichas` : ''}</div>
        </div>
        <div className="flex h-[50px] items-center gap-2.5 rounded-[14px] bg-sand px-4">
          <span className="size-3.5 flex-none rounded-full border-2 border-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nome ou telefone"
            className="h-12 flex-1 border-0 bg-transparent text-base outline-none focus:outline-none"
          />
        </div>
      </div>
      <div className="flex flex-col px-2 pt-2 pb-[120px]">
        {isPending && !data ? (
          [0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3.5 px-3 py-3.5">
              <Skeleton className="size-11 flex-none rounded-full" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-56" />
              </div>
            </div>
          ))
        ) : isError && !data ? (
          <div className="flex flex-col items-center gap-3 px-3 py-8 text-center text-[15px] text-muted">
            Não foi possível carregar os pacientes.
            <button type="button" onClick={() => refetch()} className="h-11 cursor-pointer border-0 bg-transparent text-terra">
              Tentar de novo
            </button>
          </div>
        ) : (
          <>
            {list.map((p) => (
              <Row key={p.id} p={p} onOpen={() => navigate(`/pacientes/${p.id}`)} />
            ))}
            {!list.length && (
              <div className="px-3 py-8 text-center text-[15px] text-muted">Nenhum paciente encontrado.</div>
            )}
          </>
        )}
      </div>
      <FloatingAction>
        <PrimaryButton onClick={() => navigate('/pacientes/nova')} className="shadow-[0_10px_24px_rgba(163,96,75,.35)]">
          <span className="text-2xl leading-none font-light">+</span>Nova ficha
        </PrimaryButton>
      </FloatingAction>
    </Screen>
  )
}
