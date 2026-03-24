import { BrowserWindow } from 'electron';
import http from 'http';
import crypto from 'crypto';

const REDIRECT_PORT = 3847;
const REDIRECT_URI = `http://localhost:${REDIRECT_PORT}/auth/callback`;
const AUTH_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize';
const TOKEN_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
const SCOPES = ['Mail.Read', 'offline_access'];

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

/**
 * Launch browser-based OAuth PKCE flow.
 * Opens a BrowserWindow for Microsoft login,
 * captures the auth code via localhost redirect,
 * exchanges it for tokens.
 */
export async function authenticateOutlook(clientId: string): Promise<TokenResponse> {
  // Generate PKCE challenge
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url');

  const state = crypto.randomBytes(16).toString('hex');

  // Build auth URL
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    scope: SCOPES.join(' '),
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    prompt: 'select_account',
  });

  const authUrl = `${AUTH_URL}?${params.toString()}`;

  // Wait for auth code via local HTTP server
  const authCode = await captureAuthCode(authUrl, state);

  // Exchange code for tokens
  const tokenParams = new URLSearchParams({
    client_id: clientId,
    grant_type: 'authorization_code',
    code: authCode,
    redirect_uri: REDIRECT_URI,
    code_verifier: codeVerifier,
  });

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: tokenParams.toString(),
  });

  if (!response.ok) {
    throw new Error(`Token exchange failed: ${response.statusText}`);
  }

  return response.json() as Promise<TokenResponse>;
}

/**
 * Refresh an expired access token using the refresh token
 */
export async function refreshOutlookToken(
  clientId: string,
  refreshToken: string
): Promise<TokenResponse> {
  const params = new URLSearchParams({
    client_id: clientId,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    scope: SCOPES.join(' '),
  });

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!response.ok) {
    throw new Error(`Token refresh failed: ${response.statusText}`);
  }

  return response.json() as Promise<TokenResponse>;
}

function captureAuthCode(authUrl: string, expectedState: string): Promise<string> {
  return new Promise((resolve, reject) => {
    let authWindow: BrowserWindow | null = null;

    // Start local HTTP server to capture redirect
    const server = http.createServer((req, res) => {
      const url = new URL(req.url!, `http://localhost:${REDIRECT_PORT}`);

      if (url.pathname === '/auth/callback') {
        const code = url.searchParams.get('code');
        const state = url.searchParams.get('state');
        const error = url.searchParams.get('error');

        if (error) {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end('<h1>Authentication failed</h1><p>You can close this window.</p>');
          server.close();
          reject(new Error(`OAuth error: ${error}`));
          return;
        }

        if (state !== expectedState) {
          res.writeHead(400, { 'Content-Type': 'text/html' });
          res.end('<h1>State mismatch</h1>');
          server.close();
          reject(new Error('OAuth state mismatch'));
          return;
        }

        if (code) {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end('<h1>Authentication successful!</h1><p>You can close this window and return to TaskForge.</p>');
          server.close();
          authWindow?.close();
          resolve(code);
        }
      }
    });

    server.listen(REDIRECT_PORT);

    // Open browser window for login
    authWindow = new BrowserWindow({
      width: 500,
      height: 700,
      title: 'Sign in to Microsoft',
      webPreferences: { nodeIntegration: false, contextIsolation: true },
    });

    authWindow.loadURL(authUrl);

    authWindow.on('closed', () => {
      authWindow = null;
      server.close();
    });

    // Timeout after 5 minutes
    setTimeout(() => {
      server.close();
      authWindow?.close();
      reject(new Error('Authentication timed out'));
    }, 5 * 60 * 1000);
  });
}
