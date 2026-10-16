export interface GmailMessage {
  id: string;
  threadId: string;
  snippet: string;
  from: string;
  subject: string;
  date: string;
  isUnread: boolean;
  body?: string;
}

export interface GmailInternalAPIResponse {
  emails: GmailMessage[];
  nextPageToken?: string;
}
