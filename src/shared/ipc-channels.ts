// All IPC channel names as constants to prevent typos
export const IPC = {
  // Tasks
  TASKS_GET_ALL: 'tasks:getAll',
  TASKS_GET_BY_ID: 'tasks:getById',
  TASKS_CREATE: 'tasks:create',
  TASKS_UPDATE: 'tasks:update',
  TASKS_DELETE: 'tasks:delete',
  TASKS_REORDER: 'tasks:reorder',
  TASKS_BATCH_UPDATE_STATUS: 'tasks:batchUpdateStatus',

  // Templates
  TEMPLATES_GET_ALL: 'templates:getAll',
  TEMPLATES_CREATE: 'templates:create',
  TEMPLATES_DELETE: 'templates:delete',
  TEMPLATES_CREATE_TASK: 'templates:createTask',

  // Settings
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',
  SETTINGS_GET_ALL: 'settings:getAll',

  // Activity Log
  ACTIVITY_LOG_GET_RECENT: 'activityLog:getRecent',
  ACTIVITY_LOG_UNDO: 'activityLog:undo',

  // App
  APP_VERSION: 'app:version',
  APP_DATA_PATH: 'app:data-path',
  APP_MINIMIZE: 'app:minimize',
  APP_QUIT: 'app:quit',

  // Events (main → renderer)
  TRIGGER_QUICK_ADD: 'trigger:quick-add',
  TASK_REMINDER: 'task:reminder',
} as const;
