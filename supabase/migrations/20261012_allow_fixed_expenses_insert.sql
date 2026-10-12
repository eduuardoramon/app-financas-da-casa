begin;

drop policy if exists "Fixed expenses are publicly insertable" on public.fixed_expenses;
create policy "Fixed expenses are publicly insertable"
on public.fixed_expenses
for insert
to anon, authenticated
with check (true);

grant insert on public.fixed_expenses to anon, authenticated;

commit;
