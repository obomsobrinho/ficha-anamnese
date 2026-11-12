import type { Partes, Status } from '@/types'

/** Same rule as the prototype's toothStatus. */
export function deriveStatus(p: Partes): Status {
  if (p.trat.state === 'Feito' && p.rxf.state === 'Feito') return 'Concluído'
  if (p.termo.status === 'Assinado') return 'Em tratamento'
  return 'Em exame'
}
