import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { errorToast, savedToast } from '@/lib/feedback'
import { todayBR, todayISO } from '@/lib/dates'
import { deriveStatus } from '@/lib/status'
import { supabase } from '@/lib/supabase'
import { blankPartes, type Arquivo, type Atendimento, type PartKey, type Partes, type ProcKey } from '@/types'
import { keys as pKeys, useUid, type PacienteRow } from './pacientes'

export const aKeys = {
  atendimento: (uid: string | undefined, id: string) => ['atendimento', uid, id] as const,
  arquivos: (uid: string | undefined, id: string) => ['arquivos', uid, id] as const,
}

const SELECT = 'id,paciente_id,procedimento,dentes,status,iniciado_em,partes,created_at'

function normalize(a: Atendimento): Atendimento {
  const blank = blankPartes(todayBR())
  const p = (a.partes || {}) as Partial<Partes>
  return {
    ...a,
    partes: {
      exame: { ...blank.exame, ...p.exame, data: { ...blank.exame.data, ...p.exame?.data } },
      rxi: { ...blank.rxi, ...p.rxi },
      termo: { ...blank.termo, ...p.termo },
      trat: { ...blank.trat, ...p.trat, data: { ...blank.trat.data, ...p.trat?.data } },
      rxf: { ...blank.rxf, ...p.rxf },
    },
  }
}

export function useAtendimento(id: string | undefined) {
  const uid = useUid()
  return useQuery({
    queryKey: aKeys.atendimento(uid, id || ''),
    enabled: !!uid && !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from('atendimentos').select(SELECT).eq('id', id!).maybeSingle()
      if (error) throw error
      return data ? normalize(data as Atendimento) : null
    },
  })
}

export function useArquivos(atendimentoId: string | undefined) {
  const uid = useUid()
  return useQuery({
    queryKey: aKeys.arquivos(uid, atendimentoId || ''),
    enabled: !!uid && !!atendimentoId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('arquivos')
        .select('id,atendimento_id,tipo,caminho,data,nota,created_at')
        .eq('atendimento_id', atendimentoId!)
        .order('created_at', { ascending: true })
      if (error) throw error
      return (data || []) as Arquivo[]
    },
  })
}

/** Keeps the patient list and hub in sync with a changed care record (status, new or deleted). */
function syncPatientCaches(
  qc: ReturnType<typeof useQueryClient>,
  uid: string | undefined,
  pacienteId: string,
  fn: (ats: PacienteRow['atendimentos']) => PacienteRow['atendimentos'],
) {
  const upd = (p: PacienteRow) => (p.id === pacienteId ? { ...p, atendimentos: fn(p.atendimentos) } : p)
  qc.setQueryData<PacienteRow | null>(pKeys.paciente(uid, pacienteId), (p) => (p ? upd(p) : p))
  qc.setQueryData<PacienteRow[]>(pKeys.pacientes(uid), (list) => list?.map(upd))
}

export function useCreateAtendimento() {
  const uid = useUid()
  const qc = useQueryClient()
  const m = useMutation({
    mutationFn: async (a: Atendimento) => {
      const { error } = await supabase.from('atendimentos').insert({
        id: a.id,
        paciente_id: a.paciente_id,
        procedimento: a.procedimento,
        dentes: a.dentes,
        status: a.status,
        iniciado_em: a.iniciado_em,
        partes: a.partes,
      })
      if (error) throw error
    },
    onMutate: (a) => {
      qc.setQueryData(aKeys.atendimento(uid, a.id), a)
      syncPatientCaches(qc, uid, a.paciente_id, (ats) => [...ats.filter((x) => x.id !== a.id), a])
    },
    onError: (_e, a) => errorToast('Não foi possível criar o atendimento.', () => m.mutate(a)),
    onSettled: (_d, _e, a) => {
      qc.invalidateQueries({ queryKey: pKeys.pacientes(uid) })
      qc.invalidateQueries({ queryKey: pKeys.paciente(uid, a.paciente_id) })
    },
  })
  return m
}

export function newAtendimento(pacienteId: string, proc: ProcKey, dentes: string[]): Atendimento {
  return {
    id: crypto.randomUUID(),
    paciente_id: pacienteId,
    procedimento: proc,
    dentes: dentes.slice().sort((a, b) => +a - +b),
    status: 'Em exame',
    iniciado_em: todayISO(),
    partes: blankPartes(todayBR()),
    created_at: new Date().toISOString(),
  }
}

export interface PartUpdate {
  atendimento: Atendimento
  key: PartKey
  value: Partes[PartKey]
  toast?: string
}

/** Writes one part, recomputes the status, and returns at once (optimistic). */
export function useSavePart() {
  const uid = useUid()
  const qc = useQueryClient()
  const m = useMutation({
    mutationFn: async (u: PartUpdate) => {
      const partes = { ...u.atendimento.partes, [u.key]: u.value } as Partes
      const { error } = await supabase
        .from('atendimentos')
        .update({ partes, status: deriveStatus(partes) })
        .eq('id', u.atendimento.id)
      if (error) throw error
    },
    onMutate: (u) => {
      const partes = { ...u.atendimento.partes, [u.key]: u.value } as Partes
      const status = deriveStatus(partes)
      qc.setQueryData<Atendimento | null>(aKeys.atendimento(uid, u.atendimento.id), (a) =>
        a ? { ...a, partes, status } : a,
      )
      syncPatientCaches(qc, uid, u.atendimento.paciente_id, (ats) =>
        ats.map((x) => (x.id === u.atendimento.id ? { ...x, status } : x)),
      )
    },
    onSuccess: (_d, u) => savedToast(u.toast ?? 'Salvo'),
    onError: (_e, u) => errorToast('Não foi possível salvar.', () => m.mutate(u)),
    onSettled: (_d, _e, u) => {
      qc.invalidateQueries({ queryKey: aKeys.atendimento(uid, u.atendimento.id) })
      qc.invalidateQueries({ queryKey: pKeys.pacientes(uid) })
    },
  })
  return m
}

export function useDeleteAtendimento() {
  const uid = useUid()
  const qc = useQueryClient()
  const m = useMutation({
    mutationFn: async (a: Atendimento) => {
      const { data: files } = await supabase.from('arquivos').select('caminho').eq('atendimento_id', a.id)
      const paths = (files || []).map((f: { caminho: string }) => f.caminho)
      if (paths.length) await supabase.storage.from('arquivos').remove(paths)
      const { error } = await supabase.from('atendimentos').delete().eq('id', a.id)
      if (error) throw error
    },
    onMutate: (a) => syncPatientCaches(qc, uid, a.paciente_id, (ats) => ats.filter((x) => x.id !== a.id)),
    onSuccess: () => savedToast('Atendimento excluído'),
    onError: (_e, a) => errorToast('Não foi possível excluir o atendimento.', () => m.mutate(a)),
    onSettled: (_d, _e, a) => {
      qc.invalidateQueries({ queryKey: pKeys.pacientes(uid) })
      qc.invalidateQueries({ queryKey: pKeys.paciente(uid, a.paciente_id) })
    },
  })
  return m
}
