export type Assignee = 'spencer' | 'clawdbot';
export type Priority = 'P1' | 'P2' | 'P3';
export type TaskStatus = 'backlog' | 'in-progress' | 'needs-review' | 'done';
export type Autonomy = 'full' | 'do-then-review' | 'discuss-first';
export type ChecklistType = 'short-term' | 'long-term';
export type ProjectStatus = 'active' | 'paused' | 'completed';

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  github_url: string | null;
  live_url: string | null;
  vercel_url: string | null;
  color: string;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  project_id: string | null;
  title: string;
  description: string | null;
  assignee: Assignee;
  priority: Priority;
  status: TaskStatus;
  autonomy: Autonomy;
  estimated_minutes: number | null;
  due_date: string | null;
  position: number;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface ChecklistItem {
  id: string;
  project_id: string | null;
  title: string;
  type: ChecklistType;
  due_date: string | null;
  completed: boolean;
  completed_at: string | null;
  position: number;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  project_id: string | null;
  actor: Assignee;
  action: string;
  target_type: string | null;
  target_id: string | null;
  target_title: string | null;
  details: string | null;
  created_at: string;
}

export interface QuickCapture {
  id: string;
  content: string;
  project_id: string | null;
  processed: boolean;
  created_at: string;
}

export interface TaskComment {
  id: string;
  task_id: string;
  author: Assignee;
  content: string;
  created_at: string;
}

// Styling helpers
export const PRIORITY_STYLES: Record<Priority, string> = {
  'P1': 'bg-red-500/20 text-red-400 border-red-500/30',
  'P2': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  'P3': 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
};

export const PROJECT_COLORS: Record<string, string> = {
  'emerald': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  'purple': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'orange': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  'blue': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
};

export const STATUS_COLUMNS: { value: TaskStatus; label: string }[] = [
  { value: 'backlog', label: 'Backlog' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'needs-review', label: 'Needs Review' },
  { value: 'done', label: 'Done' },
];

export const AUTONOMY_LABELS: Record<Autonomy, string> = {
  'full': '🟢 Full Autonomy',
  'do-then-review': '🟡 Do Then Review',
  'discuss-first': '🔴 Discuss First',
};

// Daily Summaries
export type SummaryCategory = 'feature' | 'fix' | 'docs' | 'other';

export interface DailySummaryItem {
  text: string;
  time: string;
  category: SummaryCategory;
}

export interface DailySummary {
  id: string;
  date: string;
  items: DailySummaryItem[];
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export const CATEGORY_STYLES: Record<SummaryCategory, string> = {
  'feature': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  'fix': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'docs': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'other': 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
};

// Tweet Drafts
export type TweetDraftStatus = 'draft' | 'pending-review' | 'approved' | 'rejected' | 'posted';

export interface TweetDraft {
  id: string;
  project_id: string | null;
  content: string;
  target_account: string;
  media_urls: string[];
  status: TweetDraftStatus;
  created_by: Assignee;
  feedback: string | null;
  scheduled_for: string | null;
  created_at: string;
  updated_at: string;
  posted_at: string | null;
}

export const TWEET_STATUS_STYLES: Record<TweetDraftStatus, string> = {
  'draft': 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
  'pending-review': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  'approved': 'bg-green-500/20 text-green-400 border-green-500/30',
  'rejected': 'bg-red-500/20 text-red-400 border-red-500/30',
  'posted': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
};
