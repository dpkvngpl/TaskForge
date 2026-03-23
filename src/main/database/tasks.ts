import { v4 as uuidv4 } from 'uuid';
import { getDb } from './index';
import type { Task, NewTask, TaskFilters } from '../../shared/types';

// ============================================
// Helper: Parse a raw DB row into a Task object
// ============================================
function parseTaskRow(row: Record<string, unknown>): Task {
  return {
    ...row,
    tags: row.tags ? JSON.parse(row.tags as string) : [],
    source_meta: row.source_meta ? JSON.parse(row.source_meta as string) : null,
  } as Task;
}

// ============================================
// GET ALL (with optional filters)
// ============================================
export function getAllTasks(filters?: TaskFilters): Task[] {
  const db = getDb();
  let sql = 'SELECT * FROM tasks WHERE status != \'archived\'';
  const params: unknown[] = [];

  if (filters) {
    if (filters.status) {
      if (Array.isArray(filters.status)) {
        const placeholders = filters.status.map(() => '?').join(',');
        sql += ` AND status IN (${placeholders})`;
        params.push(...filters.status);
      } else {
        sql += ' AND status = ?';
        params.push(filters.status);
      }
    }

    if (filters.priority !== undefined) {
      if (Array.isArray(filters.priority)) {
        const placeholders = filters.priority.map(() => '?').join(',');
        sql += ` AND priority IN (${placeholders})`;
        params.push(...filters.priority);
      } else {
        sql += ' AND priority = ?';
        params.push(filters.priority);
      }
    }

    if (filters.category) {
      sql += ' AND category = ?';
      params.push(filters.category);
    }

    if (filters.due_before) {
      sql += ' AND due_date <= ?';
      params.push(filters.due_before);
    }

    if (filters.due_after) {
      sql += ' AND due_date >= ?';
      params.push(filters.due_after);
    }

    if (filters.scheduled_date) {
      sql += ' AND scheduled_date = ?';
      params.push(filters.scheduled_date);
    }

    if (filters.search) {
      sql += ' AND (title LIKE ? OR description LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm);
    }

    if (filters.source_connector) {
      sql += ' AND source_connector = ?';
      params.push(filters.source_connector);
    }

    if (filters.tags && filters.tags.length > 0) {
      // Search within the JSON tags array
      for (const tag of filters.tags) {
        sql += ' AND tags LIKE ?';
        params.push(`%"${tag}"%`);
      }
    }
  }

  sql += ' ORDER BY sort_order ASC, created_at DESC';

  const rows = db.prepare(sql).all(...params) as Record<string, unknown>[];
  return rows.map(parseTaskRow);
}

// ============================================
// GET BY ID
// ============================================
export function getTaskById(id: string): Task | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  return row ? parseTaskRow(row) : null;
}

// ============================================
// CREATE
// ============================================
export function createTask(input: NewTask): Task {
  const db = getDb();
  const id = uuidv4();
  const now = new Date().toISOString();

  // Calculate sort_order: place at end of the target status column
  const maxSort = db.prepare(
    'SELECT COALESCE(MAX(sort_order), 0) as max_sort FROM tasks WHERE status = ?'
  ).get(input.status || 'todo') as { max_sort: number };

  const task: Record<string, unknown> = {
    id,
    title: input.title,
    description: input.description ?? null,
    status: input.status ?? 'todo',
    priority: input.priority ?? 2,
    due_date: input.due_date ?? null,
    due_time: input.due_time ?? null,
    estimated_mins: input.estimated_mins ?? null,
    category: input.category ?? null,
    tags: JSON.stringify(input.tags ?? []),
    source_connector: input.source_connector ?? 'manual',
    source_id: input.source_id ?? null,
    source_meta: input.source_meta ? JSON.stringify(input.source_meta) : null,
    recurrence_rule: input.recurrence_rule ?? null,
    recurrence_parent_id: input.recurrence_parent_id ?? null,
    scheduled_date: input.scheduled_date ?? null,
    scheduled_slot: input.scheduled_slot ?? null,
    created_at: now,
    updated_at: now,
    completed_at: null,
    sort_order: maxSort.max_sort + 1,
  };

  const columns = Object.keys(task);
  const placeholders = columns.map(() => '?').join(', ');
  const values = columns.map(col => task[col]);

  db.prepare(
    `INSERT INTO tasks (${columns.join(', ')}) VALUES (${placeholders})`
  ).run(...values);

  // Log the creation
  db.prepare(
    'INSERT INTO activity_log (task_id, action, new_value) VALUES (?, ?, ?)'
  ).run(id, 'created', JSON.stringify(task));

  return getTaskById(id)!;
}

