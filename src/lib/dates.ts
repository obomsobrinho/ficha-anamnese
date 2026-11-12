const pad = (n: number) => String(n).padStart(2, '0')

export function todayBR(d = new Date()) {
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`
}

/** 'dd/mm/aaaa · hh:mm', the prototype's timestamp format. */
export function nowBR(d = new Date()) {
  return `${todayBR(d)} · ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function todayISO(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function isoToBR(iso: string | null | undefined) {
  if (!iso) return ''
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso)
  if (!m) return ''
  return `${m[3]}/${m[2]}/${m[1]}`
}

/** Timestamp (timestamptz) to 'dd/mm/aaaa' in local time. */
export function tsToBR(ts: string | null | undefined) {
  if (!ts) return ''
  const d = new Date(ts)
  return Number.isNaN(d.getTime()) ? '' : todayBR(d)
}

export function tsToBRTime(ts: string | null | undefined) {
  if (!ts) return ''
  const d = new Date(ts)
  return Number.isNaN(d.getTime()) ? '' : nowBR(d)
}

/** 'dd/mm/aaaa' to 'yyyy-mm-dd', or null when incomplete or invalid. */
export function brToISO(br: string | null | undefined) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(br || '')
  if (!m) return null
  const d = new Date(+m[3], +m[2] - 1, +m[1])
  if (d.getFullYear() !== +m[3] || d.getMonth() !== +m[2] - 1 || d.getDate() !== +m[1]) return null
  return `${m[3]}-${m[2]}-${m[1]}`
}

export function calcAge(br: string | null | undefined, now = new Date()) {
  const iso = brToISO(br)
  if (!iso) return null
  const [y, mo, da] = iso.split('-').map(Number)
  let a = now.getFullYear() - y
  if (now < new Date(now.getFullYear(), mo - 1, da)) a--
  return a >= 0 && a < 130 ? a : null
}

/** Brazilian phone: (00) 0000-0000 or (00) 00000-0000. */
export function maskPhone(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (!d) return ''
  if (d.length <= 2) return `(${d}`
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

/** Millimetres and percentages: digits and one comma. */
export function maskDecimal(v: string) {
  const s = v.replace(/\./g, ',').replace(/[^\d,]/g, '')
  const i = s.indexOf(',')
  return i < 0 ? s : s.slice(0, i + 1) + s.slice(i + 1).replace(/,/g, '').slice(0, 2)
}

export const isEmail = (v: string) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())

/** Types digits as dd/mm/aaaa. */
export function maskDate(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 8)
  if (d.length <= 2) return d
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`
}
