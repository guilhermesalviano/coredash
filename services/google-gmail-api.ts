import { getResolvedRuntimeSettings } from '@/features/settings/server/runtime-settings';
import { GmailMessage } from '@/types/gmail';
import { auth as googleAuth, gmail as createGmail, type gmail_v1 } from '@googleapis/gmail';
import { globalSingleton } from '@/lib/global-singleton';

function getHeader(headers: { name: string; value: string }[], name: string): string {
  return headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? '';
}

function normalizeDate(raw: string, timezone: string): string {
  const date = new Date(raw);
  if (isNaN(date.getTime())) return raw;
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date).replace(' ', 'T');
}

function extractHtmlBody(payload: {
  mimeType?: string | null;
  body?: { data?: string | null } | null;
  parts?: { mimeType?: string | null; body?: { data?: string | null } | null; parts?: unknown[] | null }[] | null;
}): string {
  const decode = (data: string) =>
    Buffer.from(data.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8');

  if (payload.mimeType === 'text/html' && payload.body?.data) return decode(payload.body.data);

  if (payload.parts) {
    for (const part of payload.parts as typeof payload[]) {
      const result = extractHtmlBody(part);
      if (result) return result;
    }
  }

  return '';
}

// One client per credential set. Reusing it keeps the OAuth access token between
// requests instead of exchanging the refresh token on every call.
const gmailClients = globalSingleton('gmailClients', () => new Map<string, gmail_v1.Gmail>());

async function createGmailClient() {
  const settings = await getResolvedRuntimeSettings();
  const key = [settings.gmailClientId, settings.gmailClientSecret, settings.gmailRefreshToken].join('\n');

  let gmail = gmailClients.get(key);
  if (!gmail) {
    const auth = new googleAuth.OAuth2(settings.gmailClientId, settings.gmailClientSecret);
    auth.setCredentials({ refresh_token: settings.gmailRefreshToken });
    gmail = createGmail({ version: 'v1', auth });
    // Credentials changed in Settings: the previous client is no longer needed.
    gmailClients.clear();
    gmailClients.set(key, gmail);
  }

  return { gmail, timezone: settings.timezone };
}

export async function markGmailMessageAsRead(id: string): Promise<void> {
  const { gmail } = await createGmailClient();

  await gmail.users.messages.modify({
    userId: 'me',
    id,
    requestBody: { removeLabelIds: ['UNREAD'] },
  });
}

export async function resolveRecentGmailMessageId(positionOrId: string): Promise<string | null> {
  if (!/^\d+$/.test(positionOrId)) return positionOrId;

  const position = Number(positionOrId);
  if (!Number.isInteger(position) || position < 1) return null;

  const { gmail } = await createGmailClient();

  const listRes = await gmail.users.messages.list({
    userId: 'me',
    maxResults: position,
    labelIds: ['INBOX'],
  });

  const messages = listRes.data.messages ?? [];
  return messages[position - 1]?.id ?? null;
}

export async function fetchGmailMessage(id: string): Promise<GmailMessage> {
  const { gmail, timezone } = await createGmailClient();

  const detail = await gmail.users.messages.get({
    userId: 'me',
    id,
    format: 'full',
  });

  const headers = (detail.data.payload?.headers ?? []) as { name: string; value: string }[];
  const labelIds = detail.data.labelIds ?? [];

  return {
    id: detail.data.id!,
    threadId: detail.data.threadId!,
    snippet: detail.data.snippet ?? '',
    from: getHeader(headers, 'From').replace('\u003C', '- ').replace('\u003E', '').trim(),
    subject: getHeader(headers, 'Subject'),
    date: normalizeDate(getHeader(headers, 'Date'), timezone),
    isUnread: labelIds.includes('UNREAD'),
    body: detail.data.payload ? extractHtmlBody(detail.data.payload) : '',
  };
}

export async function fetchGoogleGmailAPI(options: { pageToken?: string } = {}): Promise<{ emails: GmailMessage[]; nextPageToken?: string }> {
  const { gmail, timezone } = await createGmailClient();

  const listRes = await gmail.users.messages.list({
    userId: 'me',
    maxResults: 5,
    labelIds: ['INBOX'],
    pageToken: options.pageToken,
  });

  const messages = listRes.data.messages ?? [];
  const nextPageToken = listRes.data.nextPageToken ?? undefined;

  const emails: GmailMessage[] = await Promise.all(
    messages.map(async (msg) => {
      const detail = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id!,
        format: 'metadata',
        metadataHeaders: ['From', 'Subject', 'Date'],
      });

      const headers = (detail.data.payload?.headers ?? []) as { name: string; value: string }[];
      const labelIds = detail.data.labelIds ?? [];

      return {
        id: detail.data.id!,
        threadId: detail.data.threadId!,
        snippet: detail.data.snippet ?? '',
        from: getHeader(headers, 'From').replace("\u003C", '- ').replace("\u003E", '').trim(),
        subject: getHeader(headers, 'Subject'),
        date: normalizeDate(getHeader(headers, 'Date'), timezone),
        isUnread: labelIds.includes('UNREAD'),
      };
    }),
  );

  return { emails, nextPageToken };
}
