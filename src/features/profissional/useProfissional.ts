import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/features/auth/AuthProvider'
import { supabase } from '@/lib/supabase'
import type { Profissional } from '@/types'

export function useProfissional() {
  const { session } = useAuth()
  const uid = session?.user.id
  return useQuery({
    queryKey: ['profissional', uid],
    enabled: !!uid,
    queryFn: async (): Promise<Profissional | null> => {
      const { data, error } = await supabase
        .from('profissionais')
        .select('user_id,nome,profissao,cro,telefone')
        .maybeSingle()
      if (error) throw error
      return data
    },
    staleTime: 1000 * 60 * 10,
  })
}

/** "Cirurgiã Dentista | CRO-MG 72033", the prototype's subtitle line. */
export function profLine(p: Profissional | null | undefined) {
  return [p?.profissao, p?.cro].filter(Boolean).join(' | ')
}
