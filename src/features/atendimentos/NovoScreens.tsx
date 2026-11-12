import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router'
import { AlertChips, Screen, TopBar, useBack } from '@/components/layout'
import { Sheet } from '@/components/Sheet'
import { Chevron, FooterBar, PrimaryButton, Segmented } from '@/components/ui'
import { newAtendimento, useCreateAtendimento } from '@/data/atendimentos'
import { usePaciente, type PacienteRow } from '@/data/pacientes'
import type { CreateAfterSave } from '@/features/pacientes/SaudeScreen'
import { healthAlerts, patientView } from '@/features/pacientes/view'
import { rootLabel, toothName, ToothChart, ToothSide, type Dentition, type Mark } from '@/lib/teeth'
import { PROCEDIMENTOS, PROCEDIMENTOS_EM_BREVE } from '@/types'

// ---------------- Qual procedimento? ----------------
export function ProcScreen() {
  const { pid = '' } = useParams()
  const navigate = useNavigate()
  const back = useBack(`/pacientes/${pid}`)
  const { data: p } = usePaciente(pid)
  const v = patientView(p)
  const endo = PROCEDIMENTOS.endodontia

  return (
    <Screen>
      <TopBar onBack={back} title="Novo atendimento" subtitle={`${v.displayName} · passo 1 de 2`} />
      <div className="flex flex-col gap-3 px-5 pt-[22px] pb-[30px]">
        <div className="pb-1.5 font-serif text-[32px] leading-[1.1] font-medium">Qual procedimento?</div>
        <div
          onClick={() => navigate(`/pacientes/${pid}/novo/endodontia`)}
          className="flex cursor-pointer items-center gap-3.5 rounded-[18px] border border-line bg-white px-4 py-[18px] hover:border-border-hover"
        >
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="text-lg font-medium text-ink">{endo.name}</div>
            <div className="text-[13px] leading-[1.4] text-pretty text-muted2">{endo.desc}</div>
          </div>
          <Chevron />
        </div>
        {PROCEDIMENTOS_EM_BREVE.map((m) => (
          <div
            key={m.name}
            aria-disabled
            className="flex items-center gap-3.5 rounded-[18px] border border-line bg-white px-4 py-[18px]"
          >
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="text-lg font-medium text-muted2">{m.name}</div>
              <div className="text-[13px] leading-[1.4] text-pretty text-muted2">{m.desc}</div>
              <span className="mt-1.5 flex h-[26px] items-center self-start rounded-[13px] bg-sand px-2.5 text-xs text-muted2">
                Em breve
              </span>
            </div>
          </div>
        ))}
      </div>
    </Screen>
  )
}

function marksOf(p: PacienteRow | null | undefined) {
  const marks: Record<number, Mark> = {}
  p?.atendimentos.forEach((t) => {
    const m: Mark = t.status === 'Concluído' ? 'done' : 'trat'
    t.dentes.forEach((n) => {
      if (marks[+n] !== 'trat') marks[+n] = m
    })
  })
  return marks
}

function findOpenEndo(p: PacienteRow | null | undefined, n: number) {
  return p?.atendimentos.find(
    (a) => a.procedimento === 'endodontia' && a.dentes.includes(String(n)) && a.status !== 'Concluído',
  )
}

/** Creates the care record (or reopens the open one for that tooth) and lands on its hub. */
function useOpenCreated(p: PacienteRow | null | undefined) {
  const navigate = useNavigate()
  const create = useCreateAtendimento()
  /** backDepth: how many history entries separate the new hub from the patient hub. */
  return (pid: string, teeth: number[], backDepth: number) => {
    const state = { backDepth }
    const ex = findOpenEndo(p, teeth[0])
    if (ex) {
      navigate(`/atendimentos/${ex.id}`, { replace: true, state })
      return
    }
    const a = newAtendimento(pid, 'endodontia', teeth.map(String))
    create.mutate(a)
    navigate(`/atendimentos/${a.id}`, { replace: true, state })
  }
}

