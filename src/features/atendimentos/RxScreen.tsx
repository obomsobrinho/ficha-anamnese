import { useRef, useState } from 'react'
import { useParams } from 'react-router'
import { RxImage, RxViewer, type ViewerItem } from '@/components/RxImage'
import { Screen, TopBar, useBack } from '@/components/layout'
import { FooterBar, PrimaryButton, Skeleton } from '@/components/ui'
import { useDeleteArquivo, useSaveNotas, useSignedUrls, useUploadArquivo } from '@/data/arquivos'
import { useArquivos, useSavePart } from '@/data/atendimentos'
import { todayBR, tsToBRTime } from '@/lib/dates'
import { ARQUIVO_TIPO, type Arquivo } from '@/types'
import { useAtendimentoView } from './AtendimentoScreen'

type Row = Arquivo & { pending?: boolean; failed?: boolean }

export function RxScreen({ kind }: { kind: 'rxi' | 'rxf' }) {
  const { aid = '' } = useParams()
  const back = useBack(`/atendimentos/${aid}`)
  const { a, P, A } = useAtendimentoView(aid)
  const tipo = ARQUIVO_TIPO[kind]
  const { data: all, isPending } = useArquivos(aid)
  const photos = ((all || []) as Row[]).filter((f) => f.tipo === tipo)
  const { data: urls } = useSignedUrls(photos.filter((p) => !p.pending).map((p) => p.caminho))
  const upload = useUploadArquivo()
  const remove = useDeleteArquivo()
  const saveNotas = useSaveNotas()
  const savePart = useSavePart()
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [viewer, setViewer] = useState<ViewerItem | null>(null)
  const camRef = useRef<HTMLInputElement>(null)
  const galRef = useRef<HTMLInputElement>(null)
  const title = kind === 'rxf' ? 'Raio-X final' : 'Raio-X inicial'

  const onPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    upload.upload({ atendimentoId: aid, tipo, file })
  }

  const noteOf = (p: Row) => notes[p.id] ?? p.nota ?? ''
  const uploading = photos.some((p) => p.pending)

  const onSave = () => {
    if (!a) return
    const changed = photos.filter((p) => notes[p.id] !== undefined && notes[p.id] !== (p.nota ?? ''))
    if (changed.length) saveNotas.mutate({ atendimentoId: aid, notas: changed.map((p) => ({ id: p.id, nota: notes[p.id] })) })
    const ok = photos.filter((p) => !p.failed).length
    savePart.mutate({
      atendimento: a,
      key: kind,
      value: { state: ok ? 'Feito' : 'Vazio', date: ok ? todayBR() : '' },
    })
    back()
  }

  return (
    <Screen>
      <TopBar onBack={back} badge={A.teethLabel || ' '} title={title} subtitle={`${P.displayName} · ${A.proc}`} />
      <div className="flex flex-1 flex-col gap-5 px-5 pt-5 pb-10">
        <input ref={camRef} type="file" accept="image/*" capture="environment" onChange={onPhoto} className="hidden" />
        <input ref={galRef} type="file" accept="image/*" onChange={onPhoto} className="hidden" />
        <div className="grid grid-cols-2 gap-2.5">
          {[
            ['Câmera', camRef],
            ['Galeria', galRef],
          ].map(([label, ref]) => (
            <button
              key={label as string}
              type="button"
              onClick={() => (ref as React.RefObject<HTMLInputElement>).current?.click()}
              className="flex h-16 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-2xl border border-dash bg-white text-base text-terra-dark"
            >
              <span className="text-xl leading-none">+</span>
              {label as string}
            </button>
          ))}
        </div>
        {isPending && !all ? (
          <Skeleton className="h-[290px] rounded-[18px]" />
        ) : !photos.length ? (
          <div className="rounded-2xl border-[1.5px] border-dashed border-dash px-4 py-7 text-center text-[15px] text-muted">
            Nenhuma imagem ainda
          </div>
        ) : (
          photos.map((x) => {
            const src = urls?.[x.caminho]
            const date = tsToBRTime(x.created_at)
            return (
              <div key={x.id} className="flex flex-col gap-2.5 rounded-[18px] border border-line bg-white p-3">
                <div
                  onClick={() => setViewer({ id: x.id, src, date, note: noteOf(x) })}
                  className="relative flex h-[200px] cursor-zoom-in items-center justify-center overflow-hidden rounded-xl bg-dark text-sm text-muted"
                >
                  <RxImage id={x.id} src={src} />
                  {(x.pending || x.failed) && (
                    <span className="absolute right-2 bottom-2 rounded-lg bg-black/55 px-2 py-1 text-xs text-white">
                      {x.pending ? 'Enviando…' : 'Falhou'}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{date}</span>
                  <button
                    type="button"
                    onClick={() => remove.mutate(x)}
                    disabled={x.pending}
                    className="h-9 cursor-pointer border-0 bg-transparent px-1 text-sm text-muted"
                  >
                    Remover
                  </button>
                </div>
                <input
                  value={noteOf(x)}
                  onChange={(e) => setNotes((n) => ({ ...n, [x.id]: e.target.value }))}
                  placeholder="Observação (opcional)"
                  className="h-[46px] rounded-xl border border-field bg-cream px-3 text-base"
                />
              </div>
            )
          })
        )}
      </div>
      <FooterBar>
        <PrimaryButton onClick={onSave} disabled={!a || uploading}>
          {uploading ? 'Enviando imagem…' : 'Salvar'}
        </PrimaryButton>
      </FooterBar>
      <RxViewer item={viewer} onClose={() => setViewer(null)} />
    </Screen>
  )
}
