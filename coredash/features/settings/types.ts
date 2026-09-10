export interface RuntimeSettings {
  timezone: string;
  latitude: string;
  longitude: string;
  cronSchedule: string;
  aiModel: string;
  calendarIds: string[];
}

export type RuntimeSettingSource = "database" | "environment";

export interface RuntimeSettingsSources {
  timezone: RuntimeSettingSource;
  latitude: RuntimeSettingSource;
  longitude: RuntimeSettingSource;
  cronSchedule: RuntimeSettingSource;
  aiModel: RuntimeSettingSource;
  calendarIds: RuntimeSettingSource;
}

export interface RuntimeSettingsResponse {
  settings: RuntimeSettings;
  sources: RuntimeSettingsSources;
}

export interface RuntimeSettingsPatch {
  timezone?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  cronSchedule?: string | null;
  aiModel?: string | null;
  calendarIds?: string[] | null;
}
