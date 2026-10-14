"use client";

import { useEffect, useState } from "react";
import { Check, LoaderCircle, RotateCcw, Save, TriangleAlert } from "lucide-react";
import { fetchJson } from "@/lib/api-client";
import { SETUP_FIELDS, SETUP_GROUPS, type SetupFieldKey } from "@/features/settings/setup-fields";
import type { RuntimeSettings, RuntimeSettingsResponse, SecretFieldKey } from "@/features/settings/types";
import styles from "./settings.module.css";

type Draft = Record<SetupFieldKey, string>;

const PUBLIC_KEYS = SETUP_FIELDS.filter((field) => !field.secret).map((field) => field.key);

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
  return draft;
}

function calendarIdsFromText(value: string): string[] {
  return [...new Set(value.split(/[;\n]/).map((item) => item.trim()).filter(Boolean))];
}

function sameList(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((item, index) => item === right[index]);
}

function payloadFromDraft(draft: Draft, original: RuntimeSettings): Record<string, unknown> {
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
    if (typeof current === "string" && draft[field.key] !== current) body[field.key] = draft[field.key];
  }
  return body;
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
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      try {
        const response = await fetchJson<RuntimeSettingsResponse>("/api/settings", { signal: controller.signal });
        if (controller.signal.aborted) return;
        setData(response);
        setDraft(toDraft(response));
        setError(null);
      } catch (reason: unknown) {
        if (!controller.signal.aborted) {
          setError(reason instanceof Error ? reason.message : "Could not load your settings.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, []);

  const persist = async (restoreDefaults = false) => {
    if (!draft || !data || saving) return;
    if (!restoreDefaults && data.setupRequired && !data.secrets.openRouterApiKey && !draft.openRouterApiKey.trim()) {
      setError("OpenRouter API key must be configured.");
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const body = restoreDefaults
        ? Object.fromEntries(SETUP_FIELDS.map((field) => [field.key, null]))
        : payloadFromDraft(draft, data.settings);
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
      setError(reason instanceof Error ? reason.message : "Could not save your setup. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const form = !draft || !data ? (
    <div className={styles.runtimeEmpty} role={error ? "alert" : "status"}>
      {error ? <TriangleAlert size={28} /> : <LoaderCircle size={28} className={styles.spinner} />}
      <h2>{error ? "Setup couldn’t load" : "Getting things ready"}</h2>
      <p>{error ?? "Loading the settings CoreDash needs…"}</p>
      {error && (
        <button type="button" onClick={() => window.location.reload()} className={styles.secondaryButton}>
          Try again
        </button>
      )}
    </div>
  ) : (
    <form className={styles.runtimeForm} aria-busy={saving || loading} onSubmit={(event) => { event.preventDefault(); void persist(); }}>
      <div className={styles.runtimeBody}>
        <div className={styles.panelIntro}>
          <span className={styles.eyebrow}>{presentation === "screen" ? "First run" : "Application setup"}</span>
          <h2>{data.setupRequired ? "Let’s get CoreDash ready." : "Your setup."}</h2>
          <p>Required fields keep the dashboard working. Optional integrations can wait. Saved secrets stay on the server — leave a secret blank to keep it.</p>
        </div>
        <fieldset disabled={saving || loading} className={styles.fieldGroups}>
          {SETUP_GROUPS.map((group) => (
            <section key={group.id} className={styles.fieldGroup} aria-labelledby={`setup-${group.id}`}>
              <div className={styles.groupHeading}>
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
                  return (
                    <div key={field.key} className={styles.field} style={group.id === "location" && field.key === "timezone" ? { gridColumn: "1 / -1" } : undefined}>
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
            </section>
          ))}
        </fieldset>
        {error && <p role="alert" className={styles.errorMessage}><TriangleAlert size={16} aria-hidden="true" />{error}</p>}
        {message && <p role="status" className={styles.successMessage}><Check size={16} aria-hidden="true" />{message}</p>}
        <div className={styles.resetRow}>
          <button type="button" onClick={() => void persist(true)} disabled={saving || loading} className={styles.textButton}>
            <RotateCcw size={14} aria-hidden="true" /> Restore defaults
          </button>
        </div>
      </div>
      <footer className={styles.saveBar}>
        <span className={styles.saveHint}>{data.setupRequired ? "Required fields are marked with *" : "Up to date when saved"}</span>
        <button type="submit" disabled={saving || loading} className={styles.primaryButton}>
          {saving ? <LoaderCircle size={16} className={styles.spinner} aria-hidden="true" /> : <Save size={16} aria-hidden="true" />}
          {saving ? "Saving…" : "Save setup"}
        </button>
      </footer>
    </form>
  );

  if (presentation === "screen") {
    return <div className={styles.setupScreen}><div className={styles.setupCard}>{form}</div></div>;
  }
  return form;
}
