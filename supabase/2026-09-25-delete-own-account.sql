begin;

-- Account deletion is exposed only to an authenticated user and always uses
-- auth.uid(), so a caller can never choose or delete another account.
create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  caller uuid := auth.uid();
begin
  if caller is null then
    raise exception 'Authentication required';
  end if;

  delete from auth.users where id = caller;
  if not found then
    raise exception 'Account not found';
  end if;
end
$function$;

revoke all on function public.delete_own_account() from public, anon, authenticated;
grant execute on function public.delete_own_account() to authenticated;

notify pgrst, 'reload schema';
commit;
