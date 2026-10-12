begin;

create table if not exists public.fixed_expenses (
  id text primary key,
  icon text not null,
  name text not null check (char_length(trim(name)) > 0),
  description text not null default '',
  amount numeric(12, 2) not null check (amount >= 0),
  sort_order smallint not null unique check (sort_order > 0),
  updated_at timestamptz not null default now()
);

insert into public.fixed_expenses (id, icon, name, description, amount, sort_order)
values
  ('rent', '🏠', 'Aluguel', 'Dia 1 a 3 de cada mês', 1797.00, 1),
  ('school', '🎓', 'Escola', 'Até dia 3', 577.00, 2),
  ('utilities', '💡', 'Utilities', 'Água, luz e trash', 190.00, 3),
  ('phone', '📱', 'Telefone', 'Mensal', 50.00, 4),
  ('camila', '👤', 'Camila', 'Gastos pessoais', 170.00, 5),
  ('jiujitsu', '🥋', 'Jiujitsu', 'Mensal', 155.00, 6),
  ('car-insurance', '🚗', 'Seguro dos Carros', 'Mensal', 245.00, 7),
  ('business-insurance', '🏢', 'Seguro da Empresa', 'Mensal', 50.00, 8),
  ('la-fitness', '🏋️', 'LA Fitness', 'Camila e Eduardo', 67.00, 9),
  ('market', '🛒', 'Mercado', 'Estimativa mensal', 800.00, 10),
  ('oportun', '💳', 'Oportun', 'Mensal', 70.00, 11),
  ('gas', '⛽', 'Gasolina', 'Estimativa mensal', 300.00, 12),
  ('extras', '➕', 'Extras', 'Margem mensal', 400.00, 13),
  ('savings', '🚗', 'Parcela do carro', 'Valor mensal', 500.00, 14)
on conflict (id) do update
set
  icon = excluded.icon,
  name = excluded.name,
  description = excluded.description,
  amount = excluded.amount,
  sort_order = excluded.sort_order,
  updated_at = now();

alter table public.fixed_expenses enable row level security;

drop policy if exists "Fixed expenses are publicly readable" on public.fixed_expenses;
create policy "Fixed expenses are publicly readable"
on public.fixed_expenses
for select
to anon, authenticated
using (true);

drop policy if exists "Fixed expenses are publicly editable" on public.fixed_expenses;
create policy "Fixed expenses are publicly editable"
on public.fixed_expenses
for update
to anon, authenticated
using (true)
with check (true);

drop policy if exists "Fixed expenses are publicly insertable" on public.fixed_expenses;
create policy "Fixed expenses are publicly insertable"
on public.fixed_expenses
for insert
to anon, authenticated
with check (true);

drop policy if exists "Fixed expenses are publicly deletable" on public.fixed_expenses;
create policy "Fixed expenses are publicly deletable"
on public.fixed_expenses
for delete
to anon, authenticated
using (true);

grant select, insert, update, delete on public.fixed_expenses to anon, authenticated;

commit;
