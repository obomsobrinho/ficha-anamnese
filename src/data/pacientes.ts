import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/features/auth/AuthProvider'
import { errorToast, savedToast } from '@/lib/feedback'
import { supabase } from '@/lib/supabase'
import { blankDados, type Atendimento, type Paciente, type PacienteDados } from '@/types'

export type AtendimentoLite = Pick<Atendimento, 'id' | 'paciente_id' | 'procedimento' | 'dentes' | 'status' | 'iniciado_em' | 'created_at'>
export type PacienteRow = Paciente & { atendimentos: AtendimentoLite[] }

const SELECT =
  'id,nome,nascimento,telefone,dados,saude_atualizada_em,created_at,atendimentos(id,paciente_id,procedimento,dentes,status,iniciado_em,created_at)'

function normalize(p: PacienteRow): PacienteRow {
  return {
    ...p,
    dados: { ...blankDados(), ...(p.dados || {}) } as PacienteDados,
    atendimentos: (p.atendimentos || []).slice().sort((a, b) => a.created_at.localeCompare(b.created_at)),
  }
}

export function useUid() {
  return useAuth().session?.user.id
}

export const keys = {
  pacientes: (uid?: string) => ['pacientes', uid] as const,
  paciente: (uid: string | undefined, id: string) => ['paciente', uid, id] as const,
}

export function usePacientes() {
  const uid = useUid()
  return useQuery({
    queryKey: keys.pacientes(uid),
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase.from('pacientes').select(SELECT).order('created_at', { ascending: false })
      if (error) throw error
      return (data as unknown as PacienteRow[]).map(normalize)
    },
  })
}

export function usePaciente(id: string | undefined) {
  const uid = useUid()
  const qc = useQueryClient()
  return useQuery({
    queryKey: keys.paciente(uid, id || ''),
    enabled: !!uid && !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from('pacientes').select(SELECT).eq('id', id!).maybeSingle()
      if (error) throw error
      return data ? normalize(data as unknown as PacienteRow) : null
    },
    // Render instantly from the list we already have, then refresh.
    placeholderData: () => qc.getQueryData<PacienteRow[]>(keys.pacientes(uid))?.find((p) => p.id === id),
  })
}

export interface SaudeInput {
  id: string
  isNew: boolean
  nome: string
  nascimento: string | null
  telefone: string | null
  dados: PacienteDados
}

export function useSaveSaude() {
  const uid = useUid()
  const qc = useQueryClient()
  const m = useMutation({
    mutationFn: async (v: SaudeInput) => {
      const row = {
        id: v.id,
        nome: v.nome,
        nascimento: v.nascimento,
        telefone: v.telefone,
        dados: v.dados,
        saude_atualizada_em: new Date().toISOString(),
      }
      const { error } = await supabase.from('pacientes').upsert(row)
      if (error) throw error
    },
    onMutate: async (v) => {
      await qc.cancelQueries({ queryKey: keys.pacientes(uid) })
      const base: PacienteRow = qc.getQueryData<PacienteRow | null>(keys.paciente(uid, v.id)) ||
        qc.getQueryData<PacienteRow[]>(keys.pacientes(uid))?.find((p) => p.id === v.id) || {
          id: v.id,
          created_at: new Date().toISOString(),
          atendimentos: [],
          nome: '',
          nascimento: null,
          telefone: null,
          dados: blankDados(),
          saude_atualizada_em: null,
        }
      const next: PacienteRow = {
        ...base,
        nome: v.nome,
        nascimento: v.nascimento,
        telefone: v.telefone,
        dados: v.dados,
        saude_atualizada_em: new Date().toISOString(),
      }
      qc.setQueryData(keys.paciente(uid, v.id), next)
      qc.setQueryData<PacienteRow[]>(keys.pacientes(uid), (list) => {
        if (!list) return [next]
        return list.some((p) => p.id === v.id) ? list.map((p) => (p.id === v.id ? next : p)) : [next, ...list]
      })
    },
    onSuccess: () => savedToast('Cadastro e saúde salvos'),
    onError: (_e, v) => errorToast('Não foi possível salvar o cadastro.', () => m.mutate(v)),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: keys.pacientes(uid) })
      qc.invalidateQueries({ queryKey: ['paciente', uid] })
    },
  })
  return m
}

export function useDeletePaciente() {
  const uid = useUid()
  const qc = useQueryClient()
  const m = useMutation({
    mutationFn: async (id: string) => {
      const { data: files } = await supabase
        .from('arquivos')
        .select('caminho,atendimentos!inner(paciente_id)')
        .eq('atendimentos.paciente_id', id)
      const paths = (files || []).map((f: { caminho: string }) => f.caminho)
      if (paths.length) await supabase.storage.from('arquivos').remove(paths)
      const { error } = await supabase.from('pacientes').delete().eq('id', id)
      if (error) throw error
    },
    onMutate: (id) => {
      qc.setQueryData<PacienteRow[]>(keys.pacientes(uid), (list) => list?.filter((p) => p.id !== id))
    },
    onSuccess: () => savedToast('Paciente excluído'),
    onError: (_e, id) => errorToast('Não foi possível excluir o paciente.', () => m.mutate(id)),
    onSettled: () => qc.invalidateQueries({ queryKey: keys.pacientes(uid) }),
  })
  return m
}
