export type PostType = 'original' | 'quote';
export type PostStatus = 'active' | 'reported' | 'hidden';
export type EntryType = 'free' | 'question';

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export interface PublicPost {
  id: string;
  user_id: string;
  post_type: PostType;
  body: string | null;
  image_url: string | null;
  thumb_url: string | null;
  quoted_post_id: string | null;
  post_date: string;
  status: PostStatus;
  created_at: string;
  // joined
  profile?: Profile;
  quoted_post?: PublicPost | null;
}

export interface PrivateEntry {
  id: string;
  user_id: string;
  entry_type: EntryType;
  title: string | null;
  body: string;
  question_id: string | null;
  created_at: string;
  updated_at: string;
  // joined
  question?: Question | null;
}

export interface QuestionCategory {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
  created_at: string;
}

export interface Question {
  id: string;
  category_id: string;
  body: string;
  sort_order: number;
  created_at: string;
  // joined
  category?: QuestionCategory;
}

export interface UserQuestionSetting {
  id: string;
  user_id: string;
  category_id: string;
  is_enabled: boolean;
  start_date: string | null;
  end_date: string | null;
  notify_time: string | null;
  created_at: string;
  updated_at: string;
  // joined
  category?: QuestionCategory;
}

export interface DailyQuestionAssignment {
  id: string;
  user_id: string;
  question_id: string;
  assigned_date: string;
  answered: boolean;
  created_at: string;
  // joined
  question?: Question;
}

export interface PushToken {
  id: string;
  user_id: string;
  token: string;
  platform: 'ios' | 'android' | null;
  created_at: string;
  updated_at: string;
}

export interface PostReport {
  id: string;
  reporter_id: string;
  post_id: string;
  reason: string | null;
  created_at: string;
}

export interface UserBlock {
  id: string;
  blocker_id: string;
  blocked_id: string;
  created_at: string;
}

// Database generic type for Supabase client
export type Database = {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Omit<Profile, 'created_at' | 'updated_at'>; Update: Partial<Omit<Profile, 'id' | 'created_at'>> };
      public_posts: { Row: PublicPost; Insert: Omit<PublicPost, 'id' | 'created_at' | 'profile' | 'quoted_post'>; Update: Partial<Omit<PublicPost, 'id' | 'user_id' | 'created_at'>> };
      private_entries: { Row: PrivateEntry; Insert: Omit<PrivateEntry, 'id' | 'created_at' | 'updated_at' | 'question'>; Update: Partial<Omit<PrivateEntry, 'id' | 'user_id' | 'created_at'>> };
      question_categories: { Row: QuestionCategory; Insert: Omit<QuestionCategory, 'id' | 'created_at'>; Update: Partial<Omit<QuestionCategory, 'id' | 'created_at'>> };
      questions: { Row: Question; Insert: Omit<Question, 'id' | 'created_at' | 'category'>; Update: Partial<Omit<Question, 'id' | 'created_at'>> };
      user_question_settings: { Row: UserQuestionSetting; Insert: Omit<UserQuestionSetting, 'id' | 'created_at' | 'updated_at' | 'category'>; Update: Partial<Omit<UserQuestionSetting, 'id' | 'user_id' | 'created_at'>> };
      daily_question_assignments: { Row: DailyQuestionAssignment; Insert: Omit<DailyQuestionAssignment, 'id' | 'created_at' | 'question'>; Update: Partial<Omit<DailyQuestionAssignment, 'id' | 'user_id' | 'created_at'>> };
      push_tokens: { Row: PushToken; Insert: Omit<PushToken, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<PushToken, 'id' | 'user_id' | 'created_at'>> };
      post_reports: { Row: PostReport; Insert: Omit<PostReport, 'id' | 'created_at'>; Update: never };
      user_blocks: { Row: UserBlock; Insert: Omit<UserBlock, 'id' | 'created_at'>; Update: never };
    };
  };
};
