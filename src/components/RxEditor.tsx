import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import FilerobotImageEditor, { TABS, TOOLS } from 'react-filerobot-image-editor'
// @ts-expect-error untyped internal module; the editor reads labels from this global table
import { updateTranslations } from 'react-filerobot-image-editor/lib/utils/translator'
// @ts-expect-error untyped internal module; the Filters tab renders this shared array
import { AVAILABLE_FILTERS } from 'react-filerobot-image-editor/lib/components/tools/Filters/Filters.constants'

const TERRA = '#A3604B'
const MARK = '#E5484D'

/** Quick colors for marking an x-ray; each drawing tool remembers its own. */
const COLORS = [
  { c: '#E5484D', name: 'Vermelho' },
  { c: '#FFD43B', name: 'Amarelo' },
  { c: '#30A46C', name: 'Verde' },
  { c: '#3E8EF7', name: 'Azul' },
  { c: '#FFFFFF', name: 'Branco' },
  { c: '#111111', name: 'Preto' },
]
type DrawTool = 'Pen' | 'Arrow' | 'Ellipse' | 'Rect' | 'Line' | 'Text'
const DRAW_TOOLS: DrawTool[] = ['Pen', 'Arrow', 'Ellipse', 'Rect', 'Line', 'Text']
const isDrawTool = (t: unknown): t is DrawTool => DRAW_TOOLS.includes(t as DrawTool)
const START_COLORS: Record<DrawTool, string> = {
  Pen: MARK,
  Arrow: MARK,
  Ellipse: MARK,
  Rect: MARK,
  Line: MARK,
  Text: '#FFD43B',
}
/**
 * "No tool" in the Marcar tab. The editor falls back to the tab's first tool when toolId is empty,
 * so a placeholder id that belongs to no tab keeps every drawing tool off (pinch and pan still work).
 */
const NO_TOOL = 'RxNone'
/** Touch screens zoom with two fingers; mouse users zoom with the wheel. */
const TOUCH = typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches

const TAB_LIST = [
  { id: TABS.ANNOTATE, label: 'Marcar', icon: 'M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4' },
  {
    id: TABS.FINETUNE,
    label: 'Ajustes',
    icon: 'M4 7h9M17 7h3M4 17h3M11 17h9M15 5v4M9 15v4',
  },
  { id: TABS.FILTERS, label: 'Filtros', icon: 'M12 4a8 8 0 1 0 0 16a8 8 0 1 0 0-16zM12 4v16' },
  { id: TABS.ADJUST, label: 'Recortar', icon: 'M7 3v13a1 1 0 0 0 1 1h13M3 7h13a1 1 0 0 1 1 1v13' },
]
const UNDO = 'M9 14L4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11'
const REDO = 'M15 14l5-5-5-5M20 9H9.5a5.5 5.5 0 0 0 0 11H13'

/** Subset of the editor's internal state that our chrome reads and writes. */
interface EditorState {
  tabId?: string | null
  toolId?: string | null
  selectionsIds?: string[]
  annotations?: Record<string, { name: string }>
  pastDesignStates?: unknown[]
  hasUndo?: boolean
  hasRedo?: boolean
  zoom?: { factor?: number }
  loadingData?: { isLoadingGlobally?: boolean }
  shownImageDimensions?: { width?: number }
}
type UpdateState = (part: object | ((s: EditorState) => object | null)) => void

interface View {
  tab: string
  tool: DrawTool | null
  selected: DrawTool | null
  undo: boolean
  redo: boolean
  canSave: boolean
  zoomed: boolean
}
const START_VIEW: View = {
  tab: TABS.ANNOTATE,
  tool: null,
  selected: null,
  undo: false,
  redo: false,
  canSave: false,
  zoomed: false,
}

function Icon({ d, size = 22 }: { d: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={d} />
    </svg>
  )
}

/** Instant tooltips: move native titles (slow, easy to miss) into data-tip, shown by CSS. */
function useInstantTips(root: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const el = root.current
    if (!el) return
    const move = () =>
      el.querySelectorAll<HTMLElement>('[title]').forEach((n) => {
        if (n.title) n.dataset.tip = n.title
        n.removeAttribute('title')
      })
    move()
    const mo = new MutationObserver(move)
    mo.observe(el, { subtree: true, childList: true, attributes: true, attributeFilter: ['title'] })
    return () => mo.disconnect()
  }, [root])
}

