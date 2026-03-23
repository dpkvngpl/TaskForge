import type { TaskConnector } from './types';
import type { ExternalItem, FetchOptions, Task } from '../../shared/types';

/**
 * Stub connector for manual task entry.
 * This exists so the connector manager always has at least one registered connector.
 * Manual tasks bypass the connector flow entirely — they go straight to the DB.
 */
export class ManualEntryConnector implements TaskConnector {
  id = 'manual';
  name = 'Manual Entry';
  icon = '✏️';

  async initialize(): Promise<void> { /* no-op */ }
  async dispose(): Promise<void> { /* no-op */ }

  isAuthenticated(): boolean { return true; }
  async authenticate(): Promise<void> { /* no-op */ }
  async deauthenticate(): Promise<void> { /* no-op */ }

  async fetchItems(_options?: FetchOptions): Promise<ExternalItem[]> {
    return []; // Manual entry has no external items to fetch
  }

  getLastSyncTime(): Date | null { return null; }

  toTask(item: ExternalItem): Partial<Task> {
    return {
      title: item.title,
      description: item.body ?? null,
      source_connector: 'manual',
      source_id: item.externalId,
    };
  }
}
