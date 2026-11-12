import * as Dialog from '@radix-ui/react-dialog'
import type { ReactNode } from 'react'

/** Bottom sheet with the prototype's look (handle, cream, 28px top radius). */
export function Sheet({
  open,
  onOpenChange,
  title,
  children,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  title: string
  children: ReactNode
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-[rgba(43,36,33,.45)]" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-w-[430px] flex-col md:max-w-[560px] gap-4 rounded-t-[28px] bg-cream px-[22px] pt-2.5 pb-[max(34px,env(safe-area-inset-bottom))] outline-none"
        >
          <Dialog.Title className="sr-only">{title}</Dialog.Title>
          <div className="h-[5px] w-10 self-center rounded-[3px] bg-dash" />
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
