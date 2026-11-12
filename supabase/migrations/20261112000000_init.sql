-- Ficha: functional test version. One account = one professional; RLS isolates everything by user_id.

-- updated_at helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Professional profile (filled at sign-up, shown on the record headers)
create table public.profissionais (
  user_id uuid primary key default auth.uid() references auth.users on delete cascade,
  nome text not null,
  profissao text,
  cro text,
  telefone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.pacientes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  nome text not null,
  nascimento date,
  telefone text,
  dados jsonb not null default '{}',
  saude_atualizada_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.atendimentos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  paciente_id uuid not null references public.pacientes on delete cascade,
  procedimento text not null default 'endodontia',
  dentes text[] not null,
  status text not null,
  iniciado_em date not null default current_date,
  partes jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.arquivos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  atendimento_id uuid not null references public.atendimentos on delete cascade,
  tipo text not null,
  caminho text not null,
  data date,
  nota text,
  created_at timestamptz not null default now()
);

create index pacientes_user_id_idx on public.pacientes (user_id);
create index atendimentos_user_id_idx on public.atendimentos (user_id);
create index atendimentos_paciente_id_idx on public.atendimentos (paciente_id);
create index arquivos_user_id_idx on public.arquivos (user_id);
create index arquivos_atendimento_id_idx on public.arquivos (atendimento_id);

create trigger profissionais_updated_at before update on public.profissionais
  for each row execute function public.set_updated_at();
create trigger pacientes_updated_at before update on public.pacientes
  for each row execute function public.set_updated_at();
create trigger atendimentos_updated_at before update on public.atendimentos
  for each row execute function public.set_updated_at();

-- RLS: one policy per table, the owner does everything with own rows
alter table public.profissionais enable row level security;
alter table public.pacientes enable row level security;
alter table public.atendimentos enable row level security;
alter table public.arquivos enable row level security;

create policy "own rows" on public.profissionais for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own rows" on public.pacientes for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own rows" on public.atendimentos for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own rows" on public.arquivos for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Create the professional profile from the sign-up metadata, atomically with the user
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profissionais (user_id, nome, profissao, cro, telefone)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'nome', ''), new.email),
    nullif(new.raw_user_meta_data ->> 'profissao', ''),
    nullif(new.raw_user_meta_data ->> 'cro', ''),
    nullif(new.raw_user_meta_data ->> 'telefone', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Private bucket; path {user_id}/{atendimento_id}/{file}
insert into storage.buckets (id, name, public) values ('arquivos', 'arquivos', false);

create policy "own folder read" on storage.objects for select to authenticated
  using (bucket_id = 'arquivos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "own folder insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'arquivos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "own folder update" on storage.objects for update to authenticated
  using (bucket_id = 'arquivos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "own folder delete" on storage.objects for delete to authenticated
  using (bucket_id = 'arquivos' and (storage.foldername(name))[1] = (select auth.uid())::text);
