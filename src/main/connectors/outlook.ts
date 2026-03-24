import type { TaskConnector } from './types';
import type { ExternalItem, FetchOptions, Task } from '../../shared/types';
import { authenticateOutlook, refreshOutlookToken } from './outlook-auth';
import { getSetting, setSetting } from '../database/settings';
import { getDb } from '../database/index';

const GRAPH_BASE = 'https://graph.microsoft.com/v1.0';

export class OutlookConnector implements TaskConnector {
  id = 'outlook';
  name = 'Outlook Email';
  icon = '📧';

  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiry: Date | null = null;
  private clientId: string | null = null;

  async initialize(): Promise<void> {
    // Load saved tokens from settings
    this.clientId = getSetting('outlook_client_id');
    this.refreshToken = getSetting('outlook_refresh_token');
    const expiryStr = getSetting('outlook_token_expiry');
    if (expiryStr) this.tokenExpiry = new Date(expiryStr);
  }

  async dispose(): Promise<void> {
    this.accessToken = null;
  }

  isAuthenticated(): boolean {
    return this.refreshToken !== null && this.clientId !== null;
  }

  async authenticate(): Promise<void> {
    if (!this.clientId) {
      this.clientId = getSetting('outlook_client_id');
    }
    if (!this.clientId) {
      throw new Error('Outlook client ID not configured. Set it in Settings → Connections.');
    }

    const tokens = await authenticateOutlook(this.clientId);
    this.accessToken = tokens.access_token;
    this.refreshToken = tokens.refresh_token;
    this.tokenExpiry = new Date(Date.now() + tokens.expires_in * 1000);

    // Persist refresh token (access token is ephemeral)
    setSetting('outlook_refresh_token', tokens.refresh_token);
    setSetting('outlook_token_expiry', this.tokenExpiry.toISOString());
  }

  async deauthenticate(): Promise<void> {
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;

    const db = getDb();
    db.prepare("DELETE FROM settings WHERE key LIKE 'outlook_%'").run();
    db.prepare("DELETE FROM connector_sync WHERE connector_id = 'outlook'").run();
  }

  private async ensureValidToken(): Promise<string> {
    if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return this.accessToken;
    }

    if (!this.refreshToken || !this.clientId) {
      throw new Error('Not authenticated');
    }

    const tokens = await refreshOutlookToken(this.clientId, this.refreshToken);
    this.accessToken = tokens.access_token;
    this.refreshToken = tokens.refresh_token;
    this.tokenExpiry = new Date(Date.now() + tokens.expires_in * 1000);

    setSetting('outlook_refresh_token', tokens.refresh_token);
    setSetting('outlook_token_expiry', this.tokenExpiry.toISOString());

    return this.accessToken;
  }

  async fetchItems(options?: FetchOptions): Promise<ExternalItem[]> {
    const token = await this.ensureValidToken();

    let url = `${GRAPH_BASE}/me/messages?$top=${options?.limit || 25}&$orderby=receivedDateTime desc&$select=id,subject,from,receivedDateTime,bodyPreview`;

    if (options?.folder) {
      url = `${GRAPH_BASE}/me/mailFolders/${options.folder}/messages?$top=${options?.limit || 25}&$orderby=receivedDateTime desc&$select=id,subject,from,receivedDateTime,bodyPreview`;
    }

    if (options?.query) {
      url += `&$search="${options.query}"`;
    }

    // Delta sync support
    const db = getDb();
    const syncState = db.prepare(
      "SELECT sync_token FROM connector_sync WHERE connector_id = 'outlook'"
    ).get() as { sync_token: string } | undefined;

    if (syncState?.sync_token && options?.since) {
      url = syncState.sync_token; // Use delta link for incremental fetch
    }

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error(`Graph API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as {
      value: Array<{
        id: string;
        subject: string;
        from: { emailAddress: { name: string; address: string } };
        receivedDateTime: string;
        bodyPreview: string;
      }>;
      '@odata.deltaLink'?: string;
      '@odata.nextLink'?: string;
    };

    // Save delta link for next incremental fetch
    if (data['@odata.deltaLink']) {
      db.prepare(
        "INSERT OR REPLACE INTO connector_sync (connector_id, last_sync_at, sync_token) VALUES ('outlook', ?, ?)"
      ).run(new Date().toISOString(), data['@odata.deltaLink']);
    }

    return data.value.map(msg => ({
      externalId: msg.id,
      source: 'outlook',
      title: msg.subject || '(No subject)',
      body: msg.bodyPreview,
      date: msg.receivedDateTime,
      sender: `${msg.from.emailAddress.name} <${msg.from.emailAddress.address}>`,
      metadata: {
        from_name: msg.from.emailAddress.name,
        from_email: msg.from.emailAddress.address,
      },
    }));
  }

  getLastSyncTime(): Date | null {
    const db = getDb();
    const row = db.prepare(
      "SELECT last_sync_at FROM connector_sync WHERE connector_id = 'outlook'"
    ).get() as { last_sync_at: string } | undefined;
    return row ? new Date(row.last_sync_at) : null;
  }

  toTask(item: ExternalItem): Partial<Task> {
    return {
      title: item.title,
      description: item.body || null,
      source_connector: 'outlook',
      source_id: item.externalId,
      source_meta: {
        sender: item.sender,
        received_date: item.date,
        ...(item.metadata || {}),
      },
      category: null, // User sets category after conversion
      priority: 2,    // Default medium
    };
  }
}
