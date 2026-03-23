import type { TaskConnector } from './types';
import type { ExternalItem, FetchOptions } from '../../shared/types';

export class ConnectorManager {
  private connectors: Map<string, TaskConnector> = new Map();

  register(connector: TaskConnector): void {
    this.connectors.set(connector.id, connector);
    console.log(`Connector registered: ${connector.name}`);
  }

  unregister(id: string): void {
    this.connectors.delete(id);
  }

  get(id: string): TaskConnector | undefined {
    return this.connectors.get(id);
  }

  getAll(): TaskConnector[] {
    return Array.from(this.connectors.values());
  }

  async fetchFromAll(): Promise<ExternalItem[]> {
    const results: ExternalItem[] = [];
    for (const connector of this.connectors.values()) {
      if (connector.isAuthenticated()) {
        const items = await connector.fetchItems();
        results.push(...items);
      }
    }
    return results;
  }

  async fetchFrom(id: string, options?: FetchOptions): Promise<ExternalItem[]> {
    const connector = this.connectors.get(id);
    if (!connector) throw new Error(`Connector not found: ${id}`);
    if (!connector.isAuthenticated()) throw new Error(`Connector not authenticated: ${id}`);
    return connector.fetchItems(options);
  }
}
