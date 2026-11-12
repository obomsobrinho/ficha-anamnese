// Single source of truth for every value that comes from the prototype
// (Ficha Endodôntica Protótipo v2). Do not add values that are not there.

// ---------- Care record (atendimento) status, derived like the prototype's toothStatus ----------
export const STATUS = {
  concluido: 'Concluído',
  emTratamento: 'Em tratamento',
  aguardando: 'Aguardando assinatura',
  emExame: 'Em exame',
} as const
export type Status = (typeof STATUS)[keyof typeof STATUS]

export const STATUS_STYLE: Record<
  Status,
  { dot: string; chipBg: string; chipFg: string; tileBg: string; tileFg: string }
> = {
  'Concluído': { dot: '#A89A92', chipBg: '#EEE8E3', chipFg: '#5E534D', tileBg: '#E6DED8', tileFg: '#5E534D' },
  'Em tratamento': { dot: '#A3604B', chipBg: '#F6EAE3', chipFg: '#7A4433', tileBg: '#A3604B', tileFg: '#fff' },
  'Aguardando assinatura': { dot: '#C98B2E', chipBg: '#FBF1E3', chipFg: '#8A5A14', tileBg: '#F1DDBB', tileFg: '#6E4A12' },
  'Em exame': { dot: '#B5715C', chipBg: '#F4ECE6', chipFg: '#6E625C', tileBg: '#F4ECE6', tileFg: '#7A4433' },
}

// ---------- Part state ----------
export const PART_STATE = { vazio: 'Vazio', andamento: 'Em andamento', feito: 'Feito' } as const
export type PartState = (typeof PART_STATE)[keyof typeof PART_STATE]

export const TERMO_STATUS = {
  naoEnviado: 'Não enviado',
  assinado: 'Assinado',
} as const
export type TermoStatus = (typeof TERMO_STATUS)[keyof typeof TERMO_STATUS]

// ---------- Procedures ----------
export type ProcKey = 'endodontia'
export const PROCEDIMENTOS = {
  endodontia: {
    name: 'Endodontia',
    desc: '1 dente · exame, raio-X, termo, tratamento e raio-X final',
    parts: ['exame', 'rxi', 'termo', 'trat', 'rxf'] as const,
  },
} as const
/** Shown disabled with the "Em breve" badge, as approved by the owner on 12/11/2026. */
export const PROCEDIMENTOS_EM_BREVE = [
  { name: 'Restauração', desc: 'Um ou mais dentes' },
  { name: 'Cirurgia', desc: 'Um ou mais dentes' },
  { name: 'Periodontia', desc: 'Um ou mais dentes' },
  { name: 'Prótese', desc: 'Um ou mais dentes' },
  { name: 'Implante', desc: 'Um ou mais dentes' },
  { name: 'Personalizado', desc: 'Monte a anamnese do seu jeito' },
] as const

// ---------- File types (arquivos.tipo) ----------
export const ARQUIVO_TIPO = { rxi: 'rx_inicial', rxf: 'rx_final', assinatura: 'assinatura' } as const
export type ArquivoTipo = (typeof ARQUIVO_TIPO)[keyof typeof ARQUIVO_TIPO]

// ---------- Cadastro e saúde (pacientes.dados) ----------
export const SEXOS = ['Feminino', 'Masculino', 'Outro'] as const
export const ESTADOS_CIVIS = ['Solteira(o)', 'Casada(o)', 'União estável', 'Divorciada(o)', 'Viúva(o)'] as const
export const DOENCAS = [
  'Diabetes',
  'Hipertensão',
  'Gastrite',
  'Triglicérides',
  'Dislipidemia',
  'Colite',
  'Doença Renal Crônica',
  'Doenças Cardiovasculares',
  'Doenças Respiratórias',
  'Problemas de circulação',
  'Hipotireoidismo',
  'Hipertireoidismo',
  'Depressão',
  'Ansiedade',
  'Transtornos Alimentares',
  'Outros',
] as const
export const YN_QUESTIONS = [
  { key: 'cir', q: '3. Já realizou alguma cirurgia?', hint: 'Se sim, qual e quando?' },
  { key: 'med', q: '4. Faz uso de algum medicamento?', hint: 'Se sim, qual(is)?' },
  { key: 'ale', q: '5. Possui alergia a medicamentos ou alimentos?', hint: 'Se sim, qual(is)?' },
  { key: 'ant', q: '6. Já realizou algum tratamento odontológico anteriormente?', hint: 'Se sim, qual?' },
] as const
export type YnKey = (typeof YN_QUESTIONS)[number]['key']
export type YnValue = '' | 'Sim' | 'Não'

export interface PacienteDados {
  sexo: string
  civil: string
  prof: string
  email: string
  city: string
  motivo: string
  doencas: string[]
  outros: string
  yn: Record<YnKey, YnValue>
  ynTxt: Record<YnKey, string>
}

