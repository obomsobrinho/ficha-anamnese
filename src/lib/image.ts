/** Resizes a photo to at most `max` px on the long side and re-encodes it as JPEG (spec: 1600 px, ~0.8). */
export async function resizeToJpeg(file: File, max = 1600, quality = 0.8): Promise<Blob> {
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image()
      i.onload = () => resolve(i)
      i.onerror = () => reject(new Error('image decode failed'))
      i.src = url
    })
    // Browsers apply the EXIF orientation when decoding, so naturalWidth/Height are already upright.
    const w = img.naturalWidth
    const h = img.naturalHeight
    const scale = Math.min(1, max / Math.max(w, h))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(w * scale)
    canvas.height = Math.round(h * scale)
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('no canvas')
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('encode failed'))), 'image/jpeg', quality),
    )
  } finally {
    URL.revokeObjectURL(url)
  }
}

/** Edited x-rays live next to the original as `{id}-ed-{ts}.jpg`; the original `{id}.jpg` is never touched. */
export const originalPath = (caminho: string) => caminho.replace(/-ed-\d+\.jpg$/, '.jpg')
export const isEdited = (caminho: string) => originalPath(caminho) !== caminho