// ============================================
// UPDATE
// ============================================
export function updateTask(id: string, changes: Partial<Task>): Task {
  const db = getDb();
  const existing = getTaskById(id);
  if (!existing) throw new Error(`Task not found: ${id}`);

  // Prepare the changes
  const updates: Record<string, unknown> = { ...changes };
  updates.updated_at = new Date().toISOString();

  // Handle JSON fields
  if ('tags' in updates) {
    updates.tags = JSON.stringify(updates.tags);
  }
  if ('source_meta' in updates) {
    updates.source_meta = updates.source_meta ? JSON.stringify(updates.source_meta) : null;
  }

  // Track completion
  if (changes.status === 'done' && existing.status !== 'done') {
    updates.completed_at = new Date().toISOString();
  } else if (changes.status && changes.status !== 'done' && existing.completed_at) {
    updates.completed_at = null;
  }

  // Remove fields that shouldn't be updated directly
  delete updates.id;
  delete updates.created_at;

  const setClauses = Object.keys(updates).map(col => `${col} = ?`).join(', ');
  const values = Object.values(updates);

  db.prepare(`UPDATE tasks SET ${setClauses} WHERE id = ?`).run(...values, id);

  // Log the update
  db.prepare(
    'INSERT INTO activity_log (task_id, action, old_value, new_value) VALUES (?, ?, ?, ?)'
  ).run(id, 'updated', JSON.stringify(existing), JSON.stringify(updates));

  return getTaskById(id)!;
}

// ============================================
// DELETE
// ============================================
export function deleteTask(id: string): void {
  const db = getDb();
  const existing = getTaskById(id);
  if (!existing) return;

  db.prepare('DELETE FROM tasks WHERE id = ?').run(id);

  db.prepare(
    'INSERT INTO activity_log (task_id, action, old_value) VALUES (?, ?, ?)'
  ).run(id, 'deleted', JSON.stringify(existing));
}

// ============================================
// REORDER (for Kanban drag-and-drop)
// ============================================
export function reorderTask(id: string, newStatus: string, newSortOrder: number): void {
  const db = getDb();
  const now = new Date().toISOString();

  const existing = getTaskById(id);
  if (!existing) return;

  const updates: Record<string, unknown> = {
    status: newStatus,
    sort_order: newSortOrder,
    updated_at: now,
  };

  // Track status change
  if (newStatus === 'done' && existing.status !== 'done') {
    updates.completed_at = now;
  } else if (newStatus !== 'done' && existing.completed_at) {
    updates.completed_at = null;
  }

  db.prepare(
    'UPDATE tasks SET status = ?, sort_order = ?, updated_at = ?, completed_at = ? WHERE id = ?'
  ).run(updates.status, updates.sort_order, updates.updated_at, updates.completed_at ?? null, id);

  if (existing.status !== newStatus) {
    db.prepare(
      'INSERT INTO activity_log (task_id, action, old_value, new_value) VALUES (?, ?, ?, ?)'
    ).run(id, 'moved', JSON.stringify({ status: existing.status }), JSON.stringify({ status: newStatus }));
  }
}

// ============================================
// BATCH STATUS UPDATE
// ============================================
export function batchUpdateStatus(ids: string[], status: string): void {
  const db = getDb();
  const now = new Date().toISOString();
  const completedAt = status === 'done' ? now : null;

  const updateStmt = db.prepare(
    'UPDATE tasks SET status = ?, updated_at = ?, completed_at = ? WHERE id = ?'
  );

  const transaction = db.transaction(() => {
    for (const id of ids) {
      updateStmt.run(status, now, completedAt, id);
    }
  });

  transaction();
}
