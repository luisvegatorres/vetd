-- Project agreement gate
-- Extends the deposit gate from 0007: a priced project cannot enter `active`
-- unless both the deposit is paid AND a signed contract exists. Prevents the
-- scenario where we collect a deposit, deliver the work, and collect the
-- balance with no signed documentation to fall back on.
--
-- "Agreement" is narrowly defined as a document with kind='contract' and
-- status='signed'. Other kinds (sow, proposal, nda, invoice_terms) do not
-- satisfy the gate. Projects with no value bypass the gate, mirroring 0007.

create or replace function public.projects_enforce_deposit_gate()
returns trigger
language plpgsql
as $$
declare
  has_signed_contract boolean;
begin
  if new.stage = 'active'
     and new.value is not null
     and new.value > 0 then

    if new.deposit_paid_at is null then
      raise exception 'project %: cannot move to active before deposit is paid', new.id
        using errcode = 'check_violation';
    end if;

    select exists (
      select 1
      from public.documents d
      where d.project_id = new.id
        and d.kind = 'contract'
        and d.status = 'signed'
    ) into has_signed_contract;

    if not has_signed_contract then
      raise exception 'project %: cannot move to active before a contract is signed', new.id
        using errcode = 'check_violation';
    end if;
  end if;
  return new;
end;
$$;
