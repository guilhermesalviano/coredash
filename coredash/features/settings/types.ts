import type { SetupFieldKey } from "@/features/settings/setup-fields";

export interface RuntimeSettings {
  timezone: string;
  latitude: string;
  longitude: string;
  city: string;
  calendarIds: string[];
  googleClientEmail: string;
  gmailClientId: string;
  spotifyClientId: string;
}

export type RuntimeSettingSource = "database" | "environment";

export interface RuntimeSettingsSources {
  timezone: RuntimeSettingSource;
  latitude: RuntimeSettingSource;
  longitude: RuntimeSettingSource;
  city: RuntimeSettingSource;
  calendarIds: RuntimeSettingSource;
  googleClientEmail: RuntimeSettingSource;
  gmailClientId: RuntimeSettingSource;
  spotifyClientId: RuntimeSettingSource;
}

export type SecretFieldKey = Extract<SetupFieldKey,
  | "newsApiKey"
  | "serpApiKey"
  | "brapiToken"
  | "googlePrivateKey"
  | "gmailClientSecret"
  | "gmailRefreshToken"
  | "spotifyClientSecret"
  | "spotifyRefreshToken"
>;

export type SecretConfiguration = Record<SecretFieldKey, boolean>;

export interface RuntimeSettingsResponse {
  settings: RuntimeSettings;
  sources: RuntimeSettingsSources;
  secrets: SecretConfiguration;
  setupRequired: boolean;
}

export interface RuntimeSettingsPatch {
  timezone?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  city?: string | null;
  calendarIds?: string[] | null;
  googleClientEmail?: string | null;
  gmailClientId?: string | null;
  spotifyClientId?: string | null;
  newsApiKey?: string | null;
  serpApiKey?: string | null;
  brapiToken?: string | null;
  googlePrivateKey?: string | null;
  gmailClientSecret?: string | null;
  gmailRefreshToken?: string | null;
  spotifyClientSecret?: string | null;
  spotifyRefreshToken?: string | null;
}
