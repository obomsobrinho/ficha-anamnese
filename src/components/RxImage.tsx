import * as Dialog from '@radix-ui/react-dialog'
import { useState } from 'react'
import { localPreviews } from '@/data/arquivos'

/** Spinning ring shown over the dark image box while the radiograph downloads. */
function Spinner() {
  return (
    <span
      role="status"
      aria-label="Carregando imagem"
      className="pointer-events-none absolute top-1/2 left-1/2 size-8 -translate-x-1/2 -translate-y-1/2 animate-spin rounded-full border-[3px] border-white/20 border-t-white/80"
    />
  )
}

/** Image from a signed URL or, while uploading, the local preview. Dark box with a spinner while loading. */
export function RxImage({ id, src, alt = 'Radiografia' }: { id: string; src?: string; alt?: string }) {
  const url = src || localPreviews.get(id)
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null)
  const loaded = !!url && loadedUrl === url
  return (
    <>
      {!loaded && <Spinner />}
      {url && (
        <img
          src={url}
          alt={alt}
          onLoad={() => setLoadedUrl(url)}
          onError={() => setLoadedUrl(url)}
          className="size-full object-cover transition-opacity duration-200"
          style={{ opacity: loaded ? 1 : 0 }}
        />
      )}
    </>
  )
}

export interface ViewerItem {
  id: string
  src?: string
  date: string
  note: string
}

/** Full-screen black viewer from the prototype. */
export function RxViewer({ item, onClose }: { item: ViewerItem | null; onClose: () => void }) {
  const url = item ? item.src || localPreviews.get(item.id) : undefined
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null)
  const loaded = !!url && loadedUrl === url
  return (
    <Dialog.Root open={!!item} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-0 z-50 mx-auto flex max-w-[430px] flex-col bg-black outline-none md:max-w-none"
        >
          <Dialog.Title className="sr-only">Radiografia</Dialog.Title>
          <div className="pt-safe flex-none">
            <div className="flex h-[60px] items-end justify-between px-4 pb-2 text-white">
              <span className="text-sm">{item?.date}</span>
              <Dialog.Close className="size-11 cursor-pointer rounded-[22px] border-0 bg-white/15 text-[22px] text-white">
                ×
              </Dialog.Close>
            </div>
          </div>
          <div className="text-muted relative flex min-h-0 flex-1 items-center justify-center text-[15px]">
            {!loaded && <Spinner />}
            {url && (
              <img
                src={url}
                alt="Radiografia"
                onLoad={() => setLoadedUrl(url)}
                onError={() => setLoadedUrl(url)}
                className="max-h-full max-w-full object-contain transition-opacity duration-200"
                style={{ opacity: loaded ? 1 : 0 }}
              />
            )}
          </div>
          <div className="pb-safe text-avatar flex-none px-5 pt-3.5 text-center text-sm">{item?.note}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
