import * as Dialog from '@radix-ui/react-dialog'
import { useState } from 'react'
import { localPreviews } from '@/data/arquivos'

/** Image from a signed URL or, while uploading, the local preview. Dark box while loading, like the prototype. */
export function RxImage({ id, src, alt = 'Radiografia' }: { id: string; src?: string; alt?: string }) {
  const [loaded, setLoaded] = useState(false)
  const url = src || localPreviews.get(id)
  return url ? (
    <img
      src={url}
      alt={alt}
      onLoad={() => setLoaded(true)}
      className="size-full object-cover transition-opacity duration-200"
      style={{ opacity: loaded ? 1 : 0 }}
    />
  ) : null
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
  return (
    <Dialog.Root open={!!item} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-0 z-50 mx-auto flex max-w-[430px] flex-col bg-black md:max-w-none outline-none"
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
          <div className="flex min-h-0 flex-1 items-center justify-center text-[15px] text-muted">
            {url && <img src={url} alt="Radiografia" className="max-h-full max-w-full object-contain" />}
          </div>
          <div className="pb-safe flex-none px-5 pt-3.5 text-center text-sm text-avatar">{item?.note}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
