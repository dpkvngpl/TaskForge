import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { format, parseISO } from 'date-fns';

interface EmailItem {
  externalId: string;
  title: string;
  body?: string;
  date?: string;
  sender?: string;
}

export function OutlookPanel() {
  const [emails, setEmails] = useState<EmailItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [lastSync, setLastSync] = useState<string | null>(null);

  const handleSync = async () => {
    setLoading(true);
    try {
      const options: Record<string, unknown> = { limit: 25 };
      if (search) options.query = search;
      const items = await window.taskforge.connectors.fetch('outlook', options);
      setEmails(items as EmailItem[]);
      setLastSync(new Date().toISOString());
    } catch (err) {
      console.error('Sync failed:', err);
    }
    setLoading(false);
  };

  const handleCreateTask = async (email: EmailItem) => {
    try {
      await window.taskforge.connectors.convertToTask('outlook', email as Record<string, unknown>);
    } catch (err) {
      console.error('Failed to create task:', err);
    }
  };

  const handleDisconnect = async () => {
    await window.taskforge.connectors.deauthenticate('outlook');
    setEmails([]);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-[rgba(255,255,255,0.06)]">
        <div>
          <h2 className="text-sm font-semibold text-[#e2e2e6]">Outlook Inbox</h2>
          {lastSync && <p className="text-[10px] text-[#6b7280]">Last synced: {format(parseISO(lastSync), 'h:mm a')}</p>}
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handleSync} disabled={loading}>
            {loading ? 'Syncing...' : 'Sync'}
          </Button>
          <Button size="sm" variant="outline" onClick={handleDisconnect}>Disconnect</Button>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 py-2 border-b border-[rgba(255,255,255,0.06)]">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSync()}
          placeholder="Search emails..."
          className="h-8 text-xs"
        />
      </div>

      {/* Email list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {emails.length === 0 && !loading && (
          <div className="text-center text-[#6b7280] text-sm py-8">
            Click "Sync" to fetch emails from Outlook
          </div>
        )}
        {emails.map((email) => (
          <div key={email.externalId} className="p-3 rounded-[8px] bg-[#1a1d27] border border-[rgba(255,255,255,0.06)]">
            <div className="flex items-start justify-between">
              <span className="text-xs text-[#a5a5af]">{email.sender?.split('<')[0]?.trim()}</span>
              {email.date && <span className="text-[10px] text-[#6b7280]">{format(parseISO(email.date), 'MMM d, h:mm a')}</span>}
            </div>
            <h3 className="text-sm font-medium text-[#e2e2e6] mt-1">{email.title}</h3>
            {email.body && <p className="text-xs text-[#6b7280] mt-1 line-clamp-2">{email.body}</p>}
            <div className="flex justify-end mt-2">
              <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => handleCreateTask(email)}>
                → Create task
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
