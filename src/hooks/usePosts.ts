import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import type { PublicPost } from '../types/database';
import { toLocalDateString } from '../utils/date';

const PAGE_SIZE = 20;

const POST_WITH_PROFILE = `
  id, user_id, post_type, body, image_url, thumb_url,
  quoted_post_id, post_date, status, created_at,
  profile:profiles!public_posts_user_id_fkey(id, username, display_name, avatar_url),
  quoted_post:public_posts!public_posts_quoted_post_id_fkey(
    id, user_id, post_type, body, image_url, thumb_url, created_at,
    profile:profiles!public_posts_user_id_fkey(id, username, display_name, avatar_url)
  )
`;

export function useFeed() {
  return useInfiniteQuery({
    queryKey: ['feed'],
    queryFn: async ({ pageParam = 0 }) => {
      const { data, error } = await supabase
        .from('public_posts')
        .select(POST_WITH_PROFILE)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .range(pageParam * PAGE_SIZE, (pageParam + 1) * PAGE_SIZE - 1);

      if (error) throw error;
      return { data: (data ?? []) as PublicPost[], nextPage: pageParam + 1 };
    },
    getNextPageParam: (last) =>
      last.data.length === PAGE_SIZE ? last.nextPage : undefined,
    initialPageParam: 0,
  });
}

export function usePost(postId: string) {
  return useQuery({
    queryKey: ['post', postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('public_posts')
        .select(POST_WITH_PROFILE)
        .eq('id', postId)
        .single();
      if (error) throw error;
      return data as PublicPost;
    },
    enabled: !!postId,
  });
}

export function useTodayPost() {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: ['todayPost', user?.id],
    queryFn: async () => {
      const today = toLocalDateString();
      const { data } = await supabase
        .from('public_posts')
        .select('id, post_date, post_type')
        .eq('user_id', user!.id)
        .eq('post_date', today)
        .single();
      return data ?? null;
    },
    enabled: !!user,
  });
}

export function useCreatePost() {
  const qc = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: async (payload: {
      post_type: 'original' | 'quote';
      body?: string;
      image_url?: string;
      thumb_url?: string;
      quoted_post_id?: string;
    }) => {
      const { data, error } = await supabase
        .from('public_posts')
        .insert({
          user_id: user!.id,
          post_type: payload.post_type,
          body: payload.body ?? null,
          image_url: payload.image_url ?? null,
          thumb_url: payload.thumb_url ?? null,
          quoted_post_id: payload.quoted_post_id ?? null,
          post_date: toLocalDateString(),
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feed'] });
      qc.invalidateQueries({ queryKey: ['todayPost'] });
    },
  });
}

export function useDeletePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase
        .from('public_posts')
        .delete()
        .eq('id', postId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feed'] });
      qc.invalidateQueries({ queryKey: ['todayPost'] });
    },
  });
}

export function useReportPost() {
  return useMutation({
    mutationFn: async ({ postId, reason }: { postId: string; reason?: string }) => {
      const { error } = await supabase
        .from('post_reports')
        .insert({ post_id: postId, reason: reason ?? null, reporter_id: '' });
      if (error && error.code !== '23505') throw error;
    },
  });
}

export function useBlockUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (blockedId: string) => {
      const { error } = await supabase
        .from('user_blocks')
        .insert({ blocked_id: blockedId, blocker_id: '' });
      if (error && error.code !== '23505') throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}
