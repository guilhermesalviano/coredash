import { GOOGLE, LOCATION } from '@/config/config';
import { GmailMessage } from '@/types/gmail';
import { google } from 'googleapis';

function getHeader(headers: { name: string; value: string }[], name: string): string {
  return headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? '';
}

function normalizeDate(raw: string): string {
  const date = new Date(raw);
  if (isNaN(date.getTime())) return raw;
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: LOCATION.timezone,
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

export async function markGmailMessageAsRead(id: string): Promise<void> {
  const auth = new google.auth.OAuth2(
    GOOGLE.gmailClientId,
    GOOGLE.gmailClientSecret,
  );

  auth.setCredentials({ refresh_token: GOOGLE.gmailRefreshToken });

  const gmail = google.gmail({ version: 'v1', auth });

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

  const auth = new google.auth.OAuth2(
    GOOGLE.gmailClientId,
    GOOGLE.gmailClientSecret,
  );

  auth.setCredentials({ refresh_token: GOOGLE.gmailRefreshToken });

  const gmail = google.gmail({ version: 'v1', auth });

  const listRes = await gmail.users.messages.list({
    userId: 'me',
    maxResults: position,
    labelIds: ['INBOX'],
  });

  const messages = listRes.data.messages ?? [];
  return messages[position - 1]?.id ?? null;
}

export async function fetchGmailMessage(id: string): Promise<GmailMessage> {
  const auth = new google.auth.OAuth2(
    GOOGLE.gmailClientId,
    GOOGLE.gmailClientSecret,
  );

  auth.setCredentials({ refresh_token: GOOGLE.gmailRefreshToken });

  const gmail = google.gmail({ version: 'v1', auth });

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
    date: normalizeDate(getHeader(headers, 'Date')),
    isUnread: labelIds.includes('UNREAD'),
    body: detail.data.payload ? extractHtmlBody(detail.data.payload) : '',
  };
}

export async function fetchGoogleGmailAPI(options: { pageToken?: string } = {}): Promise<{ emails: GmailMessage[]; nextPageToken?: string }> {
  const auth = new google.auth.OAuth2(
    GOOGLE.gmailClientId,
    GOOGLE.gmailClientSecret,
  );

  auth.setCredentials({ refresh_token: GOOGLE.gmailRefreshToken });

  const gmail = google.gmail({ version: 'v1', auth });

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
        date: normalizeDate(getHeader(headers, 'Date')),
        isUnread: labelIds.includes('UNREAD'),
      };
    }),
  );

  return { emails, nextPageToken };
}
