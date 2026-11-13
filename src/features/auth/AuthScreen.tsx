import { zodResolver } from '@hookform/resolvers/zod'
import { forwardRef, useState, type InputHTMLAttributes, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { Navigate, useLocation } from 'react-router'
import { z } from 'zod'
import { DentraLogo, TOOTH_D_PATH } from '@/components/Brand'
import { PrimaryButton } from '@/components/ui'
import { maskPhone } from '@/lib/dates'
import { supabase, supabaseConfigured } from '@/lib/supabase'
import { useAuth } from './AuthProvider'

type Mode = 'entrar' | 'criar'

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

// ---------- small line icons (stroke follows currentColor) ----------
const I = ({ d }: { d: string }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={d} />
  </svg>
)
const ICON = {
  mail: 'M4 6h16v12H4zM4 7l8 6 8-6',
  lock: 'M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM5 20a7 7 0 0 1 14 0',
  case: 'M4 8h16v11H4zM9 8V6h6v2M4 13h16',
  badge: 'M5 4h14v16H5zM9 9h6M9 13h6M9 17h3',
  phone: 'M8 3h8v18H8zM11 18h2',
  eye: 'M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  eyeOff: 'M3 3l18 18M10.6 6.1A9.6 9.6 0 0 1 12 6c6.5 0 10 6 10 6a17 17 0 0 1-3.2 3.8M6.6 6.7C3.7 8.4 2 12 2 12s3.5 6.5 10 6.5a9.4 9.4 0 0 0 4.5-1.1M9.9 9.9a3 3 0 0 0 4.2 4.2',
}

const IconInput = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & { icon: string; trailing?: ReactNode }
>(function IconInput({ icon, trailing, className, ...p }, ref) {
  return (
    <label className="flex h-[52px] items-center gap-2.5 rounded-[14px] border border-field bg-white px-3.5 text-terra-dark focus-within:outline-2 focus-within:-outline-offset-1 focus-within:outline-terra-mid">
      <I d={icon} />
      <span className="h-5 w-px flex-none bg-line" />
      <input ref={ref} {...p} className={'h-full min-w-0 flex-1 border-0 bg-transparent text-base text-ink outline-none focus:outline-none ' + (className ?? '')} />
      {trailing}
    </label>
  )
})

/** Scattered tooth silhouettes for the hero corners, in the app's sand tones. */
function Teeth({ className, flip }: { className: string; flip?: boolean }) {
  const t = [
    { x: 0, y: 6, s: 1.5, r: -18, c: '#EADBD2' },
    { x: 46, y: 0, s: 0.9, r: 14, c: '#F1DDBB' },
    { x: 30, y: 46, s: 1.1, r: 28, c: '#E9CFC3' },
    { x: 78, y: 34, s: 0.7, r: -10, c: '#EADBD2' },
  ]
  return (
    <svg className={className} width="130" height="110" viewBox="0 0 130 110" aria-hidden style={flip ? { transform: 'scale(-1,-1)' } : undefined}>
      {t.map((q, i) => (
        <path key={i} d={TOOTH_D_PATH} fill={q.c} transform={`translate(${q.x} ${q.y}) rotate(${q.r} 14 16) scale(${q.s})`} />
      ))}
    </svg>
  )
}

export function AuthScreen() {
  const { signedIn } = useAuth()
  const from = (useLocation().state as { from?: string } | null)?.from
  const [mode, setMode] = useState<Mode>('entrar')
  const [showPass, setShowPass] = useState(false)
  const [serverError, setServerError] = useState('')
  const isSignup = mode === 'criar'

  const form = useForm<SignupValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', senha: '', nome: '', profissao: '', cro: '', telefone: '' },
  })
  const { register, handleSubmit, formState } = form
  const err = formState.errors

  if (signedIn) return <Navigate to={from && from !== '/entrar' ? from : '/'} replace />

  const switchMode = (m: Mode) => {
    setMode(m)
    setServerError('')
    form.clearErrors()
  }

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
    <div className="flex min-h-dvh flex-col bg-sand">
      <div
        className={
          'pt-safe relative flex flex-none flex-col items-center justify-center overflow-hidden transition-[height] duration-300 ' +
          (isSignup ? 'h-[200px]' : 'h-[38dvh] min-h-[240px]')
        }
      >
        <Teeth className="absolute -top-2 -left-3" />
        <Teeth className="absolute -right-3 -bottom-1" flip />
        <span className="absolute top-[max(14px,env(safe-area-inset-top))] right-4 flex h-[26px] items-center rounded-[13px] bg-cream/80 px-2.5 text-xs text-muted2">
          Versão de teste
        </span>
        <DentraLogo size={isSignup ? 38 : 46} />
      </div>

      <form
        onSubmit={onSubmit}
        noValidate
        className="pb-safe relative -mt-7 flex flex-1 flex-col gap-3 rounded-t-[28px] bg-cream px-6 pt-7 shadow-[0_-8px_30px_rgba(60,40,30,.08)]"
      >
        <div className="pb-2 text-center text-[22px] font-medium">
          {isSignup ? 'Criar sua conta' : 'Entrar na sua conta'}
        </div>

        {isSignup && (
          <>
            <IconInput icon={ICON.user} {...register('nome')} placeholder="Nome como aparece na ficha" autoComplete="name" />
            <IconInput icon={ICON.case} {...register('profissao')} placeholder="Profissão (ex.: Cirurgiã Dentista)" />
            <IconInput icon={ICON.badge} {...register('cro')} placeholder="CRO (ex.: CRO-MG 72033)" autoCapitalize="characters" />
            <IconInput
              icon={ICON.phone}
              {...register('telefone', { onChange: (e) => form.setValue('telefone', maskPhone(e.target.value)) })}
              inputMode="tel"
              autoComplete="tel"
              placeholder="Telefone (00) 00000-0000"
            />
          </>
        )}

        <IconInput
          icon={ICON.mail}
          {...register('email')}
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          placeholder="Seu e-mail"
        />
        <IconInput
          icon={ICON.lock}
          {...register('senha')}
          type={showPass ? 'text' : 'password'}
          autoComplete={isSignup ? 'new-password' : 'current-password'}
          placeholder={isSignup ? 'Crie uma senha (mín. 6)' : 'Sua senha'}
          trailing={
            <button
              type="button"
              onClick={() => setShowPass((s) => !s)}
              aria-label={showPass ? 'Esconder senha' : 'Mostrar senha'}
              className="-mr-1.5 flex size-10 flex-none cursor-pointer items-center justify-center border-0 bg-transparent text-terra-dark"
            >
              <I d={showPass ? ICON.eyeOff : ICON.eye} />
            </button>
          }
        />

        {firstError && (
          <div role="alert" className="rounded-[14px] bg-alert-bg px-3.5 py-3 text-sm text-alert-fg">
            {firstError}
          </div>
        )}

        <PrimaryButton type="submit" disabled={formState.isSubmitting} className="mt-2">
          {formState.isSubmitting ? 'Aguarde…' : isSignup ? 'Criar conta' : 'Entrar'}
        </PrimaryButton>

        <div className="mt-auto border-t border-divider pt-4 pb-2 text-center text-sm text-muted2">
          {isSignup ? 'Já tem conta? ' : 'Não tem conta? '}
          <button
            type="button"
            onClick={() => switchMode(isSignup ? 'entrar' : 'criar')}
            className="cursor-pointer border-0 bg-transparent p-1 text-sm font-medium text-terra"
          >
            {isSignup ? 'Entrar' : 'Criar conta'}
          </button>
        </div>
      </form>
    </div>
  )
}
