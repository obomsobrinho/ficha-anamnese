import { lazy, Suspense, useRef, useState } from 'react'
import { useParams } from 'react-router'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { RxImage, RxViewer, type ViewerItem } from '@/components/RxImage'
import { Screen, TopBar, useBack } from '@/components/layout'
import { FooterBar, PrimaryButton, Skeleton } from '@/components/ui'
import {
  useDeleteArquivo,
  useEditArquivo,
  useSaveNotas,
  useSignedUrls,
  useUploadArquivo,
} from '@/data/arquivos'
import { useArquivos, useSavePart } from '@/data/atendimentos'
import { todayBR, tsToBRTime } from '@/lib/dates'
import { isEdited } from '@/lib/image'
import { ARQUIVO_TIPO, type Arquivo } from '@/types'
import { useAtendimentoView } from './AtendimentoScreen'

const RxEditor = lazy(() => import('@/components/RxEditor'))

const PENCIL = 'M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4'

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
  const edit = useEditArquivo()
  const [editing, setEditing] = useState<{ row: Row; src: string } | null>(null)
  const [restoring, setRestoring] = useState<Row | null>(null)
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
    if (changed.length)
      saveNotas.mutate({ atendimentoId: aid, notas: changed.map((p) => ({ id: p.id, nota: notes[p.id] })) })
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
      <TopBar
        onBack={back}
        badge={A.teethLabel || ' '}
        title={title}
        subtitle={`${P.displayName} · ${A.proc}`}
      />
      <div className="flex flex-1 flex-col gap-5 px-5 pt-5 pb-10">
        <input
          ref={camRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={onPhoto}
          className="hidden"
        />
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
              className="border-dash text-terra-dark flex h-16 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-2xl border bg-white text-base"
            >
              <span className="text-xl leading-none">+</span>
              {label as string}
            </button>
          ))}
        </div>
        {isPending && !all ? (
          <Skeleton className="h-[290px] rounded-[18px]" />
        ) : !photos.length ? (
          <div className="border-dash text-muted rounded-2xl border-[1.5px] border-dashed px-4 py-7 text-center text-[15px]">
            Nenhuma imagem ainda
          </div>
        ) : (
          photos.map((x) => {
            const src = urls?.[x.caminho]
            const date = tsToBRTime(x.created_at)
            return (
              <div
                key={x.id}
                className="border-line flex flex-col gap-2.5 rounded-[18px] border bg-white p-3"
              >
                <div
                  onClick={() => setViewer({ id: x.id, src, date, note: noteOf(x) })}
                  className="bg-dark text-muted relative flex h-[200px] cursor-zoom-in items-center justify-center overflow-hidden rounded-xl text-sm md:h-[320px]"
                >
                  <RxImage id={x.id} src={src} />
                  {isEdited(x.caminho) && (
                    <span className="absolute top-2 left-2 rounded-lg bg-black/55 px-2 py-1 text-xs text-white">
                      Editado
                    </span>
                  )}
                  {(x.pending || x.failed) && (
                    <span className="absolute right-2 bottom-2 rounded-lg bg-black/55 px-2 py-1 text-xs text-white">
                      {x.pending ? 'Enviando…' : 'Falhou'}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium whitespace-nowrap">{date}</span>
                  <span className="flex items-center gap-1">
                    {isEdited(x.caminho) && (
                      <button
                        type="button"
                        onClick={() => setRestoring(x)}
                        disabled={x.pending}
                        className="text-muted h-9 cursor-pointer border-0 bg-transparent px-1 text-sm"
                      >
                        Original
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => src && setEditing({ row: x, src })}
                      disabled={x.pending || x.failed || !src}
                      className="text-terra flex h-9 cursor-pointer items-center gap-1 border-0 bg-transparent px-1.5 text-sm disabled:opacity-40"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden
                      >
                        <path d={PENCIL} />
                      </svg>
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => remove.mutate(x)}
                      disabled={x.pending}
                      className="text-muted h-9 cursor-pointer border-0 bg-transparent px-1 text-sm"
                    >
                      Remover
                    </button>
                  </span>
                </div>
                <input
                  value={noteOf(x)}
                  onChange={(e) => setNotes((n) => ({ ...n, [x.id]: e.target.value }))}
                  placeholder="Observação (opcional)"
                  className="border-field bg-cream h-[46px] rounded-xl border px-3 text-base"
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
      {editing && (
        <Suspense
          fallback={
            <div className="bg-cream text-muted fixed inset-0 z-50 flex items-center justify-center text-[15px]">
              Abrindo editor…
            </div>
          }
        >
          <RxEditor
            src={editing.src}
            onClose={() => setEditing(null)}
            onSave={(blob) => {
              edit.saveEdit(editing.row, blob)
              setEditing(null)
            }}
          />
        </Suspense>
      )}
      <ConfirmDialog
        open={!!restoring}
        onOpenChange={(o) => !o && setRestoring(null)}
        title="Voltar para a imagem original?"
        body="A edição desta radiografia será descartada."
        confirmLabel="Voltar ao original"
        onConfirm={() => {
          if (restoring) edit.restore(restoring)
          setRestoring(null)
        }}
      />
    </Screen>
  )
}
