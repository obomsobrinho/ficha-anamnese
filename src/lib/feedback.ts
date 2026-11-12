import { toast } from 'sonner'

export function savedToast(message = 'Salvo') {
  toast(message, { duration: 2200 })
}

/** A save that failed stays visible until the person retries or dismisses it. */
export function errorToast(message: string, retry?: () => void) {
  toast.error(message, {
    duration: Infinity,
    closeButton: true,
    action: retry ? { label: 'Tentar de novo', onClick: retry } : undefined,
  })
}
