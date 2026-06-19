-- Ensure semantic AI memory search cannot be used to bypass RLS by passing
-- another user's UUID into a SECURITY DEFINER function.
create or replace function public.match_ai_memories (
  query_embedding extensions.vector(768),
  match_threshold float,
  match_count int,
  filter_user_id uuid
)
returns table (
  id uuid,
  memory_type text,
  content text,
  metadata jsonb,
  similarity float
)
language plpgsql
security invoker
set search_path = public
as $$
begin
  if filter_user_id is distinct from (select auth.uid()) then
    raise exception 'cannot search AI memories for another user'
      using errcode = '42501';
  end if;

  return query
  select
    mem.id,
    mem.memory_type,
    mem.content,
    mem.metadata,
    1 - (mem.embedding <=> query_embedding) as similarity
  from public.ai_memories mem
  where mem.user_id = filter_user_id
    and mem.embedding is not null
    and 1 - (mem.embedding <=> query_embedding) > match_threshold
  order by mem.embedding <=> query_embedding
  limit least(greatest(match_count, 1), 20);
end;
$$;

grant execute on function public.match_ai_memories to authenticated;
