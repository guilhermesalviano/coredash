"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarDays, Check, Globe2, LoaderCircle, RefreshCw, RotateCcw, Save, Sparkles, Timer, TriangleAlert } from "lucide-react";
import { fetchJson } from "@/lib/api-client";
import type { RuntimeSettings, RuntimeSettingsResponse } from "@/features/settings/types";
import styles from "./settings.module.css";

interface RuntimeSettingsDraft {
  timezone: string;
  latitude: string;
  longitude: string;
  cronSchedule: string;
  aiModel: string;
  calendarIds: string;
}

function toDraft(settings: RuntimeSettings): RuntimeSettingsDraft {
  return { ...settings, calendarIds: settings.calendarIds.join("\n") };
}

function calendarIdsFromText(value: string): string[] {
  return [...new Set(value.split(/[;\n]/).map((item) => item.trim()).filter(Boolean))];
}

export default function RuntimeSettingsSection() {
  const [data, setData] = useState<RuntimeSettingsResponse | null>(null);
  const [draft, setDraft] = useState<RuntimeSettingsDraft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetchJson<RuntimeSettingsResponse>("/api/settings", { signal });
      if (signal?.aborted) return;
      setData(response);
      setDraft(toDraft(response.settings));
    } catch (reason: unknown) {
      if (!signal?.aborted) setError(reason instanceof Error ? reason.message : "Could not load your settings.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const persist = async (restoreDefaults = false) => {
    if (!draft || saving || loading) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetchJson<RuntimeSettingsResponse>("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(restoreDefaults ? {
          timezone: null, latitude: null, longitude: null,
          cronSchedule: null, aiModel: null, calendarIds: null,
        } : { ...draft, calendarIds: calendarIdsFromText(draft.calendarIds) }),
      });
      setData(response);
      setDraft(toDraft(response.settings));
      setMessage(restoreDefaults ? "Default settings restored." : "Your settings have been saved.");
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "Could not save your settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!draft || !data) {
    return (
      <div className={styles.runtimeEmpty} role={error ? "alert" : "status"}>
        {error ? <TriangleAlert size={28} /> : <LoaderCircle size={28} className={styles.spinner} />}
        <h2>{error ? "Settings couldn’t load" : "Getting things ready"}</h2>
        <p>{error ?? "Loading your application preferences…"}</p>
        {error && <button type="button" onClick={() => void load()} className={styles.secondaryButton}><RefreshCw size={15} /> Try again</button>}
      </div>
    );
  }

  const busy = saving || loading;
  const dirty = JSON.stringify(draft) !== JSON.stringify(toDraft(data.settings));
  const source = (key: keyof RuntimeSettingsDraft) => (
    <span className={styles.sourceBadge} data-custom={data.sources[key] === "database"}>
      {data.sources[key] === "database" ? "Customized" : "Default"}
    </span>
  );

  const field = (key: Exclude<keyof RuntimeSettingsDraft, "calendarIds">, label: string, help: string, placeholder?: string, numeric = false) => (
    <div className={styles.field}>
      <div className={styles.fieldLabel}><label htmlFor={`setting-${key}`}>{label}</label>{source(key)}</div>
      <input id={`setting-${key}`} aria-describedby={`setting-${key}-help`}
        type={numeric ? "number" : "text"} step={numeric ? "any" : undefined}
        min={key === "latitude" ? -90 : key === "longitude" ? -180 : undefined}
        max={key === "latitude" ? 90 : key === "longitude" ? 180 : undefined}
        placeholder={placeholder} value={draft[key]} className={styles.input}
        onChange={(event) => {
          setDraft((current) => current ? { ...current, [key]: event.target.value } : current);
          setMessage(null);
        }} />
      <p id={`setting-${key}-help`} className={styles.help}>{help}</p>
    </div>
  );

  return (
    <form className={styles.runtimeForm} aria-busy={busy} onSubmit={(event) => { event.preventDefault(); void persist(); }}>
      <div className={styles.runtimeBody}>
        <div className={styles.panelIntro}>
          <span className={styles.eyebrow}>Behind your dashboard</span>
          <h2>The details that matter.</h2>
          <p>Fine-tune your location, connected services, and updates.</p>
        </div>

        <fieldset disabled={busy} className={styles.fieldGroups}>
          <section className={styles.fieldGroup} aria-labelledby="location-settings-heading">
            <div className={styles.groupHeading}><Globe2 size={18} aria-hidden="true" /><h3 id="location-settings-heading">Location & time</h3></div>
            {field("timezone", "Timezone", "Used for your local dates and schedules.", "America/Sao_Paulo")}
            <div className={styles.coordinates}>
              {field("latitude", "Latitude", "Between −90 and 90.", "-23.5505", true)}
              {field("longitude", "Longitude", "Between −180 and 180.", "-46.6333", true)}
            </div>
          </section>

          <section className={styles.fieldGroup} aria-labelledby="connected-settings-heading">
            <div className={styles.groupHeading}><Sparkles size={18} aria-hidden="true" /><h3 id="connected-settings-heading">Connected services</h3></div>
            {field("aiModel", "AI model", "The Ollama model Rocky uses to help you.", "gemma4:e2b")}
            <div className={styles.field}>
              <div className={styles.fieldLabel}>
                <label htmlFor="setting-calendarIds"><CalendarDays size={14} aria-hidden="true" /> Google Calendar IDs</label>
                {source("calendarIds")}
              </div>
              <textarea id="setting-calendarIds" aria-describedby="setting-calendarIds-help" value={draft.calendarIds}
                onChange={(event) => {
                  setDraft((current) => current ? { ...current, calendarIds: event.target.value } : current);
                  setMessage(null);
                }}
                rows={3} placeholder="One calendar ID per line" className={styles.input} />
              <p id="setting-calendarIds-help" className={styles.help}>Add one ID per line, or separate them with semicolons.</p>
            </div>
          </section>

          <section className={styles.fieldGroup} aria-labelledby="wishlist-settings-heading">
            <div className={styles.groupHeading}><Timer size={18} aria-hidden="true" /><h3 id="wishlist-settings-heading">Wishlist updates</h3></div>
            {field("cronSchedule", "Update schedule", "Five-field cron expression. Leave blank to turn off automatic updates.", "0 */6 * * *")}
            <p className={styles.help}>Schedule changes take effect as soon as you save.</p>
          </section>
        </fieldset>

        {error && <p role="alert" className={styles.errorMessage}><TriangleAlert size={16} aria-hidden="true" />{error}</p>}
        {message && <p role="status" className={styles.successMessage}><Check size={16} aria-hidden="true" />{message}</p>}

        <div className={styles.resetRow}>
          <button type="button" onClick={() => void persist(true)} disabled={busy} className={styles.textButton}>
            <RotateCcw size={14} aria-hidden="true" /> Restore defaults
          </button>
          <button type="button" onClick={() => void load()} disabled={busy} className={styles.textButton}>
            <RefreshCw size={14} className={loading ? styles.spinner : undefined} aria-hidden="true" /> Reload
          </button>
        </div>
      </div>

      <footer className={styles.saveBar}>
        <span className={styles.saveHint} data-dirty={dirty}>
          {dirty ? <span className={styles.unsavedDot} /> : <Check size={14} aria-hidden="true" />}
          {dirty ? "Unsaved changes" : "Up to date"}
        </span>
        <button type="submit" disabled={busy || !dirty} className={styles.primaryButton}>
          {saving ? <LoaderCircle size={16} className={styles.spinner} aria-hidden="true" /> : <Save size={16} aria-hidden="true" />}
          {saving ? "Saving…" : "Save changes"}
        </button>
      </footer>
    </form>
  );
}
