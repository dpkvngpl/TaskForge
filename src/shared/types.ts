// ============================================
// Task
// ============================================

export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'archived';
export type TaskPriority = 0 | 1 | 2 | 3; // 0=none, 1=low, 2=medium, 3=high

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;       // ISO 8601 date string: "2026-03-25"
  due_time: string | null;       // "HH:MM" format: "14:30"
  estimated_mins: number | null;
  category: string | null;
  tags: string[];                 // Stored as JSON string in DB, parsed in app

  // Source (generic connector linkage)
  source_connector: string | null; // 'manual', 'outlook', etc.
  source_id: string | null;
  source_meta: Record<string, unknown> | null; // Stored as JSON in DB

  // Recurrence
  recurrence_rule: string | null;  // RRULE string
  recurrence_parent_id: string | null;

  // Scheduling
  scheduled_date: string | null;   // "2026-03-25"
  scheduled_slot: string | null;   // 'morning', 'afternoon', 'evening', or "HH:MM"

  // Metadata
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  sort_order: number;
}

export interface NewTask {
  title: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string | null;
  due_time?: string | null;
  estimated_mins?: number | null;
  category?: string | null;
  tags?: string[];
  source_connector?: string | null;
  source_id?: string | null;
  source_meta?: Record<string, unknown> | null;
  recurrence_rule?: string | null;
  recurrence_parent_id?: string | null;
  scheduled_date?: string | null;
  scheduled_slot?: string | null;
}

export interface TaskFilters {
  status?: TaskStatus | TaskStatus[];
  priority?: TaskPriority | TaskPriority[];
  category?: string | null;
  tags?: string[];
  due_before?: string;
  due_after?: string;
  scheduled_date?: string;
  search?: string;
  source_connector?: string;
}

// ============================================
// Task Template
// ============================================

export interface TaskTemplate {
  id: string;
  name: string;
  template_data: NewTask;          // Stored as JSON in DB
  recurrence_rule: string | null;
  is_active: boolean;
  created_at: string;
}

// ============================================
// Activity Log
// ============================================

export interface ActivityLogEntry {
  id: number;
  task_id: string | null;
  action: 'created' | 'updated' | 'moved' | 'completed' | 'deleted';
  old_value: Partial<Task> | null; // JSON in DB
  new_value: Partial<Task> | null; // JSON in DB
  timestamp: string;
}

// ============================================
// Connector System (generic plugin interface)
// ============================================

export interface ExternalItem {
  externalId: string;
  source: string;               // Connector ID
  title: string;
  body?: string;
  date?: string;
  sender?: string;
  metadata?: Record<string, unknown>;
}

export interface FetchOptions {
  since?: Date;
  folder?: string;
  limit?: number;
  query?: string;
}

// ============================================
// Settings
// ============================================

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  defaultPriority: TaskPriority;
  defaultCategory: string | null;
  categories: string[];           // User-defined category list
  kanbanColumns: KanbanColumn[];
  minimizeToTray: boolean;
  reminderMinutesBefore: number;
}

export interface KanbanColumn {
  id: string;
  label: string;
  status: TaskStatus;
  color?: string;
}

// ============================================
// View State
// ============================================

export type ViewType = 'kanban' | 'week' | 'timeline' | 'focus' | 'recurrence' | 'settings';
