// Dentra brand: a tooth-shaped "D" inside a terracotta tile, followed by "entra" (owner's choice, 13/11/2026).

export const TOOTH_D_PATH =
  'M3.2 2.2H11.5C20.5 2.2 24.6 8.4 24.6 15.2 24.6 20.6 23 24.6 21.2 27.6 20 29.6 18 31.2 16.9 29.2 16 27.4 15.5 25 13.8 25 12.1 25 11.6 27.4 10.7 29.2 9.8 31 8.2 30.8 7.4 30.8H3.2Z'

export function DentraIcon({ size = 52 }: { size?: number }) {
  return (
    <div
      aria-hidden
      className="flex flex-none items-center justify-center bg-terra"
      style={{ width: size, height: size, borderRadius: size * 0.27 }}
    >
      <svg width={size * 0.54} height={size * 0.64} viewBox="0 0 27 32">
        <path d={TOOTH_D_PATH} fill="#FFFCF6" />
      </svg>
    </div>
  )
}

export function DentraLogo({ size = 46 }: { size?: number }) {
  return (
    <div
      role="img"
      aria-label="Dentra"
      className="flex items-center whitespace-nowrap text-ink"
      style={{ gap: size * 0.17, fontSize: size, lineHeight: 1 }}
    >
      <DentraIcon size={size * 1.13} />
      <span className="font-light tracking-[1px]" aria-hidden>
        ent<span className="font-semibold text-terra">ra</span>
      </span>
    </div>
  )
}
