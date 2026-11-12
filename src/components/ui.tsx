// Primitives ported from the prototype's inline styles.
import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export function PrimaryButton({ className, disabled, ...p }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...p}
      disabled={disabled}
      className={cn(
        'flex h-14 w-full cursor-pointer items-center justify-center gap-2.5 rounded-2xl border-0 text-[17px] font-medium text-white',
        disabled ? 'bg-disabled' : 'bg-terra',
        className,
      )}
    />
  )
}

export function FooterBar({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('pb-safe flex-none border-t border-divider bg-cream px-5 pt-3', className)}>{children}</div>
  )
}

export const fieldClass =
  'h-12 rounded-[14px] border border-field bg-white px-3.5 text-base min-w-0'

export const TextInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function TextInput({ className, ...p }, ref) {
    return <input ref={ref} {...p} className={cn(fieldClass, className)} />
  },
)

export const TextArea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function TextArea({ className, ...p }, ref) {
    return (
      <textarea
        ref={ref}
        {...p}
        className={cn(
          'min-h-[84px] resize-none rounded-[14px] border border-field bg-white px-3.5 py-3 text-base leading-[1.4]',
          className,
        )}
      />
    )
  },
)

export function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn('flex flex-col gap-1.5 text-[13px] text-muted2', className)}>
      {label}
      {children}
    </label>
  )
}

export function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('text-[11px] tracking-[.22em] text-terra-mid uppercase', className)}>{children}</div>
}

/** Segmented control: Sim/Não, Permanentes/Decíduos, tests. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  toggleable,
}: {
  options: readonly T[]
  value: string
  onChange: (v: T | '') => void
  toggleable?: boolean
}) {
  return (
    <div className="flex gap-1 rounded-[14px] bg-sand p-1">
      {options.map((o) => {
        const on = value === o
        return (
          <button
            key={o}
            type="button"
            onClick={() => onChange(toggleable && on ? '' : o)}
            className={cn(
              'h-11 flex-1 cursor-pointer rounded-[11px] border-0 text-[15px]',
              on ? 'bg-white text-terra-dark shadow-[0_1px_3px_rgba(60,40,30,.15)]' : 'bg-transparent text-muted2',
            )}
          >
            {o}
          </button>
        )
      })}
    </div>
  )
}

/** Pill chip used for multi-select (doenças, HDA, inspeção, irrigação...). */
export function Chip({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'min-h-11 cursor-pointer rounded-[22px] border px-4 text-[15px]',
        on ? 'border-terra bg-terra text-white' : 'border-field bg-white text-ink',
      )}
    >
      {(on ? '✓ ' : '') + label}
    </button>
  )
}

/** Radio list option (diagnóstico, tipo de tratamento). */
export function RadioOption({ label, on, onClick, className }: { label: string; on: boolean; onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex min-h-[50px] cursor-pointer items-center gap-3 rounded-[14px] border px-4 text-left text-[15px]',
        on ? 'border-terra-mid bg-sel text-terra-dark' : 'border-field bg-white text-ink',
        className,
      )}
    >
      <span
        className="box-border size-[18px] flex-none rounded-full"
        style={{ border: on ? '6px solid #A3604B' : '1.5px solid #CDBDB3' }}
      />
      {label}
    </button>
  )
}

export function BackChevron({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Voltar"
      className="size-11 cursor-pointer border-0 bg-transparent text-[30px] font-light text-terra"
    >
      ‹
    </button>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} />
}

export function Chevron() {
  return <span className="text-2xl font-light text-chev">›</span>
}
