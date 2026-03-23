import React, { useMemo } from 'react';
import { useTaskStore } from '@/stores/task-store';
import { useViewStore } from '@/stores/view-store';
import { PRIORITY_COLORS, PRIORITY_LABELS } from '@shared/constants';
import { CategoryChip } from '@/components/CategoryChip';
import { TaskForm } from '@/components/TaskForm';
import { format, addDays, parseISO } from 'date-fns';
import type { Task } from '@shared/types';

// Parse RRULE to human-readable text (simplified)
function describeRule(rule: string | null): string {
  if (!rule) return 'No recurrence';
  if (rule.includes('WEEKLY') && rule.includes('FR')) return 'Every Friday evening';
  if (rule.includes('DAILY') && rule.includes('BYDAY=MO,TU,WE,TH,FR')) return 'Every weekday morning';
  if (rule.includes('WEEKLY') && rule.includes('MO') && rule.includes('TH')) return 'Every Monday and Thursday';
  if (rule.includes('WEEKLY') && rule.includes('WE')) return 'Every Wednesday afternoon';
  if (rule.includes('WEEKLY')) return 'Weekly';
  if (rule.includes('DAILY')) return 'Daily';
  if (rule.includes('MONTHLY')) return 'Monthly';
  return rule;
}

// Get active days from RRULE
function getActiveDays(rule: string | null): boolean[] {
  const days = [false, false, false, false, false, false, false]; // M T W T F S S
  if (!rule) return days;
  const dayMap: Record<string, number> = { MO: 0, TU: 1, WE: 2, TH: 3, FR: 4, SA: 5, SU: 6 };
  for (const [code, idx] of Object.entries(dayMap)) {
    if (rule.includes(code)) days[idx] = true;
  }
  // If no specific days, mark all
  if (days.every((d) => !d)) days.fill(true);
  return days;
}

const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function RecurringTaskCard({ task }: { task: Task }) {
  const activeDays = getActiveDays(task.recurrence_rule);
  const isActive = task.status !== 'archived';
  const { updateTask } = useTaskStore();

  const handleToggle = async () => {
    await updateTask(task.id, { status: isActive ? 'archived' : 'todo' });
  };

  return (
    <div className={`p-4 rounded-xl bg-[#1e1e35] border border-white/5 ${!isActive ? 'opacity-50' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-100">{task.title}</h3>
          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m17 2 4 4-4 4" /><path d="M3 11v-1a4 4 0 0 1 4-4h14" /><path d="m7 22-4-4 4-4" /><path d="M21 13v1a4 4 0 0 1-4 4H3" />
            </svg>
            {describeRule(task.recurrence_rule)}
            {!isActive && <span className="text-gray-600 ml-1">— paused</span>}
          </p>
        </div>
        {/* Toggle */}
        <div
          onClick={handleToggle}
          className={`w-10 h-5 rounded-full flex items-center px-0.5 cursor-pointer transition-colors ${isActive ? 'bg-indigo-600' : 'bg-gray-600'}`}
        >
          <div className={`w-4 h-4 rounded-full bg-white transition-transform ${isActive ? 'translate-x-5' : 'translate-x-0'}`} />
        </div>
      </div>
      <div className="flex items-center gap-2 mt-3">
        <CategoryChip category={task.category} />
        {task.priority > 0 && (
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded border" style={{
            backgroundColor: `${PRIORITY_COLORS[task.priority]}15`,
            color: PRIORITY_COLORS[task.priority],
            borderColor: `${PRIORITY_COLORS[task.priority]}30`,
          }}>
            {PRIORITY_LABELS[task.priority]}
          </span>
        )}
        <span className="text-[10px] text-gray-500 ml-auto">
          Next: {task.due_date ? format(parseISO(task.due_date), 'EEE d MMM') : 'N/A'}
        </span>
      </div>
      {/* Day dots */}
      <div className="flex gap-1.5 mt-3">
        {dayLabels.map((label, i) => (
          <span
            key={i}
            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium ${
              activeDays[i] ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/30' : 'bg-white/5 text-gray-600'
            }`}
          >{label}</span>
        ))}
      </div>
    </div>
  );
}

