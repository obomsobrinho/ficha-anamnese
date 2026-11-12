import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

/** True while the viewport is portrait (the phone's rotation lock keeps it so even when held sideways). */
function usePortrait() {
  const q = '(orientation: portrait)'
  const [portrait, setPortrait] = useState(() => window.matchMedia(q).matches)
  useEffect(() => {
    const m = window.matchMedia(q)
    const on = () => setPortrait(m.matches)
    m.addEventListener('change', on)
    return () => m.removeEventListener('change', on)
  }, [])
  return portrait
}

/**
 * Full-screen landscape signing area. In portrait the whole layer is rotated 90°,
 * so the patient turns the phone sideways and gets a wide pad either way.
 */
export function SignatureOverlay({
  signer,
  date,
  details,
  saving,
  onClose,
  onSign,
}: {
  signer: string
  date: string
  details: ReactNode
  saving: boolean
  onClose: () => void
  onSign: (png: Blob) => void
}) {
  const portrait = usePortrait()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [empty, setEmpty] = useState(true)
  const [showDetails, setShowDetails] = useState(false)
  const drawing = useRef(false)
  const last = useRef<[number, number] | null>(null)

  // Lock page scroll while signing.
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  // Size the bitmap to the canvas' own (unrotated) box at device resolution.
  useEffect(() => {
    const c = canvasRef.current
    if (!c) return
    const dpr = Math.min(window.devicePixelRatio || 1, 3)
    c.width = Math.round(c.offsetWidth * dpr)
    c.height = Math.round(c.offsetHeight * dpr)
    setEmpty(true)
  }, [portrait])

  /** Pointer position in canvas pixels, undoing the 90° rotation when present. */
  const pt = (e: React.PointerEvent): [number, number] => {
    const c = canvasRef.current!
    const r = c.getBoundingClientRect()
    let x: number, y: number, w: number, h: number
    if (portrait) {
      // rotate(90deg): local x runs down the screen, local y runs right-to-left.
      x = e.clientY - r.top
      y = r.right - e.clientX
      w = r.height
      h = r.width
    } else {
      x = e.clientX - r.left
      y = e.clientY - r.top
      w = r.width
      h = r.height
    }
    return [(x * c.width) / w, (y * c.height) / h]
  }

  const ctx = () => {
    const g = canvasRef.current!.getContext('2d')!
    const dpr = canvasRef.current!.width / canvasRef.current!.offsetWidth
    g.lineWidth = 3 * dpr
    g.lineCap = 'round'
    g.lineJoin = 'round'
    g.strokeStyle = '#2B2421'
    return g
  }

  const down = (e: React.PointerEvent) => {
    canvasRef.current?.setPointerCapture?.(e.pointerId)
    drawing.current = true
    const p = pt(e)
    last.current = p
    const g = ctx()
    g.beginPath()
    g.arc(p[0], p[1], g.lineWidth / 2, 0, Math.PI * 2)
    g.fillStyle = '#2B2421'
    g.fill()
    if (empty) setEmpty(false)
  }
  const move = (e: React.PointerEvent) => {
    if (!drawing.current || !last.current) return
    const p = pt(e)
    const g = ctx()
    const [lx, ly] = last.current
    g.beginPath()
    g.moveTo(lx, ly)
    g.quadraticCurveTo(lx, ly, (lx + p[0]) / 2, (ly + p[1]) / 2)
    g.lineTo(p[0], p[1])
    g.stroke()
    last.current = p
  }
  const up = () => {
    drawing.current = false
    last.current = null
  }
  const clear = () => {
    const c = canvasRef.current
    if (!c) return
    c.getContext('2d')!.clearRect(0, 0, c.width, c.height)
    setEmpty(true)
  }
  const sign = () => {
    const c = canvasRef.current
    if (!c || empty || saving) return
    c.toBlob((b) => b && onSign(b), 'image/png')
  }

  const layer = portrait
    ? {
        width: '100dvh',
        height: '100vw',
        transform: 'translate(100vw, 0) rotate(90deg)',
        transformOrigin: '0 0',
      }
    : { width: '100vw', height: '100dvh' }

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-hidden bg-cream">
      <div className="absolute top-0 left-0 flex flex-col" style={layer}>
        <div className="flex flex-none items-center gap-2 px-5 pt-3">
          <button
            type="button"
            onClick={() => setShowDetails((s) => !s)}
            className="h-11 cursor-pointer rounded-xl border border-dash bg-white px-3.5 text-[15px] text-terra-dark"
          >
            Ver detalhes
          </button>
          <div className="flex-1" />
          <button type="button" onClick={clear} className="h-11 cursor-pointer border-0 bg-transparent px-2 text-[15px] text-terra">
            Limpar
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="size-11 cursor-pointer rounded-[22px] border-0 bg-sand text-[22px] text-muted2"
          >
            ×
          </button>
        </div>
        <div className="relative mx-5 my-3 min-h-0 flex-1 overflow-hidden rounded-[18px] border border-field bg-white">
          <canvas
            ref={canvasRef}
            onPointerDown={down}
            onPointerMove={move}
            onPointerUp={up}
            onPointerCancel={up}
            onPointerLeave={up}
            className="absolute inset-0 size-full cursor-crosshair touch-none"
          />
          <div className="pointer-events-none absolute right-[22px] bottom-[46px] left-[22px] h-px bg-dash" />
          <div className="pointer-events-none absolute right-[22px] bottom-3.5 left-[22px] truncate text-[13px] text-muted2">
            {signer} · {date}
          </div>
          {empty && (
            <div className="pointer-events-none absolute inset-[0_0_50px] flex items-center justify-center text-[15px] text-chev">
              Assine aqui com o dedo
            </div>
          )}
          {showDetails && (
            <div className="absolute inset-0 overflow-auto bg-panel p-[18px]">{details}</div>
          )}
        </div>
        <div className="flex flex-none justify-end px-5 pb-4">
          <button
            type="button"
            onClick={sign}
            disabled={empty || saving}
            className="h-14 min-w-[200px] cursor-pointer rounded-2xl border-0 px-6 text-lg font-medium text-white"
            style={{ background: empty || saving ? '#CDB3A7' : '#A3604B' }}
          >
            {saving ? 'Salvando…' : 'Assinar'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
