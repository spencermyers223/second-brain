export type Category = 'ideas' | 'tasks' | 'research' | 'content-drafts' | 'shipped' | 'learnings' | 'goals' | 'future-projects';
export type Priority = 'high' | 'medium' | 'low';
export type Status = 'backlog' | 'in-progress' | 'review-needed' | 'done' | 'rejected';
export type Project = 'xthread' | 'nomad-research' | 'general' | 'winfirst';
export type Assignee = 'spencer' | 'jarvis' | 'both';

export interface Attachment {
  url: string;
  name: string;
  type: string;
  size: number;
}

export interface BrainItem {
  id: string;
  title: string;
  description: string | null;
  category: Category;
  priority: Priority;
  status: Status;
  project: Project;
  notes: string | null;
  assignee: Assignee;
  tags: string[];
  attachments: Attachment[];
  position: number;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

export interface BrainActivity {
  id: string;
  item_id: string;
  action: string;
  details: Record<string, unknown> | null;
  created_at: string;
}

export const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'ideas', label: 'Ideas' },
  { value: 'tasks', label: 'Tasks' },
  { value: 'research', label: 'Research' },
  { value: 'content-drafts', label: 'Content Drafts' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'learnings', label: 'Learnings' },
  { value: 'goals', label: 'Goals' },
  { value: 'future-projects', label: 'Future Projects' },
];

export const PRIORITIES: { value: Priority; label: string; color: string }[] = [
  { value: 'high', label: 'High', color: 'text-red-400 bg-red-400/10 border-red-400/20' },
  { value: 'medium', label: 'Medium', color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' },
  { value: 'low', label: 'Low', color: 'text-green-400 bg-green-400/10 border-green-400/20' },
];

export const STATUSES: { value: Status; label: string }[] = [
  { value: 'backlog', label: 'Backlog' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'review-needed', label: 'Review Needed' },
  { value: 'done', label: 'Done' },
  { value: 'rejected', label: 'Rejected' },
];

export const PROJECTS: { value: Project; label: string; color: string }[] = [
  { value: 'xthread', label: 'xthread', color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
  { value: 'winfirst', label: 'winfirst', color: 'text-green-400 bg-green-400/10 border-green-400/20' },
  { value: 'nomad-research', label: 'nomad-research', color: 'text-purple-400 bg-purple-400/10 border-purple-400/20' },
  { value: 'general', label: 'general', color: 'text-gray-400 bg-gray-400/10 border-gray-400/20' },
];

export function getPriorityStyle(p: Priority) {
  return PRIORITIES.find(x => x.value === p)!.color;
}

export function getProjectStyle(p: Project) {
  return PROJECTS.find(x => x.value === p)!.color;
}
