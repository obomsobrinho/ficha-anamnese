import { useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Screen, TextBack } from '@/components/layout'
import { Chevron, Skeleton } from '@/components/ui'
import { useArquivos, useAtendimento, useDeleteAtendimento } from '@/data/atendimentos'
import { usePaciente } from '@/data/pacientes'
import { patientView } from '@/features/pacientes/view'
import { isoToBR } from '@/lib/dates'
import { toothName } from '@/lib/teeth'
import { PROCEDIMENTOS, STATUS_STYLE, type Atendimento, type PartKey, type PartState } from '@/types'

const PART_STYLE = {
  feito: { icon: '✓', icBg: '#A3604B', icFg: '#fff', icBd: '0', stFg: '#7A4433', line: '#D9B9AA' },
  and: { icon: '•', icBg: '#F6EAE3', icFg: '#A3604B', icBd: '1.5px solid #A3604B', stFg: '#A3604B', line: '#EADBD2' },
  vazio: { icon: '', icBg: '#FFFCF6', icFg: '#B5A79F', icBd: '1.5px dashed #CDBDB3', stFg: '#8B7F79', line: '#EFE4DC' },
}
const styleKey = (st: PartState) => (st === 'Feito' ? 'feito' : st === 'Em andamento' ? 'and' : 'vazio')

export function useAtendimentoView(aid: string | undefined) {
  const { data: a, isPending } = useAtendimento(aid)
  const { data: p } = usePaciente(a?.paciente_id)
  // Blank while the patient row loads, never the "Novo paciente" placeholder.
  const P = p ? patientView(p) : { ...patientView(null), displayName: '', first: '' }
  const M = a ? PROCEDIMENTOS[a.procedimento] : PROCEDIMENTOS.endodontia
  const ts = a?.dentes || []
  const pl = ts.length > 1
  const A = {
    proc: M.name,
    procUpper: M.name.toUpperCase(),
    procLower: M.name.toLowerCase(),
    teethLabel: ts.join(', '),
    teethLong: (pl ? 'Dentes ' : 'Dente ') + ts.join(', '),
    teethPhrase: (pl ? 'nos dentes ' : 'no dente ') + ts.join(', '),
  }
  return { a, p, P, A, loading: isPending && !a }
}

/** The hub's back goes to the patient, skipping the creation steps when we came from them. */
function useHubBack(a: Atendimento | null | undefined) {
  const navigate = useNavigate()
  const state = useLocation().state as { backDepth?: number } | null
  return () => {
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0
    const depth = state?.backDepth ?? 1
    if (idx >= depth) navigate(-depth)
    else navigate(a ? `/pacientes/${a.paciente_id}` : '/', { replace: true })
  }
}