export const blankDados = (): PacienteDados => ({
  sexo: '',
  civil: '',
  prof: '',
  email: '',
  city: '',
  motivo: '',
  doencas: [],
  outros: '',
  yn: { cir: '', med: '', ale: '', ant: '' },
  ynTxt: { cir: '', med: '', ale: '', ant: '' },
})

// ---------- Exame clínico ----------
export const HDA = [
  'Dor espontânea',
  'Dor provocada',
  'Dor ao mastigar',
  'Dor noturna',
  'Alívio com medicamento',
  'Sensibilidade ao frio',
  'Sensibilidade ao calor',
  'Edema',
  'Fístula',
  'Trauma',
] as const
export const INSPECAO = [
  'Cárie',
  'Restauração',
  'Coroa protética',
  'Fratura coronária',
  'Alteração de cor',
  'Exposição pulpar',
  'Outros',
] as const
export const TESTES = [
  { key: 'perc', label: 'Percussão', opts: ['Negativa', 'Positiva'] },
  { key: 'palp', label: 'Palpação', opts: ['Negativa', 'Positiva'] },
  { key: 'frio', label: 'Sensibilidade pulpar — Frio', opts: ['Normal', 'Exagerada', 'Ausente'] },
  { key: 'calor', label: 'Sensibilidade pulpar — Calor', opts: ['Positiva', 'Negativa'] },
] as const
export type TesteKey = (typeof TESTES)[number]['key']
export const DIAG_PULPAR = [
  'Polpa normal',
  'Pulpite reversível',
  'Pulpite irreversível sintomática',
  'Pulpite irreversível assintomática',
  'Necrose pulpar',
  'Dente previamente tratado',
  'Dente previamente iniciado',
] as const
export const DIAG_PERIAPICAL = [
  'Tecidos apicais normais',
  'Periodontite apical sintomática',
  'Periodontite apical assintomática',
  'Abscesso apical agudo',
  'Abscesso apical crônico',
  'Osteíte condensante',
] as const

export interface ExameData {
  hda: string[]
  insp: string[]
  tests: Record<TesteKey, string>
  dp: string
  dpa: string
  plano: string
  obs: string
}
export const blankExame = (): ExameData => ({
  hda: [],
  insp: [],
  tests: { perc: '', palp: '', frio: '', calor: '' },
  dp: '',
  dpa: '',
  plano: '',
  obs: '',
})

// ---------- Tratamento endodôntico ----------
export const TIPOS_TRATAMENTO = ['Biopulpectomia', 'Necropulpectomia', 'Retratamento'] as const
export const IRRIGACAO = ['NaOCl', 'EDTA 17%', 'Clorexidina', 'Outros'] as const
export const TECNICAS = ['Condensação lateral', 'Condensação vertical', 'Termoplastificada'] as const

export interface CanalRow {
  c: string
  cad: string
  crd: string
  lima: string
}
export interface TratData {
  tipo: string
  canals: Record<string, CanalRow[]>
  seq: string
  sessoes: number
  tubetes: number
  controle: number
  inicio: string
  fim: string
  anest: string
  grampo: string
  irrig: string[]
  naocl: string
  med: string
  cimento: string
  tecnica: string
}
export const blankTrat = (today: string): TratData => ({
  tipo: '',
  canals: {},
  seq: '',
  sessoes: 1,
  tubetes: 1,
  controle: 6,
  inicio: today,
  fim: '',
  anest: '',
  grampo: '',
  irrig: [],
  naocl: '2,5',
  med: '',
  cimento: '',
  tecnica: '',
})

// ---------- Parts (atendimentos.partes) ----------
export interface Foto {
  id: string // arquivos.id
  date: string // 'dd/mm/aaaa · hh:mm'
  note: string
}
export interface Partes {
  exame: { state: PartState; date: string; data: ExameData }
  rxi: { state: PartState; date: string }
  termo: { status: TermoStatus; signer: string; signedAt: string }
  trat: { state: PartState; date: string; data: TratData }
  rxf: { state: PartState; date: string }
}
export type PartKey = keyof Partes

export const blankPartes = (today: string): Partes => ({
  exame: { state: 'Vazio', date: '', data: blankExame() },
  rxi: { state: 'Vazio', date: '' },
  termo: { status: 'Não enviado', signer: '', signedAt: '' },
  trat: { state: 'Vazio', date: '', data: blankTrat(today) },
  rxf: { state: 'Vazio', date: '' },
})

// ---------- Rows ----------
export interface Profissional {
  user_id: string
  nome: string
  profissao: string | null
  cro: string | null
  telefone: string | null
}
export interface Paciente {
  id: string
  nome: string
  nascimento: string | null // yyyy-mm-dd
  telefone: string | null
  dados: PacienteDados
  saude_atualizada_em: string | null
  created_at: string
}
export interface Atendimento {
  id: string
  paciente_id: string
  procedimento: ProcKey
  dentes: string[]
  status: Status
  iniciado_em: string // yyyy-mm-dd
  partes: Partes
  created_at: string
}
export interface Arquivo {
  id: string
  atendimento_id: string
  tipo: ArquivoTipo
  caminho: string
  data: string | null
  nota: string | null
  created_at: string
}
