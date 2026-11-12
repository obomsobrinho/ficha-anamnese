import { useState } from 'react'
import { useParams } from 'react-router'
import { RxImage, RxViewer, type ViewerItem } from '@/components/RxImage'
import { Screen, useBack } from '@/components/layout'
import { BackChevron, Skeleton } from '@/components/ui'
import { useSignedUrls } from '@/data/arquivos'
import { useArquivos } from '@/data/atendimentos'
import { profLine, useProfissional } from '@/features/profissional/useProfissional'
import { tsToBR, tsToBRTime } from '@/lib/dates'
import { ARQUIVO_TIPO } from '@/types'
import { useAtendimentoView } from './AtendimentoScreen'

const label = 'text-[11px] tracking-[.22em] text-terra-mid uppercase'

export function ResumoScreen() {
  const { aid = '' } = useParams()
  const back = useBack(`/atendimentos/${aid}`)
  const { a, p, P, A, loading } = useAtendimentoView(aid)
  const { data: prof } = useProfissional()
  const { data: files } = useArquivos(aid)
  const rx = (files || []).filter((f) => f.tipo === ARQUIVO_TIPO.rxi || f.tipo === ARQUIVO_TIPO.rxf)
  const { data: urls } = useSignedUrls(rx.map((f) => f.caminho))
  const [viewer, setViewer] = useState<ViewerItem | null>(null)

  const ex = a?.partes.exame.data
  const tr = a?.partes.trat.data
  const tm = a?.partes.termo
  const d = p?.dados

  const summary =
    a && p && ex && tr && d
      ? [
          {
            title: 'Alertas de saúde',
            rows: [
              { k: 'Alergia', v: d.yn.ale === 'Sim' ? d.ynTxt.ale || 'Sim' : 'Não' },
              { k: 'Medicamento', v: d.yn.med === 'Sim' ? d.ynTxt.med || 'Sim' : 'Não' },
              { k: 'Doenças', v: d.doencas.join(', ') || 'Nenhuma' },
            ],
          },
          {
            title: 'Exame clínico',
            rows: [
              { k: 'Hist. doença', v: ex.hda.join(', ') || '—' },
              { k: 'Inspeção', v: ex.insp.join(', ') || '—' },
              { k: 'Percussão', v: ex.tests.perc || '—' },
              { k: 'Palpação', v: ex.tests.palp || '—' },
              { k: 'Sens. pulpar', v: 'Frio: ' + (ex.tests.frio || '—') + ' · Calor: ' + (ex.tests.calor || '—') },
            ],
          },
          {
            title: 'Diagnóstico e planejamento',
            rows: [
              { k: 'Diag. pulpar', v: ex.dp || '—' },
              { k: 'Diag. periapical', v: ex.dpa || '—' },
              { k: 'Plano', v: ex.plano || '—' },
            ],
          },
          {
            title: 'Tratamento endodôntico',
            rows: [
              { k: 'Tipo', v: tr.tipo || '—' },
              { k: 'Sessões', v: tr.sessoes + (tr.inicio ? ' · início ' + tr.inicio : '') + (tr.fim ? ' · fim ' + tr.fim : '') },
              { k: 'Anestésico', v: (tr.anest || '—') + ' · ' + tr.tubetes + ' tubetes' },
              { k: 'Isolamento', v: tr.grampo ? 'Absoluto, grampo ' + tr.grampo : '—' },
              { k: 'Irrigação', v: tr.irrig.map((x) => (x === 'NaOCl' ? 'NaOCl ' + tr.naocl + '%' : x)).join(', ') || '—' },
              { k: 'Medicação', v: tr.med || '—' },
              { k: 'Cimento', v: tr.cimento || '—' },
              { k: 'Técnica', v: tr.tecnica || '—' },
              { k: 'Controle rx', v: 'A cada ' + tr.controle + ' meses' },
            ],
          },
        ]
      : []

  const blankRow = { c: '', cad: '', crd: '', lima: '' }
  const filled = (c: typeof blankRow) => Boolean(c.c || c.cad || c.crd || c.lima)
  const canalGroups =
    a && tr
      ? a.dentes.map((n) => {
          const rows = (tr.canals[n] || []).filter(filled)
          return { n, rows: rows.length ? rows : [blankRow] }
        })
      : []
  const rxAll = rx.map((f) => ({
    ...f,
    label: (f.tipo === ARQUIVO_TIPO.rxi ? 'Inicial · ' : 'Final · ') + tsToBR(f.created_at),
    src: urls?.[f.caminho],
  }))
  const termoSummary = tm ? (tm.status === 'Assinado' ? 'Assinado · ' + tm.signedAt : tm.status) : ''

  const print = () => {
    const prev = document.title
    document.title = ['Ficha', p?.nome, A.teethLabel].filter(Boolean).join(' ')
    window.print()
    setTimeout(() => (document.title = prev), 1000)
  }

  return (
    <Screen className="print:min-h-0">
      <div className="pt-safe sticky top-0 z-10 flex-none border-b border-divider bg-cream print:hidden">
        <div className="flex items-center px-2.5 pt-2.5 pb-3.5">
          <BackChevron onClick={back} />
          <div className="flex-1 pr-11 text-center text-xl font-medium">Resumo do atendimento</div>
        </div>
      </div>
      <div className="flex flex-col gap-6 px-[22px] pt-[22px] pb-[120px] print:px-0 print:pt-0 print:pb-0">
        <div className="flex items-center gap-3 border-b border-dash pb-[18px]">
          <div className="box-border size-[52px] flex-none rounded-full border border-line bg-sand p-2.5" />
          <div className="flex flex-col gap-0.5">
            <div className="text-[11px] tracking-[.3em] text-terra-mid">FICHA ANAMNESE · {A.procUpper}</div>
            <div className="font-serif text-[19px] font-semibold">{prof?.nome}</div>
            <div className="text-xs text-muted">{[profLine(prof), prof?.telefone].filter(Boolean).join(' · ')}</div>
          </div>
        </div>

        {loading || !a ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-40" />
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-1">
              <div className="font-serif text-[30px] leading-[1.1] font-medium">{P.displayName}</div>
              <div className="text-sm text-muted2">{P.line1}</div>
              <div className="text-sm text-muted2">{P.line2}</div>
              <div className="pt-1.5 text-[15px] font-medium">
                {A.proc} · {A.teethLong} · {a.status}
              </div>
            </div>

            {summary.map((sec) => (
              <div key={sec.title} className="flex break-inside-avoid flex-col gap-2.5">
                <div className={label}>{sec.title}</div>
                <div className="flex flex-col gap-2">
                  {sec.rows.map((r) => (
                    <div key={r.k} className="grid grid-cols-[118px_minmax(0,1fr)] gap-3 text-sm leading-[1.4]">
                      <span className="text-muted">{r.k}</span>
                      <span className="text-pretty">{r.v}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {canalGroups.map((g) => (
              <div key={g.n} className="flex break-inside-avoid flex-col gap-2.5">
                <div className={label}>Canais · dente {g.n}</div>
                <div className="overflow-hidden rounded-xl border border-field text-sm">
                  <div className="grid grid-cols-4 bg-panel px-3 py-2 text-[11px] tracking-[.06em] text-muted2 uppercase">
                    <span>Canal</span>
                    <span>CAD</span>
                    <span>CRD</span>
                    <span>Lima mem.</span>
                  </div>
                  {g.rows.map((c, i) => (
                    <div key={i} className="grid grid-cols-4 border-t border-row px-3 py-[9px]">
                      <span className="font-medium">{c.c}</span>
                      <span>{c.cad}</span>
                      <span>{c.crd}</span>
                      <span>{c.lima}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="flex break-inside-avoid flex-col gap-2.5">
              <div className={label}>Radiografias</div>
              {rxAll.length ? (
                <div className="grid grid-cols-2 gap-2.5">
                  {rxAll.map((x) => (
                    <div key={x.id} className="flex flex-col gap-1.5">
                      <div
                        onClick={() => setViewer({ id: x.id, src: x.src, date: tsToBRTime(x.created_at), note: x.nota || '' })}
                        className="flex h-[110px] cursor-zoom-in items-center justify-center overflow-hidden rounded-xl bg-dark text-xs text-muted"
                      >
                        <RxImage id={x.id} src={x.src} />
                      </div>
                      <span className="text-xs text-muted">{x.label}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted">Nenhuma radiografia.</div>
              )}
            </div>

            <div className="flex items-center justify-between rounded-[14px] bg-sand px-4 py-3.5 text-sm">
              <span className="text-muted2">Termo</span>
              <span className="font-medium">{termoSummary}</span>
            </div>
          </>
        )}
      </div>
      <div className="pb-safe fixed inset-x-0 bottom-0 z-10 mx-auto flex max-w-[430px] gap-2.5 border-t border-divider bg-cream px-5 pt-3 md:max-w-[680px] md:px-10 print:hidden">
        <button
          type="button"
          onClick={print}
          className="h-[54px] flex-1 cursor-pointer rounded-2xl border border-field bg-white text-base"
        >
          Compartilhar
        </button>
        <button
          type="button"
          onClick={print}
          className="h-[54px] flex-1 cursor-pointer rounded-2xl border-0 bg-terra text-base font-medium text-white"
        >
          Exportar PDF
        </button>
      </div>
      <RxViewer item={viewer} onClose={() => setViewer(null)} />
    </Screen>
  )
}
