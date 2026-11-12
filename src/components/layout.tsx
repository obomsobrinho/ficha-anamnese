import type { ReactNode } from 'react'
import { useNavigate } from 'react-router'
import type { Alert } from '@/features/pacientes/view'
import { cn } from '@/lib/cn'
import { BackChevron } from './ui'

/** Go back in history when there is one inside the app, else to a sensible parent. */
export function useBack(fallback: string) {
  const navigate = useNavigate()
  return () => {
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0
    if (idx > 0) navigate(-1)
    else navigate(fallback, { replace: true })
  }
}

export function Screen({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('relative flex min-h-dvh flex-col', className)}>{children}</div>
}

/** Sticky top bar with ‹, optional tooth badge, title and subtitle. */
export function TopBar({
  onBack,
  title,
  subtitle,
  badge,
}: {
  onBack: () => void
  title: ReactNode
  subtitle?: ReactNode
  badge?: ReactNode
}) {
  return (
    <div className="pt-safe sticky top-0 z-10 flex-none border-b border-divider bg-cream">
      <div className="flex items-center gap-1.5 px-2.5 pb-3">
        <BackChevron onClick={onBack} />
        {badge != null && (
          <div className="box-border flex h-10 min-w-10 flex-none items-center justify-center rounded-[11px] bg-terra px-1.5 text-base font-medium text-white">
            {badge}
          </div>
        )}
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-[17px] font-medium">{title}</span>
          {subtitle != null && <span className="truncate text-xs text-muted">{subtitle}</span>}
        </div>
      </div>
    </div>
  )
}

/** Text back button: "‹ Pacientes". */
export function TextBack({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <div className="pt-safe flex flex-none items-center px-2.5">
      <button
        type="button"
        onClick={onClick}
        className="flex h-11 min-w-0 cursor-pointer items-center gap-1 border-0 bg-transparent px-2 text-base text-terra"
      >
        <span className="text-[28px] leading-none font-light">‹</span>
        <span className="truncate">{label}</span>
      </button>
    </div>
  )
}

/** The floating primary action pinned at the bottom (Nova ficha, Novo atendimento). */
export function FloatingAction({ children }: { children: ReactNode }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-10 mx-auto max-w-[430px] px-5 pb-[max(34px,env(safe-area-inset-bottom))]">
      <div className="pointer-events-auto">{children}</div>
    </div>
  )
}

export function AlertChips({ alerts }: { alerts: Alert[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {alerts.map((al, i) => (
        <span
          key={i}
          className="box-border flex min-h-[30px] items-center rounded-[15px] px-3 py-1 text-[13px]"
          style={{ background: al.bg, color: al.fg, fontWeight: al.fw }}
        >
          {al.label}
        </span>
      ))}
    </div>
  )
}
