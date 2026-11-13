import FilerobotImageEditor, { TABS, TOOLS } from 'react-filerobot-image-editor'
// @ts-expect-error untyped internal module; the editor reads labels from this global table
import { updateTranslations } from 'react-filerobot-image-editor/lib/utils/translator'
// @ts-expect-error untyped internal module; the Filters tab renders this shared array
import { AVAILABLE_FILTERS } from 'react-filerobot-image-editor/lib/components/tools/Filters/Filters.constants'

const TERRA = '#A3604B'
const MARK = '#E5484D'

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
  opacity: 'Opacidade',
  transparency: 'Transparência',
  stroke: 'Contorno',
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
  return (
    <div className="pt-safe pb-safe fixed inset-0 z-50 bg-white">
      <FilerobotImageEditor
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
        Pen={{ stroke: MARK, strokeWidth: 10, selectAnnotationAfterDrawing: false }}
        Arrow={{ stroke: MARK, fill: MARK, strokeWidth: 10, pointerLength: 36, pointerWidth: 36 }}
        Ellipse={{ fill: 'transparent', stroke: MARK, strokeWidth: 10 }}
        Rect={{ fill: 'transparent', stroke: MARK, strokeWidth: 10 }}
        Text={{
          fill: '#FFD43B',
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
