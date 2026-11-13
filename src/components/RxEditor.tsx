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

/** Subset of the editor's internal state that the color bar reads and writes. */
interface EditorState {
  tabId?: string
  toolId?: string
  selectionsIds?: string[]
  annotations?: Record<string, { name: string }>
}
type UpdateState = (part: object | ((s: EditorState) => object | null)) => void

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

/** Full-screen x-ray editor (crop, rotate, brightness/contrast, invert, pen, arrow, text). Lazy loaded. */
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
  const [tool, setTool] = useState<DrawTool | null>('Pen')
  const [selected, setSelected] = useState<DrawTool | null>(null)
  const [host, setHost] = useState<HTMLElement | null>(null)
  useInstantTips(rootRef)

  // Follow the editor's tab/tool/selection and keep our color bar mounted above its tool options.
  useEffect(() => {
    // The updater runs inside the editor's render, so it only records; React state is set on the next tick.
    const seen: { tool: DrawTool | null; selected: DrawTool | null } = { tool: 'Pen', selected: null }
    const id = setInterval(() => {
      setTool(seen.tool)
      setSelected(seen.selected)
      updateRef.current?.((s) => {
        const sel = s.selectionsIds?.length === 1 ? s.annotations?.[s.selectionsIds[0]]?.name : null
        const onAnnotate = (s.tabId ?? TABS.ANNOTATE) === TABS.ANNOTATE
        seen.tool = onAnnotate ? (isDrawTool(s.toolId) ? s.toolId : 'Pen') : null
        seen.selected = onAnnotate && isDrawTool(sel) ? sel : null
        return null
      })
      const wrap = rootRef.current?.querySelector<HTMLElement>('.FIE_tools-bar-wrapper')
      if (!wrap) return setHost(null)
      let h = wrap.querySelector<HTMLElement>(':scope > .rx-colors')
      if (!h) {
        h = document.createElement('div')
        h.className = 'rx-colors'
        wrap.prepend(h)
      }
      setHost((cur) => (cur === h ? cur : h))
    }, 200)
    return () => clearInterval(id)
  }, [])

  const target = selected ?? tool
  const pick = (c: string) => {
    if (!target) return
    setColors((cs) => ({ ...cs, [target]: c }))
    const update = updateRef.current
    if (!update) return
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

  return (
    <div ref={rootRef} className="rx-editor pt-safe pb-safe fixed inset-0 z-50 bg-white">
      {host &&
        target &&
        createPortal(
          <div className="flex items-center justify-center gap-2 pt-2">
            <span className="text-muted2 text-xs">Cor</span>
            {COLORS.map(({ c, name }) => (
              <button
                key={c}
                type="button"
                data-tip={name}
                aria-label={name}
                onClick={() => pick(c)}
                className={
                  'size-7 cursor-pointer rounded-full border-2 ' +
                  (colors[target].toUpperCase() === c
                    ? 'border-terra outline-terra outline-2 outline-offset-1'
                    : 'border-black/15')
                }
                style={{ background: c }}
              />
            ))}
          </div>,
          host,
        )}
      <FilerobotImageEditor
        updateStateFnRef={updateRef}
        source={src}
        language="en"
        useBackendTranslations={false}
        translations={PT}
        tabsIds={[TABS.ANNOTATE, TABS.FINETUNE, TABS.FILTERS, TABS.ADJUST]}
        // @ts-expect-error tabsToolsIds is read by the editor but missing from its types
        tabsToolsIds={{
          [TABS.ANNOTATE]: [TOOLS.PEN, TOOLS.ARROW, TOOLS.ELLIPSE, TOOLS.RECT, TOOLS.LINE, TOOLS.TEXT],
          [TABS.FINETUNE]: [TOOLS.BRIGHTNESS, TOOLS.CONTRAST],
          [TABS.FILTERS]: [TOOLS.FILTERS],
          [TABS.ADJUST]: [TOOLS.CROP, TOOLS.ROTATE, TOOLS.FLIP_X, TOOLS.FLIP_Y],
        }}
        defaultTabId={TABS.ANNOTATE}
        defaultToolId={TOOLS.PEN}
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
    </div>
  )
}
