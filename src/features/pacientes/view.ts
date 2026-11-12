import type { PacienteRow } from '@/data/pacientes'
import { calcAge, isoToBR, tsToBR } from '@/lib/dates'

export interface Alert {
  label: string
  bg: string
  fg: string
  fw: number
}

/** The prototype's pView. */
export function patientView(p: PacienteRow | null | undefined) {
  const name = p?.nome || ''
  const birth = isoToBR(p?.nascimento)
  const age = calcAge(birth)
  const healthDate = tsToBR(p?.saude_atualizada_em)
  const d = p?.dados
  return {
    ini:
      name
        .split(' ')
        .filter((w, i, arr) => w && (i === 0 || i === arr.length - 1))
        .map((w) => w[0])
        .join('')
        .toUpperCase() || '+',
    displayName: name || 'Novo paciente',
    first: name.split(' ')[0] || '',
    age,
    birth,
    ageLabel: age != null ? age + ' anos' : 'Idade —',
    phoneLabel: p?.telefone || 'sem telefone',
    healthDate,
    healthLabel: healthDate ? 'Atualizado em ' + healthDate : 'Ainda não preenchido',
    line1: [d?.sexo, age != null ? `${age} anos (${birth})` : '', d?.civil, d?.prof].filter(Boolean).join(' · '),
    line2: [p?.telefone, d?.email].filter(Boolean).join(' · '),
  }
}

export function healthAlerts(p: PacienteRow | null | undefined): Alert[] {
  if (!p) return []
  const d = p.dados
  const alerts: Alert[] = []
  if (d.yn.ale === 'Sim') alerts.push({ label: '⚠ Alergia: ' + (d.ynTxt.ale || 'sim'), bg: '#F6DDD5', fg: '#8A3A28', fw: 600 })
  if (d.yn.med === 'Sim') alerts.push({ label: 'Medicamento: ' + (d.ynTxt.med || 'sim'), bg: '#F4ECE6', fg: '#3A2F2A', fw: 400 })
  d.doencas.forEach((x) =>
    alerts.push({ label: x === 'Outros' && d.outros ? d.outros : x, bg: '#F4ECE6', fg: '#3A2F2A', fw: 400 }),
  )
  if (!alerts.length)
    alerts.push({
      label: p.saude_atualizada_em ? 'Sem alertas de saúde' : 'Preencha o histórico de saúde',
      bg: '#F4ECE6',
      fg: '#6E625C',
      fw: 400,
    })
  return alerts
}
