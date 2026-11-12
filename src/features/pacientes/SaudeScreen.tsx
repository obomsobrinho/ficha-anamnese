import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useLocation, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Screen, TopBar, useBack } from '@/components/layout'
import { Chip, Field, FooterBar, PrimaryButton, SectionLabel, Segmented, TextArea, TextInput } from '@/components/ui'
import { useDeletePaciente, usePaciente, useSaveSaude } from '@/data/pacientes'
import { brToISO, calcAge, isEmail, isoToBR, maskDate, maskPhone } from '@/lib/dates'
import { DOENCAS, ESTADOS_CIVIS, SEXOS, YN_QUESTIONS, blankDados, type PacienteDados } from '@/types'
import { patientView } from './view'

interface FormValues {
  nome: string
  birth: string
  telefone: string
  dados: PacienteDados
}

export interface CreateAfterSave {
  then: 'create'
  proc: string
  teeth: string[]
}

export function SaudeScreen() {
  const { pid } = useParams()
  const isNew = !pid
  const navigate = useNavigate()
  const location = useLocation()
  const after = location.state as CreateAfterSave | null
  const back = useBack(isNew ? '/' : `/pacientes/${pid}`)
  const newId = useMemo(() => crypto.randomUUID(), [])
  const id = pid || newId

  const { data: p } = usePaciente(pid)
  const save = useSaveSaude()
  const del = useDeletePaciente()
  const [confirmDel, setConfirmDel] = useState(false)

  const values = useMemo<FormValues | undefined>(
    () =>
      p
        ? { nome: p.nome, birth: isoToBR(p.nascimento), telefone: p.telefone || '', dados: p.dados }
        : undefined,
    [p],
  )
  const { register, watch, setValue, handleSubmit } = useForm<FormValues>({
    defaultValues: { nome: '', birth: '', telefone: '', dados: blankDados() },
    values,
    resetOptions: { keepDirtyValues: true },
  })
  const d = watch('dados')
  const birth = watch('birth')
  const age = calcAge(birth)
  const set = <K extends keyof PacienteDados>(k: K, v: PacienteDados[K]) =>
    setValue(`dados.${k}` as 'dados', v as never, { shouldDirty: true })
  const toggleDoenca = (x: string) =>
    set('doencas', d.doencas.includes(x) ? d.doencas.filter((y) => y !== x) : [...d.doencas, x])

  const v = patientView(p)
  const onSave = handleSubmit((f) => {
    const nome = f.nome.trim()
    if (!nome) {
      toast.error('Digite o nome do paciente.')
      return
    }
    if (!isEmail(f.dados.email)) {
      toast.error('Confira o e-mail do paciente.')
      return
    }
    save.mutate({ id, isNew, nome, nascimento: brToISO(f.birth), telefone: f.telefone.trim() || null, dados: f.dados })
    if (after?.then === 'create') navigate(`/pacientes/${id}/novo/criar`, { replace: true, state: after })
    else if (isNew) navigate(`/pacientes/${id}`, { replace: true })
    else back()
  })

  const ynSet = (k: (typeof YN_QUESTIONS)[number]['key'], val: '' | 'Sim' | 'Não') => set('yn', { ...d.yn, [k]: val })

  return (
    <Screen>
      <TopBar
        onBack={back}
        title="Cadastro e saúde"
        subtitle={isNew ? 'Novo paciente · Ainda não preenchido' : `${v.displayName} · ${v.healthLabel}`}
      />
      <form onSubmit={onSave} className="flex flex-1 flex-col">
        <div className="flex flex-1 flex-col gap-3.5 px-5 pt-[22px] pb-10">
          <SectionLabel>Paciente</SectionLabel>
          <Field label="Nome completo">
            <TextInput {...register('nome')} placeholder="Nome completo" autoComplete="off" />
          </Field>
          <div className="grid grid-cols-[minmax(0,1fr)_92px] gap-2.5">
            <Field label="Data de nascimento">
              <TextInput
                {...register('birth', { onChange: (e) => setValue('birth', maskDate(e.target.value)) })}
                inputMode="numeric"
                placeholder="dd/mm/aaaa"
              />
            </Field>
            <div className="flex flex-col gap-1.5 text-[13px] text-muted2">
              Idade
              <div className="flex h-12 items-center justify-center rounded-[14px] bg-sand text-base font-medium text-ink">
                {age ?? '—'}
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] text-muted2">Sexo</span>
            <Segmented options={SEXOS} value={d.sexo} onChange={(x) => set('sexo', x)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] text-muted2">Estado civil</span>
            <div className="flex flex-wrap gap-2">
              {ESTADOS_CIVIS.map((c) => (
                <Chip key={c} label={c} on={d.civil === c} onClick={() => set('civil', c)} />
              ))}
            </div>
          </div>
          <Field label="Profissão">
            <TextInput value={d.prof} onChange={(e) => set('prof', e.target.value)} />
          </Field>
          <Field label="Telefone">
            <TextInput
              {...register('telefone', { onChange: (e) => setValue('telefone', maskPhone(e.target.value)) })}
              inputMode="tel"
              placeholder="(00) 00000-0000"
            />
          </Field>
          <Field label="E-mail">
            <TextInput
              value={d.email}
              onChange={(e) => set('email', e.target.value.trim())}
              type="email"
              inputMode="email"
              autoCapitalize="none"
              autoCorrect="off"
              placeholder="nome@email.com"
              style={!isEmail(d.email) ? { borderColor: '#8A3A28' } : undefined}
            />
            {!isEmail(d.email) && <span className="text-xs text-alert-fg">E-mail incompleto ou inválido.</span>}
          </Field>
          <Field label="Cidade/Endereço">
            <TextInput value={d.city} onChange={(e) => set('city', e.target.value)} />
          </Field>

          <SectionLabel className="pt-[18px]">Histórico de saúde</SectionLabel>
          <div className="flex flex-col gap-3">
            <div className="text-base font-medium">1. Qual o principal motivo da sua visita à clínica?</div>
            <TextArea value={d.motivo} onChange={(e) => set('motivo', e.target.value)} />
          </div>
          <div className="flex flex-col gap-3 pt-3">
            <div className="text-base font-medium">2. Você possui alguma dessas doenças?</div>
            <div className="flex flex-wrap gap-2">
              {DOENCAS.map((x) => (
                <Chip key={x} label={x} on={d.doencas.includes(x)} onClick={() => toggleDoenca(x)} />
              ))}
            </div>
            {d.doencas.includes('Outros') && (
              <TextInput value={d.outros} onChange={(e) => set('outros', e.target.value)} placeholder="Outros: quais?" />
            )}
          </div>
          {YN_QUESTIONS.map((y) => (
            <div key={y.key} className="flex flex-col gap-2.5 pt-3">
              <div className="text-base font-medium">{y.q}</div>
              <Segmented options={['Sim', 'Não'] as const} value={d.yn[y.key]} onChange={(x) => ynSet(y.key, x)} />
              {d.yn[y.key] === 'Sim' && (
                <TextInput
                  value={d.ynTxt[y.key]}
                  onChange={(e) => set('ynTxt', { ...d.ynTxt, [y.key]: e.target.value })}
                  placeholder={y.hint}
                />
              )}
            </div>
          ))}
          {!isNew && (
            <button
              type="button"
              onClick={() => setConfirmDel(true)}
              className="mt-6 h-11 cursor-pointer self-center border-0 bg-transparent text-sm text-muted"
            >
              Excluir paciente
            </button>
          )}
        </div>
        <FooterBar>
          <PrimaryButton type="submit">Salvar</PrimaryButton>
        </FooterBar>
      </form>
      <ConfirmDialog
        open={confirmDel}
        onOpenChange={setConfirmDel}
        title={`Excluir ${p?.nome || 'paciente'}?`}
        body="Isso apaga os atendimentos e as imagens. Não dá para desfazer."
        confirmLabel="Excluir paciente"
        onConfirm={() => {
          setConfirmDel(false)
          del.mutate(id)
          navigate('/', { replace: true })
        }}
      />
    </Screen>
  )
}
