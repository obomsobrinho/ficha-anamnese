import * as Dialog from '@radix-ui/react-dialog'
import type { ReactNode } from 'react'

/** shadcn-style dialog, restyled with the prototype's sheet look. */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  body,
  confirmLabel,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  title: ReactNode
  body: ReactNode
  confirmLabel: string
  onConfirm: () => void
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-[rgba(43,36,33,.45)]" />
        <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-w-[430px] flex-col gap-4 rounded-t-[28px] bg-cream px-[22px] pt-2.5 pb-[max(34px,env(safe-area-inset-bottom))] outline-none">
          <div className="h-[5px] w-10 self-center rounded-[3px] bg-dash" />
          <Dialog.Title className="m-0 font-serif text-[28px] leading-[1.15] font-medium text-pretty">{title}</Dialog.Title>
          <Dialog.Description className="m-0 text-base leading-normal text-muted2">{body}</Dialog.Description>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={onConfirm}
              className="h-14 cursor-pointer rounded-2xl border-0 bg-alert-fg text-[17px] font-medium text-white"
            >
              {confirmLabel}
            </button>
            <Dialog.Close className="h-14 cursor-pointer rounded-2xl border border-field bg-white text-[17px]">
              Cancelar
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
