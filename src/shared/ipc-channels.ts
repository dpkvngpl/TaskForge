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

  // Notifications
  NOTIFICATIONS_GET_OVERDUE_COUNT: 'notifications:getOverdueCount',

  // Recurrence
  RECURRENCE_PROCESS: 'recurrence:process',
  RECURRENCE_BUILD_RRULE: 'recurrence:buildRRule',
  RECURRENCE_DESCRIBE: 'recurrence:describe',
  RECURRENCE_GET_NEXT_DATES: 'recurrence:getNextDates',

  // Templates (additional)
  TEMPLATES_UPDATE: 'templates:update',

  // Connectors
  CONNECTOR_LIST: 'connector:list',
  CONNECTOR_AUTHENTICATE: 'connector:authenticate',
  CONNECTOR_DEAUTHENTICATE: 'connector:deauthenticate',
  CONNECTOR_FETCH: 'connector:fetch',
  CONNECTOR_CONVERT_TO_TASK: 'connector:convertToTask',

  // Events (main → renderer)
  TRIGGER_QUICK_ADD: 'trigger:quick-add',
  TASK_REMINDER: 'task:reminder',
} as const;
