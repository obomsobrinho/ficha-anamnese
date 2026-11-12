import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { errorToast } from '@/lib/feedback'
import { resizeToJpeg } from '@/lib/image'
import { todayISO } from '@/lib/dates'
import { supabase } from '@/lib/supabase'
import type { Arquivo, ArquivoTipo } from '@/types'
import { aKeys } from './atendimentos'
import { useUid } from './pacientes'

const BUCKET = 'arquivos'
const TTL = 60 * 60

/** Signed URLs for private images, cached for most of their lifetime. */
export function useSignedUrls(paths: string[]) {
  const uid = useUid()
  const sorted = paths.filter(Boolean).slice().sort()
  return useQuery({
    queryKey: ['signed', uid, sorted],
    enabled: !!uid && sorted.length > 0,
    staleTime: (TTL - 300) * 1000,
    gcTime: (TTL - 300) * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.storage.from(BUCKET).createSignedUrls(sorted, TTL)
      if (error) throw error
      const map: Record<string, string> = {}
      data.forEach((d) => {
        if (d.path && d.signedUrl) map[d.path] = d.signedUrl
      })
      return map
    },
  })
}

/** Local previews for files still uploading (object URLs), keyed by arquivo id. */
export const localPreviews = new Map<string, string>()

export interface UploadInput {
  atendimentoId: string
  tipo: ArquivoTipo
  file: File | Blob
  /** Already a ready JPEG/PNG (signature); skip resizing. */
  raw?: boolean
  contentType?: string
  ext?: string
  id?: string
  nota?: string
}

export function useUploadArquivo() {
  const uid = useUid()
  const qc = useQueryClient()
  const m = useMutation({
    mutationFn: async (v: UploadInput & { id: string; caminho: string }) => {
      const blob = v.raw ? v.file : await resizeToJpeg(v.file as File)
      const up = await supabase.storage
        .from(BUCKET)
        .upload(v.caminho, blob, { contentType: v.contentType ?? 'image/jpeg', upsert: true })
      if (up.error) throw up.error
      const { error } = await supabase.from('arquivos').upsert({
        id: v.id,
        atendimento_id: v.atendimentoId,
        tipo: v.tipo,
        caminho: v.caminho,
        data: todayISO(),
        nota: v.nota ?? '',
      })
      if (error) throw error
    },
    onMutate: (v) => {
      localPreviews.set(v.id, URL.createObjectURL(v.file))
      const row: Arquivo & { pending?: boolean } = {
        id: v.id,
        atendimento_id: v.atendimentoId,
        tipo: v.tipo,
        caminho: v.caminho,
        data: todayISO(),
        nota: v.nota ?? '',
        created_at: new Date().toISOString(),
        pending: true,
      }
      qc.setQueryData<Arquivo[]>(aKeys.arquivos(uid, v.atendimentoId), (l) => [
        ...(l || []).filter((x) => x.id !== v.id),
        row,
      ])
    },
    onSuccess: (_d, v) => {
      qc.setQueryData<(Arquivo & { pending?: boolean })[]>(aKeys.arquivos(uid, v.atendimentoId), (l) =>
        l?.map((x) => (x.id === v.id ? { ...x, pending: false } : x)),
      )
    },
    onError: (_e, v) => {
      qc.setQueryData<(Arquivo & { failed?: boolean; pending?: boolean })[]>(aKeys.arquivos(uid, v.atendimentoId), (l) =>
        l?.map((x) => (x.id === v.id ? { ...x, pending: false, failed: true } : x)),
      )
      errorToast('Não foi possível enviar a imagem.', () => m.mutate(v))
    },
    onSettled: (_d, _e, v) => qc.invalidateQueries({ queryKey: aKeys.arquivos(uid, v.atendimentoId) }),
  })
  return {
    ...m,
    upload: (v: UploadInput) => {
      const id = v.id ?? crypto.randomUUID()
      const caminho = `${uid}/${v.atendimentoId}/${id}.${v.ext ?? 'jpg'}`
      m.mutate({ ...v, id, caminho })
      return id
    },
  }
}

export function useDeleteArquivo() {
  const uid = useUid()
  const qc = useQueryClient()
  const m = useMutation({
    mutationFn: async (a: Arquivo) => {
      await supabase.storage.from(BUCKET).remove([a.caminho])
      const { error } = await supabase.from('arquivos').delete().eq('id', a.id)
      if (error) throw error
    },
    onMutate: (a) =>
      qc.setQueryData<Arquivo[]>(aKeys.arquivos(uid, a.atendimento_id), (l) => l?.filter((x) => x.id !== a.id)),
    onError: (_e, a) => errorToast('Não foi possível remover a imagem.', () => m.mutate(a)),
    onSettled: (_d, _e, a) => qc.invalidateQueries({ queryKey: aKeys.arquivos(uid, a.atendimento_id) }),
  })
  return m
}

export function useSaveNotas() {
  const uid = useUid()
  const qc = useQueryClient()
  const m = useMutation({
    mutationFn: async (v: { atendimentoId: string; notas: { id: string; nota: string }[] }) => {
      for (const n of v.notas) {
        const { error } = await supabase.from('arquivos').update({ nota: n.nota }).eq('id', n.id)
        if (error) throw error
      }
    },
    onMutate: (v) =>
      qc.setQueryData<Arquivo[]>(aKeys.arquivos(uid, v.atendimentoId), (l) =>
        l?.map((x) => {
          const n = v.notas.find((y) => y.id === x.id)
          return n ? { ...x, nota: n.nota } : x
        }),
      ),
    onError: (_e, v) => errorToast('Não foi possível salvar as observações.', () => m.mutate(v)),
    onSettled: (_d, _e, v) => qc.invalidateQueries({ queryKey: aKeys.arquivos(uid, v.atendimentoId) }),
  })
  return m
}
