import { useParams } from 'react-router'
import { Screen, TopBar, useBack } from '@/components/layout'
import { Chip, Field, FooterBar, PrimaryButton, RadioOption, Skeleton, TextArea, TextInput } from '@/components/ui'
import { useSavePart } from '@/data/atendimentos'
import { maskDate, todayBR } from '@/lib/dates'
import { toothName } from '@/lib/teeth'
import { IRRIGACAO, TECNICAS, TIPOS_TRATAMENTO, type CanalRow, type TratData } from '@/types'
import { useAtendimentoView } from './AtendimentoScreen'
import { usePartDraft } from './usePartDraft'

const GRID = 'grid grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.15fr)_30px] gap-1.5'
const cell = 'h-11 min-w-0 rounded-[10px] border-0 bg-panel text-center text-base'
const blankRow = (): CanalRow => ({ c: '', cad: '', crd: '', lima: '' })

export function TratamentoScreen() {
  const { aid = '' } = useParams()
  const back = useBack(`/atendimentos/${aid}`)
  const { a, P, A, loading } = useAtendimentoView(aid)
  const [tr, set] = usePartDraft<TratData>(a?.partes.trat.data)
  const save = useSavePart()

  const rowsOf = (d: TratData, n: string) => d.canals[n] || [blankRow()]
  const setRows = (n: string, fn: (r: CanalRow[]) => CanalRow[]) =>
    set((d) => ({ canals: { ...d.canals, [n]: fn(rowsOf(d, n)) } }))
  const stepper = (k: 'sessoes' | 'tubetes' | 'controle', label: string) => (
    <div key={k} className="flex items-center justify-between gap-3">
      <div className="text-[15px]">{label}</div>
      <div className="flex items-center gap-1 rounded-[14px] bg-sand p-[3px]">
        <button
          type="button"
          onClick={() => set((d) => ({ [k]: Math.max(0, d[k] - 1) }))}
          className="size-11 cursor-pointer rounded-[11px] border-0 bg-transparent text-[22px] text-terra"
        >
          −
        </button>
        <div className="min-w-11 text-center text-[17px] font-medium">{tr?.[k]}</div>
        <button
          type="button"
          onClick={() => set((d) => ({ [k]: d[k] + 1 }))}
          className="size-11 cursor-pointer rounded-[11px] border-0 bg-white text-[22px] text-terra"
        >
          +
        </button>
      </div>
    </div>
  )

  const onSave = () => {
    if (!a || !tr) return
    const state = tr.fim ? 'Feito' : 'Em andamento'
    save.mutate({ atendimento: a, key: 'trat', value: { state, date: todayBR(), data: tr } })
    back()
  }

  const field = (k: 'anest' | 'med' | 'cimento' | 'grampo', label: string, extra?: Record<string, string>) => (
    <Field label={label}>
      <TextInput value={tr?.[k] ?? ''} onChange={(e) => set({ [k]: e.target.value })} className="px-3" {...extra} />
    </Field>
  )

  return (
    <Screen>
      <TopBar onBack={back} badge={A.teethLabel || ' '} title="Tratamento endodôntico" subtitle={`${P.displayName} · ${A.proc}`} />
      {loading || !tr || !a ? (
        <div className="flex flex-col gap-4 px-5 pt-5">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-40" />
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-[26px] px-5 pt-5 pb-10">
          <div className="flex flex-col gap-2.5">
            <div className="text-base font-medium">Tipo de tratamento</div>
            <div className="flex flex-col gap-1.5">
              {TIPOS_TRATAMENTO.map((o) => (
                <RadioOption key={o} label={o} on={tr.tipo === o} onClick={() => set({ tipo: o })} className="h-[50px] text-base" />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <div className="text-base font-medium">Informações do canal</div>
            {a.dentes.map((n) => (
              <div key={n} className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-[13px] text-muted2">
                  <span className="box-border flex h-[30px] min-w-[30px] items-center justify-center rounded-[9px] bg-terra px-1.5 text-sm font-semibold text-white">
                    {n}
                  </span>
                  {toothName(+n)}
                </div>
                <div className="overflow-hidden rounded-2xl border border-field bg-white">
                  <div className={`${GRID} bg-panel px-2.5 pt-2.5 pb-2 text-[11px] tracking-[.06em] text-muted2 uppercase`}>
                    <span>Canal</span>
                    <span>CAD</span>
                    <span>CRD</span>
                    <span>Lima memória</span>
                    <span />
                  </div>
                  {rowsOf(tr, n).map((c, i) => {
                    const u = (f: keyof CanalRow) => (e: React.ChangeEvent<HTMLInputElement>) => {
                      const v = e.target.value
                      setRows(n, (r) => r.map((x, j) => (j === i ? { ...x, [f]: v } : x)))
                    }
                    return (
                      <div key={i} className={`${GRID} items-center border-t border-row px-2.5 py-1.5`}>
                        <input value={c.c} onChange={u('c')} placeholder="—" className={`${cell} font-medium`} />
                        <input value={c.cad} onChange={u('cad')} inputMode="decimal" placeholder="mm" className={cell} />
                        <input value={c.crd} onChange={u('crd')} inputMode="decimal" placeholder="mm" className={cell} />
                        <input value={c.lima} onChange={u('lima')} placeholder="#" className={cell} />
                        <button
                          type="button"
                          onClick={() => setRows(n, (r) => r.filter((_, j) => j !== i))}
                          className="h-11 w-[30px] cursor-pointer border-0 bg-transparent p-0 text-xl text-chev"
                        >
                          ×
                        </button>
                      </div>
                    )
                  })}
                  <button
                    type="button"
                    onClick={() => setRows(n, (r) => [...r, blankRow()])}
                    className="h-[52px] w-full cursor-pointer border-0 border-t border-dashed border-field bg-white text-[15px] font-medium text-terra"
                  >
                    + Adicionar canal
                  </button>
                </div>
              </div>
            ))}
            <div className="text-xs text-muted">CAD e CRD em milímetros.</div>
          </div>

          <div className="flex flex-col gap-2.5">
            <div className="text-base font-medium">Sequência instrumental</div>
            <TextArea value={tr.seq} onChange={(e) => set({ seq: e.target.value })} className="min-h-[72px]" />
          </div>

          <div className="flex flex-col gap-3.5">
            <div className="pt-1 text-[11px] tracking-[.2em] text-muted uppercase">Registro operatório</div>
            {stepper('sessoes', 'Número de sessões')}
            {stepper('tubetes', 'Quantidade de tubetes')}
            {stepper('controle', 'Controle radiográfico: a cada (meses)')}
            <div className="grid grid-cols-2 gap-2.5">
              <Field label="Data de início">
                <TextInput value={tr.inicio} onChange={(e) => set({ inicio: maskDate(e.target.value) })} inputMode="numeric" placeholder="dd/mm/aaaa" className="px-3" />
              </Field>
              <Field label="Data de finalização">
                <TextInput value={tr.fim} onChange={(e) => set({ fim: maskDate(e.target.value) })} inputMode="numeric" placeholder="dd/mm/aaaa" className="px-3" />
              </Field>
            </div>
            {field('anest', 'Anestésico')}
            {field('grampo', 'Isolamento absoluto: grampo número', { inputMode: 'numeric' })}
            <div className="flex flex-col gap-2">
              <div className="text-[13px] text-muted2">Irrigação</div>
              <div className="flex flex-wrap items-center gap-2">
                {IRRIGACAO.map((v) => (
                  <Chip
                    key={v}
                    label={v}
                    on={tr.irrig.includes(v)}
                    onClick={() => set((d) => ({ irrig: d.irrig.includes(v) ? d.irrig.filter((x) => x !== v) : [...d.irrig, v] }))}
                  />
                ))}
              </div>
              {tr.irrig.includes('NaOCl') && (
                <div className="flex items-center gap-2.5 text-[15px]">
                  NaOCl
                  <input
                    value={tr.naocl}
                    onChange={(e) => set({ naocl: e.target.value })}
                    inputMode="decimal"
                    className="h-11 w-[72px] rounded-xl border border-field bg-white text-center text-base"
                  />
                  %
                </div>
              )}
            </div>
            {field('med', 'Medicação intracanal')}
            {field('cimento', 'Cimento obturador', { placeholder: 'Ex.: AH Plus' })}
            <div className="flex flex-col gap-2">
              <div className="text-[13px] text-muted2">Técnica</div>
              <div className="flex flex-wrap gap-2">
                {TECNICAS.map((v) => (
                  <Chip key={v} label={v} on={tr.tecnica === v} onClick={() => set((d) => ({ tecnica: d.tecnica === v ? '' : v }))} />
                ))}
              </div>
            </div>
            <div className="text-xs text-muted">Preencha a data de finalização para marcar como feito.</div>
          </div>
        </div>
      )}
      <FooterBar>
        <PrimaryButton onClick={onSave} disabled={!tr}>
          Salvar
        </PrimaryButton>
      </FooterBar>
    </Screen>
  )
}