function TemplateCard({ task }: { task: Task }) {
  const { createTask } = useTaskStore();

  const handleUseTemplate = async () => {
    await createTask({
      title: task.title,
      description: task.description,
      priority: task.priority,
      category: task.category,
      tags: [...task.tags],
      estimated_mins: task.estimated_mins,
      scheduled_slot: task.scheduled_slot,
    });
  };

  return (
    <div className="p-4 rounded-xl bg-[#1e1e35] border border-white/5">
      <h3 className="text-sm font-semibold text-gray-100">{task.title}</h3>
      {task.description && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{task.description}</p>}
      <div className="flex items-center gap-2 mt-3">
        {task.priority > 0 && (
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded border" style={{
            backgroundColor: `${PRIORITY_COLORS[task.priority]}15`,
            color: PRIORITY_COLORS[task.priority],
            borderColor: `${PRIORITY_COLORS[task.priority]}30`,
          }}>
            {PRIORITY_LABELS[task.priority]}
          </span>
        )}
        <CategoryChip category={task.category} />
        <button onClick={handleUseTemplate} className="text-[10px] text-indigo-400 hover:text-indigo-300 ml-auto">
          Use template
        </button>
      </div>
    </div>
  );
}

export function RecurringView() {
  const tasks = useTaskStore((s) => s.tasks);

  // Recurring = tasks with recurrence_rule set
  const recurringTasks = useMemo(
    () => tasks.filter((t) => t.recurrence_rule && t.status !== 'archived'),
    [tasks]
  );

  // "Templates" = for now, show tasks that could serve as templates (have category + estimated time)
  // In Phase 2 this will use the actual task_templates table
  const templateTasks = useMemo(
    () => tasks.filter((t) => t.category && t.estimated_mins && !t.recurrence_rule && t.status !== 'done' && t.status !== 'archived').slice(0, 5),
    [tasks]
  );

  const activePaused = useMemo(() => {
    const active = recurringTasks.filter((t) => t.status !== 'archived').length;
    const paused = recurringTasks.filter((t) => t.status === 'archived').length;
    return { active, paused };
  }, [recurringTasks]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-white/5">
        <span className="text-lg font-bold"><span className="text-indigo-400">Task</span><span className="text-white">Forge</span></span>
        <button
          onClick={() => useViewStore.getState().openTaskForm()}
          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-500 flex items-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14" /><path d="M5 12h14" /></svg>
          New recurring task
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="flex gap-6 p-6">
          {/* Left: Recurring tasks */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Active Recurring Tasks</h2>
              <span className="text-xs text-gray-500 bg-white/5 rounded-full px-2 py-0.5">{recurringTasks.length}</span>
            </div>
            <div className="space-y-3">
              {recurringTasks.length === 0 && (
                <div className="p-6 rounded-xl bg-[#1e1e35] border border-white/5 text-center text-gray-500 text-sm">
                  No recurring tasks yet. Create one to automate your workflow.
                </div>
              )}
              {recurringTasks.map((task) => (
                <RecurringTaskCard key={task.id} task={task} />
              ))}
            </div>
          </div>

          {/* Right: Templates */}
          <div className="w-80 shrink-0">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Templates</h2>
              <span className="text-xs text-gray-500 bg-white/5 rounded-full px-2 py-0.5">{templateTasks.length}</span>
            </div>
            <div className="space-y-3">
              {templateTasks.length === 0 && (
                <div className="p-6 rounded-xl bg-[#1e1e35] border border-white/5 text-center text-gray-500 text-sm">
                  Templates will appear here for quick task creation.
                </div>
              )}
              {templateTasks.map((task) => (
                <TemplateCard key={task.id} task={task} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="px-4 py-2 border-t border-white/5 text-xs text-gray-500">
        {activePaused.active} active rules · {activePaused.paused} paused
      </div>

      <TaskForm />
    </div>
  );
}
