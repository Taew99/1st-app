import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { toLocalDateString } from '../utils/date';
import type {
  QuestionCategory,
  UserQuestionSetting,
  DailyQuestionAssignment,
  Question,
} from '../types/database';

export function useQuestionCategories() {
  return useQuery({
    queryKey: ['questionCategories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('question_categories')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return (data ?? []) as QuestionCategory[];
    },
  });
}

export function useUserQuestionSettings() {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: ['userQuestionSettings', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_question_settings')
        .select('*, category:question_categories(*)')
        .eq('user_id', user!.id);
      if (error) throw error;
      return (data ?? []) as UserQuestionSetting[];
    },
    enabled: !!user,
  });
}

export function useUpsertQuestionSetting() {
  const qc = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: async (payload: {
      category_id: string;
      is_enabled: boolean;
      start_date?: string | null;
      end_date?: string | null;
      notify_time?: string | null;
    }) => {
      const { error } = await supabase.from('user_question_settings').upsert(
        {
          user_id: user!.id,
          category_id: payload.category_id,
          is_enabled: payload.is_enabled,
          start_date: payload.start_date ?? null,
          end_date: payload.end_date ?? null,
          notify_time: payload.notify_time ?? null,
        },
        { onConflict: 'user_id,category_id' },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['userQuestionSettings'] });
      qc.invalidateQueries({ queryKey: ['todayQuestion'] });
    },
  });
}

async function assignTodayQuestion(userId: string): Promise<DailyQuestionAssignment | null> {
  const today = toLocalDateString();

  // Check if already assigned
  const { data: existing } = await supabase
    .from('daily_question_assignments')
    .select('*, question:questions(*, category:question_categories(*))')
    .eq('user_id', userId)
    .eq('assigned_date', today)
    .single();

  if (existing) return existing as DailyQuestionAssignment;

  // Get enabled categories
  const { data: settings } = await supabase
    .from('user_question_settings')
    .select('category_id')
    .eq('user_id', userId)
    .eq('is_enabled', true);

  if (!settings || settings.length === 0) return null;

  const enabledCategoryIds = settings.map((s) => s.category_id);

  // Pick random question from enabled categories
  const { data: questions } = await supabase
    .from('questions')
    .select('*')
    .in('category_id', enabledCategoryIds);

  if (!questions || questions.length === 0) return null;

  // Deterministic daily pick: hash userId+date to pick index
  const seed = userId.charCodeAt(0) + today.split('-').reduce((a, b) => a + parseInt(b), 0);
  const picked = questions[seed % questions.length] as Question;

  const { data: assignment, error } = await supabase
    .from('daily_question_assignments')
    .insert({ user_id: userId, question_id: picked.id, assigned_date: today })
    .select('*, question:questions(*, category:question_categories(*))')
    .single();

  if (error) return null;
  return assignment as DailyQuestionAssignment;
}

export function useTodayQuestion() {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: ['todayQuestion', user?.id],
    queryFn: () => assignTodayQuestion(user!.id),
    enabled: !!user,
    staleTime: 60_000 * 60, // 1 hour
  });
}

export function useMarkQuestionAnswered() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (assignmentId: string) => {
      const { error } = await supabase
        .from('daily_question_assignments')
        .update({ answered: true })
        .eq('id', assignmentId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['todayQuestion'] });
    },
  });
}
