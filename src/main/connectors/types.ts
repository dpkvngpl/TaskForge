import type { ExternalItem, FetchOptions, Task } from '../../shared/types';

export interface TaskConnector {
  id: string;
  name: string;
  icon: string;

  // Lifecycle
  initialize(): Promise<void>;
  dispose(): Promise<void>;

  // Auth (optional)
  isAuthenticated(): boolean;
  authenticate(): Promise<void>;
  deauthenticate(): Promise<void>;

  // Data fetching
  fetchItems(options?: FetchOptions): Promise<ExternalItem[]>;
  getLastSyncTime(): Date | null;

  // Conversion
  toTask(item: ExternalItem): Partial<Task>;
}