/** Portuguese labels for every string the enabled tabs show. */
const PT = {
  name: 'Nome',
  save: 'Salvar',
  saveAs: 'Salvar como',
  back: 'Voltar',
  loading: 'Carregando…',
  resetOperations: 'Desfazer tudo',
  changesLoseWarningHint: 'Todas as alterações desta edição serão perdidas. Continuar?',
  discardChangesWarningHint: 'Se fechar agora, a edição não será salva.',
  cancel: 'Cancelar',
  apply: 'Aplicar',
  warning: 'Atenção',
  confirm: 'Confirmar',
  discardChanges: 'Descartar edição',
  undoTitle: 'Desfazer',
  redoTitle: 'Refazer',
  showImageTitle: 'Ver original',
  zoomInTitle: 'Aproximar',
  fitTitle: 'Ajustar à tela',
  zoomOutTitle: 'Afastar',
  toggleZoomMenuTitle: 'Zoom',
  adjustTab: 'Recortar',
  finetuneTab: 'Ajustes',
  filtersTab: 'Filtros',
  annotateTabLabel: 'Marcar',
  invalidImageError: 'Imagem inválida.',
  cropTool: 'Recortar',
  original: 'Original',
  custom: 'Livre',
  arrowTool: 'Seta',
  brightnessTool: 'Brilho',
  brightness: 'Brilho',
  contrastTool: 'Contraste',
  ellipseTool: 'Círculo',
  unFlipX: 'Desespelhar',
  flipX: 'Espelhar',
  unFlipY: 'Desvirar',
  flipY: 'Virar',
  lineTool: 'Linha',
  penTool: 'Pincel',
  rectangleTool: 'Retângulo',
  rotateTool: 'Girar',
  textTool: 'Texto',
  textAlignment: 'Alinhamento',
  fontFamily: 'Fonte',
  size: 'Tamanho',
  opacity: 'Transparência',
  transparency: 'Transparência',
  stroke: 'Espessura',
  shadow: 'Sombra',
  position: 'Posição',
  actualSize: 'Tamanho real (100%)',
  fitSize: 'Ajustar à tela',
  tabsMenu: 'Menu',
  width: 'Largura',
  height: 'Altura',
  px: 'px',
  invalidTextContent: 'Texto inválido',
}

// Applied before the first render: the toolbar memoizes its labels and would otherwise stay in English.
updateTranslations(PT)

// Of the photo filters only "Invert" helps reading an x-ray; keep it (as "Negativo") next to "Original".
const keep: Record<string, string> = { Original: 'Original', Invert: 'Negativo' }
const filters = AVAILABLE_FILTERS as { label: string }[]
filters.splice(
  0,
  filters.length,
  ...filters.filter((f) => f.label in keep || Object.values(keep).includes(f.label)),
)
filters.forEach((f) => (f.label = keep[f.label] ?? f.label))

/**
 * Full-screen x-ray editor. Filerobot draws the image and the tool options; the top bar, the tab bar
 * and the color picker are ours, laid out like a phone photo editor so the image gets the space.
 */
