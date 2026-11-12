import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Navigate, useLocation } from 'react-router'
import { z } from 'zod'
import { Field, PrimaryButton, Segmented, TextInput } from '@/components/ui'
import { maskPhone } from '@/lib/dates'
import { supabase, supabaseConfigured } from '@/lib/supabase'
import { useAuth } from './AuthProvider'

const MODES = ['Entrar', 'Criar conta'] as const
type Mode = (typeof MODES)[number]

const schema = z.object({
  email: z.string().trim().email('Digite um e-mail válido.'),
  senha: z.string().min(6, 'A senha precisa de pelo menos 6 caracteres.'),
  nome: z.string().trim(),
  profissao: z.string().trim(),
  cro: z.string().trim(),
  telefone: z.string().trim(),
})
type SignupValues = z.infer<typeof schema>

function translate(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('invalid login credentials')) return 'E-mail ou senha incorretos.'
  if (m.includes('already registered') || m.includes('already been registered')) return 'Este e-mail já tem conta. Use "Entrar".'
  if (m.includes('password')) return 'A senha precisa de pelo menos 6 caracteres.'
  if (m.includes('fetch') || m.includes('network')) return 'Sem conexão. Tente de novo.'
  return 'Não foi possível continuar. Tente de novo.'
}

export function AuthScreen() {
  const { signedIn } = useAuth()
  const from = (useLocation().state as { from?: string } | null)?.from
  const [mode, setMode] = useState<Mode>('Entrar')
  const [serverError, setServerError] = useState('')
  const isSignup = mode === 'Criar conta'

  const form = useForm<SignupValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', senha: '', nome: '', profissao: '', cro: '', telefone: '' },
  })
  const { register, handleSubmit, formState } = form
  const err = formState.errors

  if (signedIn) return <Navigate to={from && from !== '/entrar' ? from : '/'} replace />

  const onSubmit = handleSubmit(async (v) => {
    setServerError('')
    if (isSignup && v.nome.length < 3) {
      form.setError('nome', { message: 'Digite seu nome como aparece na ficha.' })
      return
    }
    if (!supabaseConfigured) {
      setServerError('Banco ainda não configurado nesta versão.')
      return
    }
    const { error } = isSignup
      ? await supabase.auth.signUp({
          email: v.email,
          password: v.senha,
          options: { data: { nome: v.nome, profissao: v.profissao, cro: v.cro, telefone: v.telefone } },
        })
      : await supabase.auth.signInWithPassword({ email: v.email, password: v.senha })
    if (error) setServerError(translate(error.message))
  })

  const firstError = err.nome?.message || err.email?.message || err.senha?.message || serverError

  return (
    <div className="pt-safe flex min-h-dvh flex-col">
      <form onSubmit={onSubmit} noValidate className="flex flex-1 flex-col gap-3.5 px-5 pt-10 pb-10">
        <span className="flex h-[26px] items-center self-start rounded-[13px] bg-sand px-2.5 text-xs text-muted2">
          Versão de teste
        </span>
        <div className="pt-2 pb-1.5 font-serif text-[34px] leading-[1.1] font-medium">{mode}</div>
        <Segmented
          options={MODES}
          value={mode}
          onChange={(m) => {
            if (!m) return
            setMode(m)
            setServerError('')
            form.clearErrors()
          }}
        />

        {isSignup && (
          <>
            <Field label="Nome (como aparece na ficha)">
              <TextInput {...register('nome')} placeholder="Ex.: Dra. Maria Jullia S. Moreira" autoComplete="name" />
            </Field>
            <Field label="Profissão">
              <TextInput {...register('profissao')} placeholder="Ex.: Cirurgiã Dentista" />
            </Field>
            <Field label="CRO">
              <TextInput {...register('cro')} placeholder="Ex.: CRO-MG 72033" />
            </Field>
            <Field label="Telefone">
              <TextInput
                {...register('telefone', { onChange: (e) => form.setValue('telefone', maskPhone(e.target.value)) })}
                inputMode="tel"
                autoComplete="tel"
                placeholder="(00) 00000-0000"
              />
            </Field>
          </>
        )}

        <Field label="E-mail">
          <TextInput {...register('email')} type="email" inputMode="email" autoComplete="email" autoCapitalize="none" />
        </Field>
        <Field label="Senha">
          <TextInput
            {...register('senha')}
            type="password"
            autoComplete={isSignup ? 'new-password' : 'current-password'}
          />
        </Field>

        {firstError && (
          <div role="alert" className="rounded-[14px] bg-alert-bg px-3.5 py-3 text-sm text-alert-fg">
            {firstError}
          </div>
        )}

        <PrimaryButton type="submit" disabled={formState.isSubmitting} className="mt-2">
          {formState.isSubmitting ? 'Aguarde…' : mode}
        </PrimaryButton>
      </form>
    </div>
  )
}
