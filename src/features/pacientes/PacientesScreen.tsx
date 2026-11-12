import { Skeleton } from '@/components/ui'
import { useAuth } from '@/features/auth/AuthProvider'
import { profLine, useProfissional } from '@/features/profissional/useProfissional'

export function ProfHeader() {
  const { data: prof, isPending } = useProfissional()
  const { signOut } = useAuth()
  return (
    <div className="flex items-center gap-3 px-5 pt-2.5 pb-[18px]">
      <div className="box-border size-12 flex-none rounded-full border border-line bg-sand p-[9px]" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        {isPending && !prof ? (
          <>
            <Skeleton className="h-[22px] w-48" />
            <Skeleton className="h-3.5 w-36" />
          </>
        ) : (
          <>
            <div className="truncate font-serif text-xl leading-[1.1] font-semibold">{prof?.nome}</div>
            <div className="truncate text-xs tracking-[.02em] text-muted">{profLine(prof)}</div>
          </>
        )}
      </div>
      <button
        type="button"
        onClick={signOut}
        className="h-11 flex-none cursor-pointer border-0 bg-transparent px-1 text-[13px] text-muted"
      >
        Sair
      </button>
    </div>
  )
}

export function PacientesScreen() {
  return (
    <div className="relative flex min-h-dvh flex-col">
      <ProfHeader />
      <div className="flex flex-col gap-3.5 px-5">
        <div className="flex items-baseline justify-between">
          <div className="font-serif text-[34px] font-medium">Pacientes</div>
        </div>
      </div>
    </div>
  )
}