export function AtendimentoScreen() {
  const { aid = '' } = useParams()
  const navigate = useNavigate()
  const { a, P, A, loading } = useAtendimentoView(aid)
  const { data: files } = useArquivos(aid)
  const back = useHubBack(a)
  const del = useDeleteAtendimento()
  const [confirmDel, setConfirmDel] = useState(false)

  if (!loading && !a)
    return (
      <Screen>
        <TextBack label="Pacientes" onClick={() => navigate('/', { replace: true })} />
        <div className="px-5 py-8 text-center text-[15px] text-muted">Atendimento não encontrado.</div>
      </Screen>
    )

  const st = a ? STATUS_STYLE[a.status] ?? STATUS_STYLE['Em exame'] : STATUS_STYLE['Em exame']
  const pl = (a?.dentes.length || 0) > 1
  const parts = a ? buildParts(a, files?.filter((f) => f.tipo === 'rx_inicial').length ?? 0, files?.filter((f) => f.tipo === 'rx_final').length ?? 0) : []

  return (
    <Screen>
      <TextBack label={P.displayName} onClick={back} />
      <div className="flex flex-col gap-[22px] px-5 pt-2 pb-10">
        <div className="flex flex-col gap-3">
          <div className="text-[11px] tracking-[.22em] text-muted uppercase">Atendimento</div>
          <div className="font-serif text-[46px] leading-[.95] font-semibold text-terra">{A.proc}</div>
          {loading ? (
            <Skeleton className="h-[38px] w-56 rounded-xl" />
          ) : (
            <div className="flex flex-wrap gap-2">
              {a!.dentes.map((n) => (
                <span
                  key={n}
                  className="box-border flex min-h-[38px] items-center gap-2 rounded-xl bg-sand py-1 pr-3 pl-1 text-[13px] text-muted2"
                >
                  <span className="box-border flex h-[30px] min-w-[30px] items-center justify-center rounded-[9px] bg-terra px-1.5 text-[15px] font-semibold text-white">
                    {n}
                  </span>
                  {pl ? '' : toothName(+n)}
                </span>
              ))}
            </div>
          )}
          {a && (
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="flex h-7 items-center gap-1.5 rounded-[14px] px-3 text-[13px] font-medium"
                style={{ background: st.chipBg, color: st.chipFg }}
              >
                <span className="size-[7px] rounded-full" style={{ background: st.dot }} />
                {a.status}
              </span>
              <span className="text-[13px] text-muted">desde {isoToBR(a.iniciado_em)}</span>
            </div>
          )}
        </div>

        <div className="flex flex-col">
          {loading
            ? [0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="mb-2 ml-[46px] h-[78px] rounded-2xl" />)
            : parts.map((pt, i) => {
                const s = PART_STYLE[styleKey(pt.state)]
                return (
                  <div key={pt.key} onClick={() => navigate(`/atendimentos/${aid}/${pt.key}`)} className="flex cursor-pointer gap-3.5">
                    <div className="flex w-8 flex-none flex-col items-center">
                      <div
                        className="mt-4 box-border flex size-8 flex-none items-center justify-center rounded-full text-sm font-semibold"
                        style={{ background: s.icBg, color: s.icFg, border: s.icBd }}
                      >
                        {s.icon}
                      </div>
                      <div className="w-[1.5px] flex-1" style={{ background: i === parts.length - 1 ? 'transparent' : s.line }} />
                    </div>
                    <div className="mb-2 flex min-w-0 flex-1 items-center gap-2.5 rounded-2xl border border-line bg-white p-3.5 hover:border-border-hover">
                      <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
                        <div className="text-base font-medium">{pt.title}</div>
                        <div className="text-[13px] leading-[1.35] text-pretty text-muted2">{pt.sub}</div>
                        <div className="flex items-center gap-2 pt-0.5 text-xs">
                          <span className="font-semibold" style={{ color: s.stFg }}>
                            {pt.stateLabel}
                          </span>
                          <span className="text-muted">{pt.date}</span>
                        </div>
                      </div>
                      <Chevron />
                    </div>
                  </div>
                )
              })}
        </div>
        <button
          type="button"
          onClick={() => navigate(`/atendimentos/${aid}/resumo`)}
          className="h-[54px] flex-none cursor-pointer rounded-2xl border border-dash bg-white text-base font-medium text-terra-dark"
        >
          Resumo do atendimento
        </button>
        {a && (
          <button
            type="button"
            onClick={() => setConfirmDel(true)}
            className="h-11 cursor-pointer self-center border-0 bg-transparent text-sm text-muted"
          >
            Excluir atendimento
          </button>
        )}
      </div>
      <ConfirmDialog
        open={confirmDel}
        onOpenChange={setConfirmDel}
        title={`Excluir ${A.proc.toLowerCase()} do ${A.teethLabel}?`}
        body="Isso apaga o exame, o termo, o tratamento e as imagens deste atendimento. Não dá para desfazer."
        confirmLabel="Excluir atendimento"
        onConfirm={() => {
          if (!a) return
          setConfirmDel(false)
          del.mutate(a)
          navigate(`/pacientes/${a.paciente_id}`, { replace: true })
        }}
      />
    </Screen>
  )
}

function buildParts(a: Atendimento, nRxi: number, nRxf: number) {
  const p = a.partes
  const ex = p.exame.data
  const tr = p.trat.data
  const tm = p.termo
  const nImg = (n: number) => (n ? n + (n === 1 ? ' imagem' : ' imagens') : 'Nenhuma imagem')
  const tmState: PartState = tm.status === 'Assinado' ? 'Feito' : 'Vazio'
  const rows: { key: PartKey; title: string; sub: string; state: PartState; date: string }[] = [
    {
      key: 'exame',
      title: 'Exame clínico',
      sub: ex.dp ? ex.dp + (ex.dpa ? ' · ' + ex.dpa.toLowerCase() : '') : 'História da doença, inspeção, testes, diagnóstico e plano',
      state: p.exame.state,
      date: p.exame.date,
    },
    { key: 'rxi', title: 'Raio-X inicial', sub: nImg(nRxi), state: p.rxi.state, date: p.rxi.date },
    {
      key: 'termo',
      title: 'Termo e assinatura',
      sub: tm.status === 'Assinado' ? 'Assinado por ' + tm.signer : 'Ainda não enviado',
      state: tmState,
      date: tm.status === 'Assinado' ? tm.signedAt : '',
    },
    {
      key: 'trat',
      title: 'Tratamento endodôntico',
      sub: tr.tipo ? tr.tipo + ' · ' + tr.sessoes + (tr.sessoes === 1 ? ' sessão' : ' sessões') : 'Canais e registro operatório',
      state: p.trat.state,
      date: p.trat.date,
    },
    { key: 'rxf', title: 'Raio-X final', sub: nRxf ? nImg(nRxf) : 'Após a obturação', state: p.rxf.state, date: p.rxf.date },
  ]
  const allowed = PROCEDIMENTOS[a.procedimento].parts as readonly string[]
  return rows.filter((r) => allowed.includes(r.key)).map((r) => ({ ...r, stateLabel: r.state }))
}
