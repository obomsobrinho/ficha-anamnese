import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useParams } from 'react-router'
import { Screen, TopBar, useBack } from '@/components/layout'
import { FooterBar, Skeleton } from '@/components/ui'
import { useSignedUrls } from '@/data/arquivos'
import { aKeys, useArquivos, useSavePart } from '@/data/atendimentos'
import { useUid } from '@/data/pacientes'
import { nowBR, todayBR } from '@/lib/dates'
import { errorToast } from '@/lib/feedback'
import { supabase } from '@/lib/supabase'
import { toothName } from '@/lib/teeth'
import { ARQUIVO_TIPO, PROCEDIMENTOS, type Arquivo, type Atendimento } from '@/types'
import { useAtendimentoView } from './AtendimentoScreen'
import { SignatureOverlay } from './SignatureOverlay'

/** The prototype's termRows. */
export function termRows(a: Atendimento) {
  const ex = a.partes.exame.data
  return [
    {
      k: 'Procedimento',
      v: PROCEDIMENTOS[a.procedimento].name + ' · dente ' + a.dentes.map((n) => `${n} (${toothName(+n)})`).join(', '),
    },
    {
      k: 'Exame clínico',
      v:
        [
          ex.hda.join(', '),
          ex.insp.join(', '),
          [ex.tests.perc && 'Percussão ' + ex.tests.perc.toLowerCase(), ex.tests.frio && 'frio ' + ex.tests.frio.toLowerCase()]
            .filter(Boolean)
            .join('; '),
        ]
          .filter(Boolean)
          .join('. ') || '—',
    },
    { k: 'Diagnóstico', v: [ex.dp, ex.dpa].filter(Boolean).join(' · ') || '—' },
    { k: 'Plano de tratamento', v: ex.plano || '—' },
  ]
}

/** Prototype text, kept as is (owner's decision of 12/11/2026). */
export const declaration = (name: string) =>
  'Eu, ' +
  name +
  ', declaro que todas as informações fornecidas nesta ficha são verdadeiras e completas, e autorizo a utilização destes dados para fins de planejamento e execução de tratamentos estéticos na clínica.'

export function useSignature(aid: string) {
  const { data: files } = useArquivos(aid)
  const sig = (files || []).filter((f) => f.tipo === ARQUIVO_TIPO.assinatura).at(-1)
  const { data: urls } = useSignedUrls(sig ? [sig.caminho] : [])
  return sig ? urls?.[sig.caminho] : undefined
}

export function TermoScreen() {
  const { aid = '' } = useParams()
  const back = useBack(`/atendimentos/${aid}`)
  const { a, p, P, A, loading } = useAtendimentoView(aid)
  const { data: files } = useArquivos(aid)
  const sigUrl = useSignature(aid)
  const savePart = useSavePart()
  const qc = useQueryClient()
  const uid = useUid()
  const [signing, setSigning] = useState(false)
  const [saving, setSaving] = useState(false)

  const tm = a?.partes.termo
  const signed = tm?.status === 'Assinado'
  const name = p?.nome || 'paciente'
  const rows = a ? termRows(a) : []

  const details = (
    <div className="flex flex-col gap-3.5">
      <div className="text-[11px] tracking-[.22em] text-terra-mid uppercase">O que o paciente assina</div>
      {rows.map((r) => (
        <div key={r.k} className="flex flex-col gap-0.5 text-sm leading-[1.4]">
          <span className="text-xs text-muted">{r.k}</span>
          <span className="text-pretty">{r.v}</span>
        </div>
      ))}
      <div className="h-px bg-line" />
      <div className="font-serif text-[19px] leading-[1.45] text-pretty">{declaration(name)}</div>
    </div>
  )

  const onSign = async (png: Blob) => {
    if (!a || !uid) return
    setSaving(true)
    try {
      const id = crypto.randomUUID()
      const caminho = `${uid}/${a.id}/${id}.png`
      const up = await supabase.storage.from('arquivos').upload(caminho, png, { contentType: 'image/png' })
      if (up.error) throw up.error
      const { error } = await supabase
        .from('arquivos')
        .insert({ id, atendimento_id: a.id, tipo: ARQUIVO_TIPO.assinatura, caminho, data: new Date().toISOString().slice(0, 10), nota: '' })
      if (error) throw error
      // "Assinar de novo" replaces the previous signature.
      const old = (files || []).filter((f: Arquivo) => f.tipo === ARQUIVO_TIPO.assinatura)
      if (old.length) {
        await supabase.storage.from('arquivos').remove(old.map((f) => f.caminho))
        await supabase.from('arquivos').delete().in('id', old.map((f) => f.id))
      }
      await qc.invalidateQueries({ queryKey: aKeys.arquivos(uid, a.id) })
      savePart.mutate({
        atendimento: a,
        key: 'termo',
        value: { status: 'Assinado', signer: name, signedAt: nowBR() },
        toast: 'Termo assinado',
      })
      setSigning(false)
    } catch {
      errorToast('Não foi possível salvar a assinatura. Tente de novo.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Screen>
      <TopBar onBack={back} badge={A.teethLabel || ' '} title="Termo e assinatura" subtitle={`${P.displayName} · ${A.proc}`} />
      <div className="flex flex-1 flex-col gap-5 px-5 pt-[18px] pb-[30px]">
        {loading || !a ? (
          <Skeleton className="h-64 rounded-[18px]" />
        ) : (
          <>
            {signed && (
              <div className="flex flex-col gap-3 rounded-[18px] border border-line bg-white p-4">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-[22px] flex-none items-center justify-center rounded-full bg-terra text-[13px] text-white">
                    ✓
                  </span>
                  <span className="text-base font-medium">Assinado</span>
                </div>
                <div className="flex h-[110px] items-center justify-center overflow-hidden rounded-xl border border-row bg-cream">
                  {sigUrl ? (
                    <img src={sigUrl} alt="Assinatura" className="max-h-full max-w-full" />
                  ) : (
                    <span className="font-serif text-4xl text-dark italic">{tm?.signer}</span>
                  )}
                </div>
                <div className="flex justify-between gap-2.5 text-sm">
                  <span className="font-medium">{tm?.signer}</span>
                  <span className="text-muted2">{tm?.signedAt}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSigning(true)}
                  className="h-11 cursor-pointer self-start rounded-xl border border-dash bg-white px-4 text-[15px] text-terra-dark"
                >
                  Assinar de novo
                </button>
              </div>
            )}
            <div className="flex flex-col gap-3.5 rounded-[18px] bg-panel p-[18px]">{details}</div>
          </>
        )}
      </div>
      {!signed && (
        <FooterBar className="flex gap-2.5">
          <button
            type="button"
            disabled
            className="relative flex h-14 flex-1 flex-col items-center justify-center rounded-2xl border border-field bg-white text-[15px] text-muted"
          >
            Enviar para assinar
            <span className="text-[11px] text-muted">Em breve</span>
          </button>
          <button
            type="button"
            onClick={() => setSigning(true)}
            disabled={!a}
            className="h-14 flex-1 cursor-pointer rounded-2xl border-0 bg-terra text-[17px] font-medium text-white"
          >
            Assinar agora
          </button>
        </FooterBar>
      )}
      {signing && a && (
        <SignatureOverlay
          signer={name}
          date={todayBR()}
          details={details}
          saving={saving}
          onClose={() => setSigning(false)}
          onSign={onSign}
        />
      )}
    </Screen>
  )
}
