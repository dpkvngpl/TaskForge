import { v4 as uuidv4 } from 'uuid';
import { getDb } from './index';
import { createTask } from './tasks';
import type { TaskTemplate, NewTask, Task } from '../../shared/types';

export function getAllTemplates(): TaskTemplate[] {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM task_templates ORDER BY created_at DESC').all() as Record<string, unknown>[];
  return rows.map(row => ({
    ...row,
    template_data: JSON.parse(row.template_data as string),
    is_active: Boolean(row.is_active),
  })) as TaskTemplate[];
}

export function getTemplateById(id: string): TaskTemplate | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM task_templates WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  if (!row) return null;
  return {
    ...row,
    template_data: JSON.parse(row.template_data as string),
    is_active: Boolean(row.is_active),
  } as TaskTemplate;
}

export function createTemplate(input: {
  name: string;
  template_data: NewTask;
  recurrence_rule?: string | null;
  is_active?: boolean;
}): TaskTemplate {
  const db = getDb();
  const id = uuidv4();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO task_templates (id, name, template_data, recurrence_rule, is_active, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    id,
    input.name,
    JSON.stringify(input.template_data),
    input.recurrence_rule ?? null,
    input.is_active !== false ? 1 : 0,
    now
  );

  return getTemplateById(id)!;
}

export function updateTemplate(id: string, changes: Partial<{
  name: string;
  template_data: NewTask;
  recurrence_rule: string | null;
  is_active: boolean;
}>): TaskTemplate {
  const db = getDb();
  const updates: Record<string, unknown> = {};

  if (changes.name !== undefined) updates.name = changes.name;
  if (changes.template_data !== undefined) updates.template_data = JSON.stringify(changes.template_data);
  if (changes.recurrence_rule !== undefined) updates.recurrence_rule = changes.recurrence_rule;
  if (changes.is_active !== undefined) updates.is_active = changes.is_active ? 1 : 0;

  if (Object.keys(updates).length > 0) {
    const setClauses = Object.keys(updates).map(k => `${k} = ?`).join(', ');
    db.prepare(`UPDATE task_templates SET ${setClauses} WHERE id = ?`)
      .run(...Object.values(updates), id);
  }

  return getTemplateById(id)!;
}

export function deleteTemplate(id: string): void {
  const db = getDb();
  db.prepare('DELETE FROM task_templates WHERE id = ?').run(id);
}

export function createTaskFromTemplate(templateId: string): Task {
  const template = getTemplateById(templateId);
  if (!template) throw new Error(`Template not found: ${templateId}`);

  const newTask: NewTask = {
    ...template.template_data,
    source_connector: 'template',
    source_id: templateId,
  };

  return createTask(newTask);
}
