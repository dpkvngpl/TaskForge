# Outlook Integration Setup

## Azure AD App Registration

1. Go to [Azure Portal](https://portal.azure.com) → **App Registrations** → **New Registration**
2. Name: **TaskForge Local**
3. Supported account types: **Accounts in any organizational directory and personal Microsoft accounts**
4. Redirect URI: Add platform **Mobile and desktop** → `http://localhost:3847/auth/callback`
5. API Permissions: Add **Mail.Read** (delegated) — only allows reading, not sending
6. **No client secret needed** (public client / PKCE flow)
7. Copy the **Application (client) ID** — this goes in TaskForge Settings → Connections → Outlook Client ID

## How it works

- TaskForge uses OAuth 2.0 PKCE (Proof Key for Code Exchange) flow
- A browser window opens for Microsoft login
- After login, the auth code is captured via a local HTTP server on port 3847
- Tokens are exchanged and stored locally in the SQLite database
- Only `Mail.Read` scope is requested — TaskForge can read emails but never send them
- All data stays local — emails are only fetched when you click "Sync"
