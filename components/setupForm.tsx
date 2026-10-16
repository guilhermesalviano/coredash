"use client";

import { useEffect, useState } from "react";
import {
  CalendarRange,
  Check,
  LoaderCircle,
  Lock,
  MapPin,
  RotateCcw,
  Save,
  TriangleAlert,
} from "lucide-react";
import { fetchJson } from "@/lib/api-client";
import {
  SETUP_FIELDS,
  SETUP_GROUPS,
  validateSetupLocation,
  type SetupFieldKey,
  type SetupGroupId,
} from "@/features/settings/setup-fields";
import type { RuntimeSettings, RuntimeSettingsResponse, SecretFieldKey } from "@/features/settings/types";
import styles from "./settings.module.css";

type Draft = Record<SetupFieldKey, string>;

const PUBLIC_KEYS = SETUP_FIELDS.filter((field) => !field.secret).map((field) => field.key);

const GROUP_ICONS: Record<SetupGroupId, typeof MapPin> = {
  timezone: CalendarRange,
  location: MapPin,
  news: Lock,
  stocks: Lock,
  calendar: Lock,
  gmail: Lock,
};

function browserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

function emptyDraft(): Draft {
  return Object.fromEntries(SETUP_FIELDS.map((field) => [field.key, ""])) as Draft;
}

function toDraft(response: RuntimeSettingsResponse): Draft {
  const draft = emptyDraft();
  for (const field of SETUP_FIELDS) {
    if (field.secret) continue;
    if (field.key === "calendarIds") {
      draft.calendarIds = response.settings.calendarIds.join("\n");
      continue;
    }
    const value = response.settings[field.key as keyof RuntimeSettings];
    draft[field.key] = typeof value === "string" ? value : "";
  }
  if (!draft.timezone.trim()) {
    draft.timezone = browserTimezone();
  }
  return draft;
}

function calendarIdsFromText(value: string): string[] {
  return [...new Set(value.split(/[;\n]/).map((item) => item.trim()).filter(Boolean))];
}

function sameList(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((item, index) => item === right[index]);
}

export function payloadFromDraft(
  draft: Draft,
  original: RuntimeSettings,
  forceCoreFields = false,
): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  for (const field of SETUP_FIELDS) {
    if (field.secret) {
      const value = draft[field.key].trim();
      if (value) body[field.key] = value;
      continue;
    }
    if (field.key === "calendarIds") {
      const next = calendarIdsFromText(draft.calendarIds);
      if (!sameList(next, original.calendarIds)) body.calendarIds = next;
      continue;
    }
    const key = field.key as keyof RuntimeSettings;
    const current = original[key];
    const isCoreField =
      field.key === "timezone" ||
      field.key === "latitude" ||
      field.key === "longitude" ||
      field.key === "city";
    if (typeof current === "string" && (draft[field.key] !== current || (forceCoreFields && isCoreField))) {
      body[field.key] = draft[field.key];
    }
  }
  return body;
}

function locationErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "code" in error) {
    const geoError = error as GeolocationPositionError;
    if (geoError.code === 1) return "Location permission denied.";
    if (geoError.code === 2) return "Location is disabled or unavailable.";
    if (geoError.code === 3) return "Timed out while retrieving your location.";
  }
  return "Could not retrieve your location.";
}

