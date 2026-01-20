// Supabase Client for TrendYummy
// PostgreSQL database client with type-safe queries

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('SUPABASE_URL or SUPABASE_ANON_KEY is not set in environment variables');
}

export const supabase: SupabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// Database table types
export interface Task {
  id: string;
  goal_title: string;
  goal_description: string | null;
  category: string;
  repository: string;
  branch: string | null;
  prompt: string;
  source_context: Record<string, any> | null;
  require_plan_approval: boolean;
  automation_mode: string | null;
  priority: number;
  max_retries: number;
  retry_count: number;
  timeout_ms: number;
  status: 'pending' | 'queued' | 'in_progress' | 'plan_review' | 'completed' | 'failed' | 'cancelled';
  session_id: string | null;
  created_at: string;
  updated_at: string;
  started_at: string | null;
  completed_at: string | null;
  result: Record<string, any> | null;
  error_message: string | null;
  pull_request_url: string | null;
}

export interface Session {
  id: string;
  task_id: string | null;
  title: string | null;
  prompt: string | null;
  state: 'queued' | 'planning' | 'plan_review' | 'in_progress' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
  started_at: string | null;
  completed_at: string | null;
  jules_url: string | null;
  source_context: Record<string, any> | null;
  require_plan_approval: boolean | null;
  automation_mode: string | null;
  plan: Record<string, any> | null;
  pull_request_url: string | null;
  artifacts: Record<string, any> | null;
  error_message: string | null;
}

export interface Activity {
  id: string;
  session_id: string;
  activity_type: 'plan_generated' | 'message' | 'execution_complete' | 'error' | 'plan_approved';
  timestamp: string;
  content: Record<string, any> | null;
}

export interface Trend {
  id: string;
  source: string;
  category: 'news' | 'entertainment' | 'meme' | 'social';
  keyword: string;
  title: string | null;
  description: string | null;
  related_keywords: string[] | null;
  trend_score: number;
  sentiment_score: number | null;
  viral_potential: number;
  source_url: string | null;
  image_urls: string[] | null;
  related_persons: Record<string, any>[] | null;
  detected_at: string;
  peak_at: string | null;
  expires_at: string | null;
  content_type_assigned: string | null;
  content_generated: boolean;
  content_id: string | null;
}

export interface Content {
  id: string;
  trend_id: string | null;
  session_id: string | null;
  content_type: 'mbti_test' | 'level_test' | 'compatibility' | 'fortune' | 'webtoon_4cut' | 'satire_poem' | 'short_story';
  title: string;
  description: string | null;
  content_data: Record<string, any>;
  image_urls: string[] | null;
  status: 'draft' | 'review' | 'approved' | 'published' | 'rejected';
  published_url: string | null;
  published_at: string | null;
  quality_score: number | null;
  view_count: number;
  share_count: number;
  created_at: string;
  updated_at: string;
}
