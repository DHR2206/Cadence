-- Create a function to match AI memories based on vector cosine similarity
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
security definer
set search_path = public
as $$
begin
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
  limit match_count;
end;
$$;

grant execute on function public.match_ai_memories to authenticated;
