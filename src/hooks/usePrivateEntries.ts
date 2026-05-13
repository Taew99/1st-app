import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { PrivateEntry } from '../types/database';

export function usePrivateEntries(searchQuery?: string) {
  return useQuery({
    queryKey: ['privateEntries', searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('private_entries')
        .select('id, user_id, entry_type, title, body, question_id, created_at, updated_at')
        .order('updated_at', { ascending: false });

      if (searchQuery?.trim()) {
        query = query.or(`title.ilike.%${searchQuery}%,body.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as PrivateEntry[];
    },
  });
}

export function usePrivateEntry(id: string) {
  return useQuery({
    queryKey: ['privateEntry', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('private_entries')
        .select(`
          id, user_id, entry_type, title, body, question_id, created_at, updated_at,
          question:questions(id, body, category_id)
        `)
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as PrivateEntry;
    },
    enabled: !!id,
  });
}

export function useCreateEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      entry_type: 'free' | 'question';
      title?: string;
      body: string;
      question_id?: string;
      user_id: string;
    }) => {
      const { data, error } = await supabase
        .from('private_entries')
        .insert({
          user_id: payload.user_id,
          entry_type: payload.entry_type,
          title: payload.title?.trim() || null,
          body: payload.body,
          question_id: payload.question_id ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['privateEntries'] });
    },
  });
}

export function useUpdateEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, title, body }: { id: string; title?: string; body: string }) => {
      const { error } = await supabase
        .from('private_entries')
        .update({ title: title?.trim() || null, body })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ['privateEntries'] });
      qc.invalidateQueries({ queryKey: ['privateEntry', id] });
    },
  });
}

export function useDeleteEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('private_entries').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['privateEntries'] });
    },
  });
}