// ---------------- Dentes ----------------
export function DentesScreen() {
  const { pid = '' } = useParams()
  const navigate = useNavigate()
  const back = useBack(`/pacientes/${pid}/novo`)
  const { data: p } = usePaciente(pid)
  const v = patientView(p)
  const M = PROCEDIMENTOS.endodontia
  const [dent, setDent] = useState<Dentition>('perm')
  const [sel, setSel] = useState<number | null>(null)
  const [sheet, setSheet] = useState(false)
  const openCreated = useOpenCreated(p)

  const existing = sel != null ? findOpenEndo(p, sel) : null
  const start = () => {
    if (sel == null) return
    if (existing || !p?.saude_atualizada_em) {
      // Same as the prototype: no health data yet goes straight to the record.
      openCreated(pid, [sel], 2)
      return
    }
    setSheet(true)
  }

  return (
    <Screen>
      <TopBar onBack={back} title={M.name} subtitle={`${v.displayName} · passo 2 de 2 · toque no dente`} />
      <div className="flex flex-1 flex-col gap-4 px-4 pt-4 pb-[30px]">
        <Segmented
          options={['Permanentes', 'Decíduos'] as const}
          value={dent === 'perm' ? 'Permanentes' : 'Decíduos'}
          onChange={(x) => {
            const d: Dentition = x === 'Decíduos' ? 'dec' : 'perm'
            if (d !== dent) {
              setDent(d)
              setSel(null)
            }
          }}
        />
        <div className="-mx-1 -mt-1 min-h-[400px] flex-none">
          <ToothChart dent={dent} sel={sel} marks={marksOf(p)} onPick={(n) => setSel(sel === n ? null : n)} />
        </div>
        {sel == null ? (
          <div className="flex-none rounded-2xl border-[1.5px] border-dashed border-dash p-[18px] text-center text-[15px] text-muted">
            Nenhum dente selecionado
          </div>
        ) : (
          <div className="flex flex-none items-center gap-3.5 rounded-[18px] bg-sand px-4 py-3.5">
            <div className="box-border flex h-16 min-w-16 flex-none items-center justify-center rounded-2xl bg-terra px-2 font-serif text-[38px] font-semibold text-white">
              {sel}
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
              <span className="text-base leading-[1.3] font-medium text-pretty">
                {sel} · {toothName(sel)}
              </span>
              <span className="text-[13px] text-muted2">
                {rootLabel(sel) + (existing ? ' · Endodontia já em andamento' : '')}
              </span>
            </div>
            <div className="flex w-[58px] flex-none justify-center">
              <ToothSide n={sel} height={86} />
            </div>
          </div>
        )}
      </div>
      <FooterBar>
        <PrimaryButton onClick={start} disabled={sel == null}>
          {existing ? 'Abrir atendimento em andamento' : 'Começar atendimento'}
        </PrimaryButton>
      </FooterBar>
      <Sheet open={sheet} onOpenChange={setSheet} title="Algo mudou?">
        <div className="flex items-center gap-2.5">
          <div className="flex h-[34px] items-center rounded-[10px] bg-terra px-2.5 text-[15px] font-medium text-white">{sel}</div>
          <span className="text-sm text-muted2">{M.name}</span>
        </div>
        <div className="font-serif text-[28px] leading-[1.15] font-medium text-pretty">
          Saúde registrada em {v.healthDate}. Algo mudou?
        </div>
        <AlertChips alerts={healthAlerts(p)} />
        <div className="flex flex-col gap-2">
          <PrimaryButton onClick={() => sel != null && openCreated(pid, [sel], 2)}>Nada mudou</PrimaryButton>
          <button
            type="button"
            onClick={() => {
              setSheet(false)
              const state: CreateAfterSave = { then: 'create', proc: 'endodontia', teeth: [String(sel)] }
              navigate(`/pacientes/${pid}/saude`, { state })
            }}
            className="h-14 cursor-pointer rounded-2xl border border-field bg-white text-[17px]"
          >
            Atualizar
          </button>
        </div>
      </Sheet>
    </Screen>
  )
}

/** After "Atualizar" + Salvar: creates the record once and replaces itself with the hub. */
export function CriarAposSaude() {
  const { pid = '' } = useParams()
  const navigate = useNavigate()
  const state = useLocation().state as CreateAfterSave | null
  const { data: p } = usePaciente(pid)
  const openCreated = useOpenCreated(p)
  const done = useRef(false)
  useEffect(() => {
    if (done.current) return
    done.current = true
    if (!state?.teeth?.length) navigate(`/pacientes/${pid}`, { replace: true })
    else openCreated(pid, state.teeth.map(Number), 3)
  })
  return null
}
