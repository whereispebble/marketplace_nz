-- Read-only audit. Do not automatically delete or invent replacement coordinates.
select count(*) as invalid_favorite_ids from public.favorites
where product_id::text !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
select count(*) as orphan_favorites from public.favorites f
left join public.products p on p.id::text = f.product_id::text where p.id is null;
select count(*) as incomplete_coordinate_pairs from public.products
where (lat is null) <> (lng is null);
select count(*) as out_of_range_coordinates from public.products
where lat not between -90 and 90 or lng not between -180 and 180;
select count(*) as duplicate_username_groups from (
 select lower(username) from public.profiles where username is not null group by lower(username) having count(*) > 1
) duplicates;
select count(*) as mismatched_chat_sellers from public.chats c
join public.products p on p.id = c.product_id where c.seller_id <> p.user_id;
-- Review policies, grants and any additional tables in the actual project.
select tablename, policyname, cmd from pg_policies where schemaname = 'public' order by tablename, policyname;
-- After owners correct and confirm existing listings, run these separately:
-- alter table public.products validate constraint products_published_complete;
-- alter table public.favorites validate constraint favorites_product_id_fkey;
-- alter table public.user_reports validate constraint user_reports_reported_user_id_fkey;