export default function SetupForm({
  presentation = "panel",
  onSaved,
}: {
  presentation?: "panel" | "screen";
  onSaved?: () => void;
}) {
  const [data, setData] = useState<RuntimeSettingsResponse | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locationMessage, setLocationMessage] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      try {
        const response = await fetchJson<RuntimeSettingsResponse>("/api/settings", { signal: controller.signal });
        if (controller.signal.aborted) return;
        setData(response);
        setDraft(toDraft(response));
        setLoadError(null);
      } catch (reason: unknown) {
        if (!controller.signal.aborted) {
          setLoadError(reason instanceof Error ? reason.message : "Could not load your settings.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, []);

  const useMyLocation = () => {
    if (isLocating || saving) return;
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setLocationMessage("Geolocation is not supported in this browser.");
      return;
    }

    setIsLocating(true);
    setLocationMessage(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        void (async () => {
          const latitude = String(position.coords.latitude);
          const longitude = String(position.coords.longitude);
          const detectedTimezone = browserTimezone();
          let resolvedCity: string | null = null;

          try {
            const lookup = await fetchJson<{ city: string | null }>(
              `/api/settings?latitude=${encodeURIComponent(latitude)}&longitude=${encodeURIComponent(longitude)}`,
            );
            resolvedCity = lookup.city;
          } catch {
            // Keep coordinates even if reverse geocoding is unreachable
          }

          setDraft((current) =>
            current
              ? {
                  ...current,
                  timezone: detectedTimezone || current.timezone,
                  latitude,
                  longitude,
                  city: resolvedCity ?? current.city,
                }
              : current,
          );
          setErrors([]);
          setLocationMessage(null);
          setMessage(null);
          setIsLocating(false);
        })();
      },
      (geoError) => {
        setLocationMessage(locationErrorMessage(geoError));
        setIsLocating(false);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );
  };

  const persist = async (restoreDefaults = false) => {
    if (!draft || !data || saving) return;
    if (!restoreDefaults) {
      const validationErrors = validateSetupLocation(
        draft.timezone,
        draft.latitude,
        draft.longitude,
      );
      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        setMessage(null);
        return;
      }
    }
    setSaving(true);
    setErrors([]);
    setMessage(null);
    try {
      const body = restoreDefaults
        ? Object.fromEntries(SETUP_FIELDS.map((field) => [field.key, null]))
        : payloadFromDraft(draft, data.settings, data.setupRequired || presentation === "screen");
      const response = await fetchJson<RuntimeSettingsResponse>("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      setData(response);
      setDraft(toDraft(response));
      setMessage(restoreDefaults ? "Environment defaults restored." : "Your setup has been saved.");
      if (!response.setupRequired) onSaved?.();
    } catch (reason: unknown) {
      setErrors([reason instanceof Error ? reason.message : "Could not save your setup. Please try again."]);
    } finally {
      setSaving(false);
    }
  };

  const timezoneError = errors.some((err) => err.startsWith("timezone"));
  const latitudeError = errors.some((err) => err.startsWith("latitude"));
  const longitudeError = errors.some((err) => err.startsWith("longitude"));

  const isFieldError = (key: SetupFieldKey): boolean => {
    if (key === "timezone") return timezoneError;
    if (key === "latitude") return latitudeError;
    if (key === "longitude") return longitudeError;
    return false;
  };

  const form = !draft || !data ? (
    <div className={styles.runtimeEmpty} role={loadError ? "alert" : "status"}>
      {loadError ? <TriangleAlert size={28} /> : <LoaderCircle size={28} className={styles.spinner} />}
      <h2>{loadError ? "Setup couldn’t load" : "Getting things ready"}</h2>
      <p>{loadError ?? "Loading the settings CoreDash needs…"}</p>
      {loadError && (
        <button type="button" onClick={() => window.location.reload()} className={styles.secondaryButton}>
          Try again
        </button>
      )}
    </div>
  ) : (
    <form className={styles.runtimeForm} aria-busy={saving || loading} onSubmit={(event) => { event.preventDefault(); void persist(); }}>
      <div className={styles.runtimeBody}>
        <div className={styles.panelIntro}>
          <span className={styles.eyebrow}>{presentation === "screen" ? "Welcome to CoreDash" : "Application setup"}</span>
          <h2>{data.setupRequired ? "Let’s get CoreDash ready." : "Your setup."}</h2>
          <p>Your day starts here. Set your region and connect the services you use. Optional integrations can wait — saved secrets stay on the server.</p>
        </div>

        {errors.length > 0 && (
          <div role="alert" className={styles.errorMessage}>
            <TriangleAlert size={16} aria-hidden="true" />
            <div className={styles.errorList}>
              {errors.map((err) => (
                <span key={err}>{err}</span>
              ))}
            </div>
          </div>
        )}

        <fieldset disabled={saving || loading} className={styles.fieldGroups}>
          {SETUP_GROUPS.map((group) => {
            const GroupIcon = GROUP_ICONS[group.id];
            return (
              <section key={group.id} className={styles.fieldGroup} aria-labelledby={`setup-${group.id}`}>
                <div className={styles.groupHeading}>
                  <GroupIcon size={16} aria-hidden="true" />
                  <h3 id={`setup-${group.id}`}>{group.title}</h3>
                  {group.optional && <span className={styles.optionalBadge}>Optional</span>}
                </div>
                <p className={styles.help}>{group.description}</p>
                <div className={group.id === "location" ? styles.coordinates : undefined}>
                  {SETUP_FIELDS.filter((field) => field.group === group.id).map((field) => {
                    const secret = field.secret;
                    const configured = secret && data.secrets[field.key as SecretFieldKey];
                    const source = !secret && PUBLIC_KEYS.includes(field.key)
                      ? data.sources[field.key as keyof RuntimeSettingsResponse["sources"]]
                      : null;
                    const inputId = `setup-${field.key}`;
                    const fieldHasError = isFieldError(field.key);
                    return (
                      <div
                        key={field.key}
                        className={styles.field}
                        style={group.id === "location" && field.key === "city" ? { gridColumn: "1 / -1" } : undefined}
                      >
                        <div className={styles.fieldLabel}>
                          <label htmlFor={inputId}>
                            {field.label}
                            {field.required && <span aria-hidden="true"> *</span>}
                          </label>
                          {secret ? (
                            <span className={styles.sourceBadge} data-custom={configured ? "true" : "false"}>
                              {configured ? "Saved" : "Not set"}
                            </span>
                          ) : (
                            <span className={styles.sourceBadge} data-custom={source === "database"}>
                              {source === "database" ? "Customized" : "Default"}
                            </span>
                          )}
                        </div>
                        {field.input === "textarea" || field.input === "secret-textarea" || field.input === "list" ? (
                          <textarea
                            id={inputId}
                            className={styles.input}
                            rows={field.input === "list" ? 3 : 4}
                            autoComplete="off"
                            aria-invalid={fieldHasError}
                            data-error={fieldHasError ? "true" : undefined}
                            placeholder={configured ? "Saved — leave blank to keep" : field.placeholder}
                            aria-describedby={`${inputId}-help`}
                            value={draft[field.key]}
                            onChange={(event) => {
                              const value = event.target.value;
                              setDraft((current) => current ? { ...current, [field.key]: value } : current);
                              setMessage(null);
                            }}
                          />
                        ) : (
                          <input
                            id={inputId}
                            className={styles.input}
                            type={field.input === "secret" ? "password" : field.input === "number" ? "number" : "text"}
                            step={field.input === "number" ? "any" : undefined}
                            autoComplete="off"
                            aria-invalid={fieldHasError}
                            data-error={fieldHasError ? "true" : undefined}
                            placeholder={configured ? "Saved — leave blank to keep" : field.placeholder}
                            aria-describedby={`${inputId}-help`}
                            value={draft[field.key]}
                            onChange={(event) => {
                              const value = event.target.value;
                              setDraft((current) => current ? { ...current, [field.key]: value } : current);
                              setMessage(null);
                            }}
                          />
                        )}
                        <p id={`${inputId}-help`} className={styles.help}>{field.help} Environment variable: <code>{field.env}</code></p>
                      </div>
                    );
                  })}
                </div>
                {group.id === "location" && (
                  <div className={styles.locationActions}>
                    <button
                      type="button"
                      onClick={useMyLocation}
                      disabled={isLocating || saving || loading}
                      className={styles.locationButton}
                    >
                      {isLocating ? (
                        <LoaderCircle size={15} className={styles.spinner} aria-hidden="true" />
                      ) : (
                        <MapPin size={15} aria-hidden="true" />
                      )}
                      {isLocating ? "Locating…" : "Use my location"}
                    </button>
                    {locationMessage && (
                      <p role="alert" className={styles.locationError}>
                        {locationMessage}
                      </p>
                    )}
                  </div>
                )}
              </section>
            );
          })}
        </fieldset>
        {message && <p role="status" className={styles.successMessage}><Check size={16} aria-hidden="true" />{message}</p>}
        {!data.setupRequired && (
          <div className={styles.resetRow}>
            <button type="button" onClick={() => void persist(true)} disabled={saving || loading} className={styles.textButton}>
              <RotateCcw size={14} aria-hidden="true" /> Restore defaults
            </button>
          </div>
        )}
      </div>
      <footer className={styles.saveBar}>
        <span className={styles.saveHint}>{data.setupRequired ? "Required fields are marked with *" : "Stored locally in SQLite"}</span>
        <button type="submit" disabled={saving || loading} className={styles.primaryButton}>
          {saving ? <LoaderCircle size={16} className={styles.spinner} aria-hidden="true" /> : <Save size={16} aria-hidden="true" />}
          {saving ? "Saving…" : data.setupRequired || presentation === "screen" ? "Save and open dashboard" : "Save setup"}
        </button>
      </footer>
    </form>
  );

  if (presentation === "screen") {
    return <div className={styles.setupScreen}><div className={styles.setupCard}>{form}</div></div>;
  }
  return form;
}
