"use client";

import { useEffect, useState } from "react";

import { fetchJson } from "@/lib/api-client";
import type { RuntimeSettings, RuntimeSettingsResponse } from "@/features/settings/types";

interface RuntimeSettingsDraft {
  timezone: string;
  latitude: string;
  longitude: string;
  cronSchedule: string;
  aiModel: string;
  calendarIds: string;
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  marginTop: 5,
  padding: "8px 9px",
  border: "1px solid var(--border)",
  borderRadius: 7,
  background: "var(--surface2)",
  color: "var(--foreground)",
  fontSize: 12,
};

function toDraft(settings: RuntimeSettings): RuntimeSettingsDraft {
  return {
    timezone: settings.timezone,
    latitude: settings.latitude,
    longitude: settings.longitude,
    cronSchedule: settings.cronSchedule,
    aiModel: settings.aiModel,
    calendarIds: settings.calendarIds.join("\n"),
  };
}

function calendarIdsFromText(value: string): string[] {
  return [...new Set(value.split(/[;\n]/).map((item) => item.trim()).filter(Boolean))];
}

export default function RuntimeSettingsSection() {
  const [data, setData] = useState<RuntimeSettingsResponse | null>(null);
  const [draft, setDraft] = useState<RuntimeSettingsDraft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    fetchJson<RuntimeSettingsResponse>("/api/settings")
      .then((response) => {
        setData(response);
        setDraft(toDraft(response.settings));
      })
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Não foi possível carregar as configurações."));
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetchJson<RuntimeSettingsResponse>("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timezone: draft.timezone,
          latitude: draft.latitude,
          longitude: draft.longitude,
          cronSchedule: draft.cronSchedule,
          aiModel: draft.aiModel,
          calendarIds: calendarIdsFromText(draft.calendarIds),
        }),
      });
      setData(response);
      setDraft(toDraft(response.settings));
      setMessage("Configurações salvas.");
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "Não foi possível salvar as configurações.");
    } finally {
      setSaving(false);
    }
  };

  const reset = async (key: keyof RuntimeSettings | "all") => {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetchJson<RuntimeSettingsResponse>("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(key === "all" ? {
          timezone: null,
          latitude: null,
          longitude: null,
          cronSchedule: null,
          aiModel: null,
          calendarIds: null,
        } : { [key]: null }),
      });
      setData(response);
      setDraft(toDraft(response.settings));
      setMessage("Valor restaurado a partir do ambiente.");
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "Não foi possível restaurar o valor.");
    } finally {
      setSaving(false);
    }
  };

  if (!draft || !data) {
    return <div style={{ color: "var(--muted)", fontSize: 12 }}>Carregando configurações do aplicativo...</div>;
  }

  const field = (key: keyof RuntimeSettingsDraft, label: string, help: string, type = "text") => (
    <label key={key} style={{ display: "block", color: "var(--foreground)", fontSize: 12 }}>
      <span style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
        <span>{label}</span>
        <span style={{ color: "var(--muted)", fontSize: 10 }}>{data.sources[key] === "database" ? "app" : "env"}</span>
      </span>
      <input
        type={type}
        value={draft[key]}
        onChange={(event) => setDraft((current) => current ? { ...current, [key]: event.target.value } : current)}
        style={inputStyle}
      />
      <span style={{ display: "block", marginTop: 3, color: "var(--muted)", fontSize: 10 }}>{help}</span>
    </label>
  );

  return (
    <div>
      <p style={{ fontSize: 10, color: "var(--muted)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10 }}>
        Runtime application
      </p>
      <p style={{ color: "var(--muted)", fontSize: 11, lineHeight: 1.45, margin: "0 0 12px" }}>
        These values override the environment for the running application. Cron changes apply immediately.
      </p>
      <div style={{ display: "grid", gap: 12 }}>
        {field("timezone", "Timezone", "IANA name, e.g. America/Sao_Paulo")}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {field("latitude", "Latitude", "-90 to 90", "number")}
          {field("longitude", "Longitude", "-180 to 180", "number")}
        </div>
        {field("cronSchedule", "Wishlist cron", "Five-field cron; leave blank to disable")}
        {field("aiModel", "AI model", "Ollama model name")}
        <label style={{ display: "block", color: "var(--foreground)", fontSize: 12 }}>
          <span style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
            <span>Google Calendar IDs</span>
            <span style={{ color: "var(--muted)", fontSize: 10 }}>{data.sources.calendarIds === "database" ? "app" : "env"}</span>
          </span>
          <textarea
            value={draft.calendarIds}
            onChange={(event) => setDraft((current) => current ? { ...current, calendarIds: event.target.value } : current)}
            rows={3}
            placeholder="One calendar ID per line"
            style={{ ...inputStyle, resize: "vertical" }}
          />
          <span style={{ display: "block", marginTop: 3, color: "var(--muted)", fontSize: 10 }}>Separate IDs with new lines or semicolons.</span>
        </label>
      </div>
      {error && <p style={{ color: "#d96c6c", fontSize: 11, margin: "10px 0 0" }}>{error}</p>}
      {message && <p style={{ color: "var(--accent, #5a6e0f)", fontSize: 11, margin: "10px 0 0" }}>{message}</p>}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
        <button type="button" onClick={save} disabled={saving} style={{ flex: 1, minWidth: 100, padding: "8px 10px", border: "none", borderRadius: 7, background: "var(--accent, #5a6e0f)", color: "white", cursor: saving ? "wait" : "pointer", fontSize: 12 }}>
          {saving ? "Salvando..." : "Salvar"}
        </button>
        <button type="button" onClick={() => reset("all")} disabled={saving} style={{ padding: "8px 10px", border: "1px solid var(--border)", borderRadius: 7, background: "transparent", color: "var(--muted)", cursor: saving ? "wait" : "pointer", fontSize: 11 }}>
          Restaurar defaults do env
        </button>
      </div>
      <button type="button" onClick={() => { setData(null); setDraft(null); load(); }} style={{ marginTop: 8, border: "none", background: "none", color: "var(--muted)", cursor: "pointer", fontSize: 10 }}>
        Recarregar
      </button>
    </div>
  );
}
