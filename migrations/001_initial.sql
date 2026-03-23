-- Core tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id              TEXT PRIMARY KEY,
    title           TEXT NOT NULL,
    description     TEXT,
    status          TEXT NOT NULL DEFAULT 'todo'
                    CHECK (status IN ('todo','in_progress','done','archived')),
    priority        INTEGER NOT NULL DEFAULT 2
                    CHECK (priority BETWEEN 0 AND 3),
    due_date        TEXT,
    due_time        TEXT,
    estimated_mins  INTEGER,
    category        TEXT,
    tags            TEXT DEFAULT '[]',

    source_connector TEXT DEFAULT 'manual',
    source_id       TEXT,
    source_meta     TEXT,

    recurrence_rule TEXT,
    recurrence_parent_id TEXT REFERENCES tasks(id) ON DELETE SET NULL,

    scheduled_date  TEXT,
    scheduled_slot  TEXT,

    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
    completed_at    TEXT,
    sort_order      REAL NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_scheduled ON tasks(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category);
CREATE INDEX IF NOT EXISTS idx_tasks_source ON tasks(source_connector, source_id);

-- Task templates
CREATE TABLE IF NOT EXISTS task_templates (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    template_data   TEXT NOT NULL,
    recurrence_rule TEXT,
    is_active       INTEGER DEFAULT 1,
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Connector sync state
CREATE TABLE IF NOT EXISTS connector_sync (
    connector_id    TEXT PRIMARY KEY,
    last_sync_at    TEXT,
    sync_token      TEXT,
    config          TEXT
);

-- Activity log for undo
CREATE TABLE IF NOT EXISTS activity_log (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id         TEXT,
    action          TEXT NOT NULL,
    old_value       TEXT,
    new_value       TEXT,
    timestamp       TEXT NOT NULL DEFAULT (datetime('now'))
);

-- User settings (key-value store)
CREATE TABLE IF NOT EXISTS settings (
    key             TEXT PRIMARY KEY,
    value           TEXT NOT NULL
);
