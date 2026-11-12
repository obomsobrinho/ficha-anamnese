import { useNavigate, useParams } from 'react-router'
import { AlertChips, FloatingAction, Screen, TextBack, useBack } from '@/components/layout'
import { Chevron, PrimaryButton, Skeleton } from '@/components/ui'
import { usePaciente, type AtendimentoLite } from '@/data/pacientes'
import { isoToBR } from '@/lib/dates'
import { ToothChart, type Mark } from '@/lib/teeth'
import { PROCEDIMENTOS, STATUS_STYLE } from '@/types'
import { healthAlerts, patientView } from './view'

export function PacienteScreen() {
  const { pid = '' } = useParams()
  const navigate = useNavigate()
  const back = useBack('/')
  const { data: p, isPending } = usePaciente(pid)
  const v = patientView(p)
  const loading = isPending && !p
  const ats = p?.atendimentos || []

  const marks: Record<number, Mark> = {}
  ats.forEach((t) => {
    const m: Mark = t.status === 'Concluído' ? 'done' : 'trat'
    t.dentes.forEach((n) => {
      if (marks[+n] !== 'trat') marks[+n] = m
    })
  })
  const openAt = (t: AtendimentoLite) => navigate(`/atendimentos/${t.id}`)

  if (!isPending && !p)
    return (
      <Screen>
        <TextBack label="Pacientes" onClick={back} />
        <div className="px-5 py-8 text-center text-[15px] text-muted">Nenhum paciente encontrado.</div>
      </Screen>
    )

  return (
    <Screen>
      <TextBack label="Pacientes" onClick={back} />
      <div className="flex flex-col gap-[22px] px-5 pt-1.5 pb-[120px]">
        <div className="flex items-center gap-3.5">
          <div className="flex size-14 flex-none items-center justify-center rounded-full bg-avatar text-[19px] font-medium text-terra-dark">
            {loading ? '' : v.ini}
          </div>
          <div className="flex min-w-0 flex-col gap-0.5">
            {loading ? (
              <>
                <Skeleton className="h-8 w-52" />
                <Skeleton className="h-4 w-32" />
              </>
            ) : (
              <>
                <div className="font-serif text-[30px] leading-[1.05] font-medium">{v.displayName}</div>
                <div className="text-sm text-muted2">
                  {v.ageLabel} · {v.phoneLabel}
                </div>
              </>
            )}
          </div>
        </div>

        <div
          onClick={() => navigate(`/pacientes/${pid}/saude`)}
          className="flex cursor-pointer flex-col gap-3 rounded-[18px] border border-line bg-white p-4"
        >
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex flex-col gap-0.5">
              <span className="text-base font-medium">Cadastro e saúde</span>
              <span className="text-xs text-muted">{loading ? ' ' : v.healthLabel}</span>
            </div>
            <Chevron />
          </div>
          {loading ? <Skeleton className="h-[30px] w-40 rounded-[15px]" /> : <AlertChips alerts={healthAlerts(p)} />}
        </div>

        <div className="flex flex-col gap-2.5">
          <div className="flex items-baseline justify-between">
            <div className="text-[11px] tracking-[.22em] text-muted uppercase">Atendimentos</div>
            <div className="flex gap-3 text-xs text-muted2">
              <span className="flex items-center gap-[5px]">
                <span className="size-[9px] rounded-[3px] bg-terra" />
                Em andamento
              </span>
              <span className="flex items-center gap-[5px]">
                <span className="size-[9px] rounded-[3px] bg-[#BDB0A8]" />
                Concluído
              </span>
            </div>
          </div>
          <div className="px-[22px] pt-1">
            <ToothChart
              dent="perm"
              sel={null}
              compact
              marks={marks}
              onPick={(n) => {
                const t = ats
                  .slice()
                  .reverse()
                  .find((x) => x.dentes.includes(String(n)))
                if (t) openAt(t)
              }}
            />
          </div>
          {!loading && !ats.length && (
            <div className="rounded-2xl border-[1.5px] border-dashed border-dash p-4 text-center text-[15px] text-pretty text-muted">
              Nenhum atendimento ainda. Toque em “Novo atendimento” para começar.
            </div>
          )}
          <div className="flex flex-col gap-2">
            {ats
              .slice()
              .reverse()
              .map((t) => {
                const st = STATUS_STYLE[t.status] ?? STATUS_STYLE['Em exame']
                const label = t.dentes.join(', ')
                return (
                  <div
                    key={t.id}
                    onClick={() => openAt(t)}
                    className="flex cursor-pointer items-center gap-3.5 rounded-2xl border border-line bg-white px-3.5 py-3"
                  >
                    <div
                      className="box-border flex h-[50px] min-w-[50px] flex-none items-center justify-center rounded-[14px] px-1.5 text-[17px] font-medium"
                      style={{ background: st.tileBg, color: st.tileFg }}
                    >
                      {label}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
                      <div className="text-[15px] leading-[1.25] font-medium">
                        {PROCEDIMENTOS[t.procedimento]?.name ?? t.procedimento} · {label}
                      </div>
                      <div className="flex items-center gap-1.5 text-[13px] text-muted2">
                        <span className="size-[7px] flex-none rounded-full" style={{ background: st.dot }} />
                        {t.status} · desde {isoToBR(t.iniciado_em).slice(0, 5)}
                      </div>
                    </div>
                    <Chevron />
                  </div>
                )
              })}
          </div>
        </div>
      </div>
      <FloatingAction>
        <PrimaryButton
          onClick={() => navigate(`/pacientes/${pid}/novo`)}
          className="shadow-[0_10px_24px_rgba(163,96,75,.35)]"
        >
          <span className="text-2xl leading-none font-light">+</span>Novo atendimento
        </PrimaryButton>
      </FloatingAction>
    </Screen>
  )
}
