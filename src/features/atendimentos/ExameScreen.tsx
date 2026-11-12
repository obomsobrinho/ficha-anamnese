import { useParams } from 'react-router'
import { Screen, TopBar, useBack } from '@/components/layout'
import { Chip, FooterBar, PrimaryButton, RadioOption, Segmented, Skeleton, TextArea } from '@/components/ui'
import { useSavePart } from '@/data/atendimentos'
import { todayBR } from '@/lib/dates'
import { DIAG_PERIAPICAL, DIAG_PULPAR, HDA, INSPECAO, TESTES, type ExameData } from '@/types'
import { useAtendimentoView } from './AtendimentoScreen'
import { usePartDraft } from './usePartDraft'

export function ExameScreen() {
  const { aid = '' } = useParams()
  const back = useBack(`/atendimentos/${aid}`)
  const { a, P, A, loading } = useAtendimentoView(aid)
  const [ex, set] = usePartDraft<ExameData>(a?.partes.exame.data)
  const save = useSavePart()

  const tog = (field: 'hda' | 'insp', v: string) =>
    set((d) => ({ [field]: d[field].includes(v) ? d[field].filter((x) => x !== v) : [...d[field], v] }))

  const onSave = () => {
    if (!a || !ex) return
    const state = ex.dp && ex.dpa ? 'Feito' : 'Em andamento'
    save.mutate({ atendimento: a, key: 'exame', value: { state, date: todayBR(), data: ex } })
    back()
  }

  return (
    <Screen>
      <TopBar onBack={back} badge={A.teethLabel || ' '} title="Exame clínico" subtitle={`${P.displayName} · ${A.proc}`} />
      {loading || !ex ? (
        <div className="flex flex-col gap-4 px-5 pt-[22px]">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-24" />
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-24" />
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-[26px] px-5 pt-[22px] pb-10">
          <div className="flex flex-col gap-3">
            <div className="text-base font-medium">História da doença atual</div>
            <div className="flex flex-wrap gap-2">
              {HDA.map((v) => (
                <Chip key={v} label={v} on={ex.hda.includes(v)} onClick={() => tog('hda', v)} />
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <div className="text-base font-medium">Inspeção</div>
            <div className="flex flex-wrap gap-2">
              {INSPECAO.map((v) => (
                <Chip key={v} label={v} on={ex.insp.includes(v)} onClick={() => tog('insp', v)} />
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-3.5">
            <div className="text-base font-medium">Testes</div>
            {TESTES.map((t) => (
              <div key={t.key} className="flex flex-col gap-2">
                <div className="text-sm text-muted2">{t.label}</div>
                <Segmented
                  options={t.opts}
                  value={ex.tests[t.key]}
                  toggleable
                  onChange={(o) => set((d) => ({ tests: { ...d.tests, [t.key]: o } }))}
                />
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-2.5">
            <div className="text-base font-medium">Diagnóstico pulpar</div>
            <div className="flex flex-col gap-1.5">
              {DIAG_PULPAR.map((o) => (
                <RadioOption key={o} label={o} on={ex.dp === o} onClick={() => set({ dp: o })} />
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2.5">
            <div className="text-base font-medium">Diagnóstico periapical</div>
            <div className="flex flex-col gap-1.5">
              {DIAG_PERIAPICAL.map((o) => (
                <RadioOption key={o} label={o} on={ex.dpa === o} onClick={() => set({ dpa: o })} />
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2.5">
            <div className="text-base font-medium">Plano de tratamento</div>
            <TextArea value={ex.plano} onChange={(e) => set({ plano: e.target.value })} />
          </div>
          <div className="flex flex-col gap-2.5">
            <div className="text-base font-medium">Observações</div>
            <TextArea value={ex.obs} onChange={(e) => set({ obs: e.target.value })} placeholder="Anotações do exame" />
          </div>
        </div>
      )}
      <FooterBar>
        <PrimaryButton onClick={onSave} disabled={!ex}>
          Salvar
        </PrimaryButton>
      </FooterBar>
    </Screen>
  )
}