export default function RxEditor({
  src,
  onSave,
  onClose,
}: {
  src: string
  onSave: (blob: Blob) => void
  onClose: () => void
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const updateRef = useRef<UpdateState | undefined>(undefined)
  const [colors, setColors] = useState(START_COLORS)
  const [view, setView] = useState<View>(START_VIEW)
  const [host, setHost] = useState<HTMLElement | null>(null)
  const [paletteOpen, setPaletteOpen] = useState(false)
  useInstantTips(rootRef)
  const acted = useRef(false)
  useEffect(() => {
    const el = rootRef.current
    const mark = () => (acted.current = true)
    for (const t of ['pointerdown', 'touchstart', 'click']) el?.addEventListener(t, mark, true)
    return () => {
      for (const t of ['pointerdown', 'touchstart', 'click']) el?.removeEventListener(t, mark, true)
    }
  }, [])

  const native = (cls: string) => rootRef.current?.querySelector<HTMLButtonElement>(cls)
  const update = (part: Parameters<UpdateState>[0]) => updateRef.current?.(part)

  // Follow the editor's state and keep our color slot mounted in its options row.
  useEffect(() => {
    // The updater runs inside the editor's render, so it only records; React state is set on the next tick.
    const seen = { ...START_VIEW }
    const id = setInterval(() => {
      const canSave =
        !!native('.FIE_buttons-save-btn-button') && !native('.FIE_buttons-save-btn-button')!.disabled
      setView((v) => {
        const next: View = {
          tab: seen.tab,
          tool: seen.tool,
          selected: seen.selected,
          undo: seen.undo,
          redo: seen.redo,
          zoomed: seen.zoomed,
          canSave,
        }
        return JSON.stringify(next) === JSON.stringify(v) ? v : next
      })
      updateRef.current?.((s) => {
        const sel = s.selectionsIds?.length === 1 ? s.annotations?.[s.selectionsIds[0]]?.name : null
        const tab = s.tabId ?? TABS.ANNOTATE
        seen.tab = tab
        seen.tool = tab === TABS.ANNOTATE && isDrawTool(s.toolId) ? s.toolId : null
        seen.selected = tab === TABS.ANNOTATE && isDrawTool(sel) ? sel : null
        seen.undo = !!s.hasUndo
        seen.redo = !!s.hasRedo
        seen.zoomed = (s.zoom?.factor ?? 1) > 1.02
        // Open with no tool, so the first touch zooms or pans instead of drawing. The editor re-selects its
        // default tool while it boots, so keep clearing until the user touches anything.
        if (!acted.current && tab === TABS.ANNOTATE && s.toolId !== NO_TOOL && s.shownImageDimensions?.width)
          return { toolId: NO_TOOL, pointerCssIcon: 'default' }
        return null
      })
      const wrap = rootRef.current?.querySelector<HTMLElement>('.FIE_tools-bar-wrapper')
      if (!wrap) return setHost(null)
      let h = wrap.querySelector<HTMLElement>(':scope > .rx-lead')
      if (!h) {
        h = document.createElement('div')
        h.className = 'rx-lead'
        wrap.prepend(h)
      }
      setHost((cur) => (cur === h ? cur : h))
    }, 150)
    return () => clearInterval(id)
  }, [])

  // Tapping the active drawing tool again turns it off.
  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const onClick = (e: MouseEvent) => {
      const btn = (e.target as HTMLElement).closest<HTMLElement>(
        '[data-testid^="FIE-tools-bar-item-button-"]',
      )
      if (!btn || btn.getAttribute('aria-selected') !== 'true') return
      // Re-clicking a selected tool does nothing in the editor, so swallowing the click is safe everywhere.
      e.stopPropagation()
      updateRef.current?.((s) =>
        (s.tabId ?? TABS.ANNOTATE) === TABS.ANNOTATE
          ? { toolId: NO_TOOL, selectionsIds: [], pointerCssIcon: 'default' }
          : null,
      )
    }
    el.addEventListener('click', onClick, true)
    return () => el.removeEventListener('click', onClick, true)
  }, [])

  // A second finger means pinch-to-zoom: drop whatever the first finger started drawing.
  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const g = { start: 0, multi: false, active: false }
    const onStart = (e: TouchEvent) => {
      if (!g.active) {
        g.active = true
        g.multi = false
        // Queued before any drawing update, so it sees the history as it was when the gesture began.
        updateRef.current?.((s) => {
          g.start = s.pastDesignStates?.length ?? 0
          return null
        })
      }
      if (e.touches.length > 1) g.multi = true
    }
    const onEnd = (e: TouchEvent) => {
      if (e.touches.length || !g.active) return
      g.active = false
      if (!g.multi) return
      // Each finger landing can start its own stroke: undo one step at a time until history is back to
      // where the gesture began, then forget the redo steps so the strokes cannot come back.
      const start = g.start
      let undone = 0
      const step = () => {
        let extra = 0
        updateRef.current?.((s) => {
          extra = (s.pastDesignStates?.length ?? 0) - start
          return null
        })
        setTimeout(() => {
          if (extra > 0 && undone < 10) {
            undone++
            native('.FIE_buttons-undo-btn')?.click()
            setTimeout(step, 30)
          } else if (undone) updateRef.current?.({ futureDesignStates: [], hasRedo: false })
        }, 40)
      }
      setTimeout(step, 30)
    }
    el.addEventListener('touchstart', onStart, { capture: true, passive: true })
    el.addEventListener('touchend', onEnd, { capture: true, passive: true })
    el.addEventListener('touchcancel', onEnd, { capture: true, passive: true })
    return () => {
      el.removeEventListener('touchstart', onStart, true)
      el.removeEventListener('touchend', onEnd, true)
      el.removeEventListener('touchcancel', onEnd, true)
    }
  }, [])

  const target = view.selected ?? view.tool
  const pick = (c: string) => {
    setPaletteOpen(false)
    if (!target) return
    setColors((cs) => ({ ...cs, [target]: c }))
    const { selected } = view
    if (selected) {
      // Recolor the selected marking right away.
      update((s) => {
        const id = s.selectionsIds![0]
        return {
          annotations: {
            [id]:
              selected === 'Text' ? { fill: c } : { stroke: c, ...(selected === 'Arrow' ? { fill: c } : {}) },
          },
        }
      })
    } else {
      // The tool reads its defaults when it mounts: bounce to another tool so the next marking uses the new color.
      const other = target === 'Pen' ? 'Line' : 'Pen'
      update({ toolId: other })
      setTimeout(() => update({ toolId: target }), 30)
    }
  }

  const openTab = (id: string) => {
    setPaletteOpen(false)
    if (id === view.tab) return
    // Native tabs keep the editor's own tab-switch logic; index follows tabsIds.
    const i = TAB_LIST.findIndex((t) => t.id === id)
    rootRef.current?.querySelectorAll<HTMLElement>('.FIE_tab')[i]?.click()
    if (id === TABS.ANNOTATE) setTimeout(() => update({ toolId: NO_TOOL, pointerCssIcon: 'default' }), 30)
  }

  const topBtn =
    'flex h-10 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent disabled:cursor-default disabled:opacity-35'

  return (
    <div
      ref={rootRef}
      data-tab={view.tab}
      className="rx-editor pt-safe fixed inset-0 z-50 flex flex-col bg-white"
      // Only the real home-indicator inset: the app-wide 34px minimum left a blank strip in the browser.
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <header className="border-line flex h-13 flex-none items-center justify-between border-b px-2">
        <button
          type="button"
          onClick={() => (view.canSave ? native('.FIE_buttons-close-btn')?.click() : onClose())}
          className={topBtn + ' text-muted px-3 text-[15px]'}
        >
          Cancelar
        </button>
        <span className="flex items-center gap-1">
          <button
            type="button"
            data-tip="Desfazer"
            aria-label="Desfazer"
            disabled={!view.undo}
            onClick={() => native('.FIE_buttons-undo-btn')?.click()}
            className={topBtn + ' text-ink w-10'}
          >
            <Icon d={UNDO} />
          </button>
          <button
            type="button"
            data-tip="Refazer"
            aria-label="Refazer"
            disabled={!view.redo}
            onClick={() => native('.FIE_buttons-redo-btn')?.click()}
            className={topBtn + ' text-ink w-10'}
          >
            <Icon d={REDO} />
          </button>
        </span>
        <button
          type="button"
          disabled={!view.canSave}
          onClick={() => native('.FIE_buttons-save-btn-button')?.click()}
          className={topBtn + ' bg-terra! px-4 text-[15px] text-white'}
        >
          Salvar
        </button>
      </header>

      <div className="relative min-h-0 flex-1">
        <FilerobotImageEditor
          updateStateFnRef={updateRef}
          source={src}
          language="en"
          useBackendTranslations={false}
          translations={PT}
          tabsIds={TAB_LIST.map((t) => t.id)}
          // @ts-expect-error tabsToolsIds is read by the editor but missing from its types
          tabsToolsIds={{
            [TABS.ANNOTATE]: [TOOLS.PEN, TOOLS.ARROW, TOOLS.ELLIPSE, TOOLS.RECT, TOOLS.LINE, TOOLS.TEXT],
            [TABS.FINETUNE]: [TOOLS.BRIGHTNESS, TOOLS.CONTRAST],
            [TABS.FILTERS]: [TOOLS.FILTERS],
            [TABS.ADJUST]: [TOOLS.CROP, TOOLS.ROTATE, TOOLS.FLIP_X, TOOLS.FLIP_Y],
          }}
          defaultTabId={TABS.ANNOTATE}
          annotationsCommon={{ fill: MARK, stroke: MARK, strokeWidth: 10 }}
          Pen={{ stroke: colors.Pen, strokeWidth: 10, selectAnnotationAfterDrawing: false }}
          Arrow={{
            stroke: colors.Arrow,
            fill: colors.Arrow,
            strokeWidth: 10,
            pointerLength: 36,
            pointerWidth: 36,
          }}
          Ellipse={{ fill: 'transparent', stroke: colors.Ellipse, strokeWidth: 10 }}
          Rect={{ fill: 'transparent', stroke: colors.Rect, strokeWidth: 10 }}
          Line={{ stroke: colors.Line, strokeWidth: 10 }}
          Text={{
            fill: colors.Text,
            fontSize: 64,
            fonts: [{ label: 'Jost', value: 'Jost' }],
            fontFamily: 'Jost',
          }}
          Rotate={{ componentType: 'buttons', angle: 90 }}
          Crop={{ ratio: 'custom', noPresets: true }}
          defaultSavedImageType="jpeg"
          defaultSavedImageQuality={0.85}
          defaultSavedImageName="radiografia"
          savingPixelRatio={1}
          previewPixelRatio={window.devicePixelRatio || 1}
          disableSaveIfNoChanges
          avoidChangesNotSavedAlertOnLeave
          closeAfterSave
          theme={{
            palette: {
              'accent-primary': TERRA,
              'accent-primary-hover': '#8A4F3D',
              'accent-primary-active': TERRA,
              'accent-primary-disabled': '#D7BFB3',
              'accent-stateless': TERRA,
              'bg-primary-active': '#F6EBE4',
            },
            typography: { fontFamily: 'Jost, system-ui, sans-serif' },
          }}
          onBeforeSave={() => false}
          onSave={(img) => {
            const canvas = img.imageCanvas
            if (canvas) canvas.toBlob((b) => b && onSave(b), 'image/jpeg', 0.85)
            else if (img.imageBase64)
              fetch(img.imageBase64)
                .then((r) => r.blob())
                .then(onSave)
          }}
          onClose={onClose}
        />
        {view.zoomed && (
          <button
            type="button"
            onClick={() => native('.FIE_buttons-fit-btn')?.click()}
            className="absolute top-3 right-3 z-10 h-8 cursor-pointer rounded-full border-0 bg-black/60 px-3 text-[13px] text-white"
          >
            Ajustar à tela
          </button>
        )}
      </div>

      <nav className="border-line grid flex-none grid-cols-4 border-t md:mx-auto md:w-full md:max-w-md md:border-t-0">
        {TAB_LIST.map((t) => {
          const on = t.id === view.tab
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => openTab(t.id)}
              className={
                'flex h-12 cursor-pointer flex-col items-center justify-center gap-0 border-0 bg-transparent text-xs ' +
                (on ? 'text-terra font-medium' : 'text-muted')
              }
            >
              <Icon d={t.icon} size={21} />
              {t.label}
            </button>
          )
        })}
      </nav>

      {host &&
        view.tab === TABS.ANNOTATE &&
        createPortal(
          target ? (
            <div className="relative">
              <button
                type="button"
                data-tip="Cor"
                aria-label="Cor"
                onClick={() => setPaletteOpen((o) => !o)}
                className="flex size-10 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent"
              >
                <span
                  className="size-6 rounded-full border-2 border-white shadow-[0_0_0_1.5px_rgba(0,0,0,.25)]"
                  style={{ background: colors[target] }}
                />
              </button>
              {paletteOpen && (
                <div className="border-line absolute bottom-[calc(100%+6px)] left-0 z-20 flex gap-2 rounded-full border bg-white p-2 shadow-lg">
                  {COLORS.map(({ c, name }) => (
                    <button
                      key={c}
                      type="button"
                      aria-label={name}
                      onClick={() => pick(c)}
                      className={
                        'size-8 cursor-pointer rounded-full border-2 ' +
                        (colors[target].toUpperCase() === c
                          ? 'border-terra outline-terra outline-2 outline-offset-1'
                          : 'border-black/15')
                      }
                      style={{ background: c }}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="text-muted m-0 truncate px-4 text-center text-[13px]">
              Escolha uma ferramenta · {TOUCH ? 'dois dedos dão zoom' : 'role o mouse para dar zoom'}
            </p>
          ),
          host,
        )}
    </div>
  )
}
