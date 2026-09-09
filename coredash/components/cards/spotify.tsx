"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Card from "@/components/card";
import { useVisibilityPolling } from "@/hooks/use-visibility-polling";
import {
  SpotifyDevice,
  SpotifyLibrary,
  SpotifyPlayerResponse,
  SpotifySearchItem,
  SpotifyTrack,
} from "@/types/spotify";

// ─── Icons ────────────────────────────────────────────────────────────────────

function PrevIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="19,20 9,12 19,4" />
      <rect x="5" y="4" width="2" height="16" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5,3 19,12 5,21" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="4" width="4" height="16" />
      <rect x="14" y="4" width="4" height="16" />
    </svg>
  );
}

function NextIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5,4 15,12 5,20" />
      <rect x="17" y="4" width="2" height="16" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function SpotifyLogo({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#1DB954">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  );
}

function DeviceIcon({ type }: { type: string }) {
  const icons: Record<string, string> = {
    Computer: "💻", Smartphone: "📱", Speaker: "🔊",
    TV: "📺", CastAudio: "🔊", CastVideo: "📺", GameConsole: "🎮",
  };
  return <span style={{ fontSize: 12 }}>{icons[type] ?? "🎵"}</span>;
}

function TypeBadge({ type }: { type: SpotifySearchItem["type"] }) {
  const colors: Record<string, string> = {
    track: "rgba(29,185,84,0.15)",
    album: "rgba(100,149,237,0.15)",
    playlist: "rgba(255,165,0,0.15)",
  };
  const labels: Record<string, string> = { track: "track", album: "album", playlist: "playlist" };
  return (
    <span style={{
      fontSize: 9,
      fontFamily: "var(--font-mono)",
      textTransform: "uppercase",
      letterSpacing: "0.06em",
      padding: "1px 5px",
      borderRadius: 3,
      background: colors[type],
      color: "var(--muted)",
      flexShrink: 0,
    }}>
      {labels[type]}
    </span>
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ progressMs, durationMs, isPlaying }: {
  progressMs: number; durationMs: number; isPlaying: boolean;
}) {
  const [localMs, setLocalMs] = useState(progressMs);
  const rafRef = useRef<number>(0);
  const lastTickRef = useRef<number>(0);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setLocalMs(progressMs));
    lastTickRef.current = Date.now();
    return () => cancelAnimationFrame(frame);
  }, [progressMs]);

  useEffect(() => {
    if (!isPlaying) return;
    const tick = () => {
      const now = Date.now();
      setLocalMs((ms) => Math.min(ms + (now - lastTickRef.current), durationMs));
      lastTickRef.current = now;
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isPlaying, durationMs]);

  const pct = durationMs > 0 ? (localMs / durationMs) * 100 : 0;
  const fmt = (ms: number) => {
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ height: 3, background: "var(--border)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: "#1DB954", borderRadius: 2, transition: "width 0.8s linear" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--muted)", fontFamily: "var(--font-mono)" }}>
        <span>{fmt(localMs)}</span>
        <span>{fmt(durationMs)}</span>
      </div>
    </div>
  );
}

// ─── Device picker ────────────────────────────────────────────────────────────

function DevicePicker({ devices, onTransfer }: {
  devices: SpotifyDevice[];
  onTransfer: (deviceId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const ref = useRef<HTMLDivElement>(null);
  const active = devices.find((d) => d.is_active);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const handleOpen = () => {
    if (!open && ref.current) {
      const r = ref.current.getBoundingClientRect();
      setPos({ top: r.top - 8, left: r.left });
    }
    setOpen((o) => !o);
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={handleOpen}
        title="Switch device"
        style={ctrlBtn(false)}
        onMouseEnter={(e) => hoverIn(e)} onMouseLeave={(e) => hoverOut(e)}
      >
        {active ? <><DeviceIcon type={active.type} /><span style={{ maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 11 }}>{active.name}</span></> : <span style={{ fontSize: 11 }}>No device</span>}
        <span style={{ opacity: 0.4, fontSize: 9 }}>▾</span>
      </button>

      {open && devices.length > 0 && createPortal(
        <div style={{
          position: "fixed",
          top: pos.top,
          left: pos.left,
          transform: "translateY(-100%)",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 10,
          boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
          minWidth: 200,
          overflow: "hidden",
          zIndex: 9999,
          animation: "appear 0.15s ease-out",
        }}>
          <div style={{ padding: "6px 10px", fontSize: 10, color: "var(--muted)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.08em", borderBottom: "1px solid var(--border)" }}>Devices</div>
          {devices.map((d) => (
            <button key={d.id} onClick={() => { onTransfer(d.id); setOpen(false); }}
              style={{ width: "100%", background: d.is_active ? "var(--surface2)" : "none", border: "none", padding: "8px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: d.is_active ? "var(--foreground)" : "var(--muted)", textAlign: "left" }}
              onMouseEnter={(e) => { if (!d.is_active) e.currentTarget.style.background = "var(--surface2)"; }}
              onMouseLeave={(e) => { if (!d.is_active) e.currentTarget.style.background = "none"; }}
            >
              <DeviceIcon type={d.type} />
              <div style={{ flex: 1, overflow: "hidden" }}>
                <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.name}</div>
                {d.volume_percent !== null && <div style={{ fontSize: 10, opacity: 0.5 }}>{d.volume_percent}% vol</div>}
              </div>
              {d.is_active && <span style={{ color: "#1DB954", fontSize: 10 }}>●</span>}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}

// ─── Shared button styles ─────────────────────────────────────────────────────

const ctrlBtn = (primary: boolean): React.CSSProperties => ({
  background: primary ? "var(--foreground)" : "none",
  color: primary ? "var(--surface)" : "var(--muted)",
  border: "1px solid var(--border)",
  borderRadius: primary ? "50%" : 6,
  width: primary ? 34 : undefined,
  height: primary ? 34 : undefined,
  padding: primary ? undefined : "4px 8px",
  display: "flex", alignItems: "center", justifyContent: "center",
  gap: 5, cursor: "pointer", flexShrink: 0, transition: "border-color 0.15s, color 0.15s",
});

const hoverIn = (e: React.MouseEvent<HTMLButtonElement>) => {
  e.currentTarget.style.borderColor = "var(--border-hover)";
  e.currentTarget.style.color = "var(--foreground)";
};
const hoverOut = (e: React.MouseEvent<HTMLButtonElement>) => {
  e.currentTarget.style.borderColor = "var(--border)";
  e.currentTarget.style.color = "var(--muted)";
};

// ─── Now Playing section ──────────────────────────────────────────────────────

function NowPlayingSection({ track, devices, onControl, onEmbed, embedUri }: {
  track: SpotifyTrack;
  devices: SpotifyDevice[];
  onControl: (body: object) => void;
  onEmbed: (url: string | null) => void;
  embedUri: string | null;
}) {
  const isEmbedOpen = embedUri === track.embedUrl;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        {track.albumArt ? (
          <img src={track.albumArt} alt={track.album} width={52} height={52}
            style={{ borderRadius: 6, flexShrink: 0, boxShadow: track.isPlaying ? "0 0 0 2px #1DB954" : "none", transition: "box-shadow 0.3s" }} />
        ) : (
          <div style={{ width: 52, height: 52, background: "var(--surface2)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>🎵</div>
        )}
        <div style={{ overflow: "hidden", flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{track.name}</div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{track.artists.join(", ")}</div>
          <div style={{ fontSize: 11, color: "var(--muted)", opacity: 0.55, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{track.album}</div>
        </div>
      </div>

      <ProgressBar progressMs={track.progressMs} durationMs={track.durationMs} isPlaying={track.isPlaying} />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {([
            { key: "prev", icon: <PrevIcon />, primary: false },
            { key: "toggle", icon: track.isPlaying ? <PauseIcon /> : <PlayIcon />, primary: true },
            { key: "next", icon: <NextIcon />, primary: false },
          ] as { key: string; icon: React.ReactNode; primary: boolean }[]).map(({ key, icon, primary }) => (
            <button key={key} style={{ ...ctrlBtn(primary), width: primary ? 34 : 28, height: primary ? 34 : 28, borderRadius: "50%" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-hover)"; if (!primary) e.currentTarget.style.color = "var(--foreground)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; if (!primary) e.currentTarget.style.color = "var(--muted)"; }}
              onClick={() => {
                if (key === "prev") onControl({ action: "prev" });
                else if (key === "next") onControl({ action: "next" });
                else onControl({ action: track.isPlaying ? "pause" : "play" });
              }}
            >{icon}</button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <DevicePicker devices={devices} onTransfer={(id) => onControl({ action: "transfer", deviceId: id })} />
          <button onClick={() => onEmbed(isEmbedOpen ? null : track.embedUrl)}
            style={ctrlBtn(false)} onMouseEnter={(e) => hoverIn(e)} onMouseLeave={(e) => hoverOut(e)}
            title={isEmbedOpen ? "Close embed" : "Open in Spotify player"}>
            <span style={{ fontSize: 11 }}>{isEmbedOpen ? "▴" : "▾"} iframe</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Browse item ──────────────────────────────────────────────────────────────

function BrowseItem({ item, activeEmbedUri, onPlay, onEmbed }: {
  item: SpotifySearchItem;
  activeEmbedUri: string | null;
  onPlay: (item: SpotifySearchItem) => void;
  onEmbed: (url: string | null) => void;
}) {
  const isEmbedOpen = activeEmbedUri === item.embedUrl;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
      {item.imageUrl ? (
        <img src={item.imageUrl} alt={item.name} width={36} height={36} style={{ borderRadius: item.type === "track" ? 4 : 6, flexShrink: 0, objectFit: "cover" }} />
      ) : (
        <div style={{ width: 36, height: 36, background: "var(--surface2)", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>🎵</div>
      )}

      <div style={{ flex: 1, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <TypeBadge type={item.type} />
        </div>
        <div style={{ fontSize: 12.5, fontWeight: 500, color: "var(--foreground)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: 2 }}>{item.name}</div>
        <div style={{ fontSize: 11, color: "var(--muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.subtitle}</div>
      </div>

      <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
        <button onClick={() => onPlay(item)} title="Play"
          style={{ width: 26, height: 26, borderRadius: "50%", border: "1px solid var(--border)", background: "none", color: "var(--muted)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#1DB954"; e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "#1DB954"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--muted)"; e.currentTarget.style.borderColor = "var(--border)"; }}
        >
          <PlayIcon />
        </button>
        <button onClick={() => onEmbed(isEmbedOpen ? null : item.embedUrl)} title={isEmbedOpen ? "Close player" : "Open in player"}
          style={{ width: 26, height: 26, borderRadius: "50%", border: "1px solid var(--border)", background: isEmbedOpen ? "var(--surface2)" : "none", color: isEmbedOpen ? "var(--foreground)" : "var(--muted)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 10 }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-hover)"; e.currentTarget.style.color = "var(--foreground)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; if (!isEmbedOpen) e.currentTarget.style.color = "var(--muted)"; }}
        >
          🖼
        </button>
      </div>
    </div>
  );
}

// ─── Browse panel (Search + Library tabs) ────────────────────────────────────

function BrowsePanel({ activeEmbedUri, onPlay, onEmbed }: {
  activeEmbedUri: string | null;
  onPlay: (item: SpotifySearchItem) => void;
  onEmbed: (url: string | null) => void;
}) {
  const [tab, setTab] = useState<"library" | "search">("library");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SpotifySearchItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [library, setLibrary] = useState<SpotifyLibrary | null>(null);
  const [loadingLib, setLoadingLib] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (tab === "library" && !library && !loadingLib) {
      setLoadingLib(true);
      fetch("/api/spotify/library")
        .then((r) => r.json())
        .then((j) => setLibrary(j.data ?? null))
        .finally(() => setLoadingLib(false));
    }
  }, [tab, library, loadingLib]);

  const handleSearch = (q: string) => {
    setQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim()) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/spotify/search?q=${encodeURIComponent(q)}`);
        const json = await res.json();
        setResults(json.data ?? []);
      } finally {
        setSearching(false);
      }
    }, 400);
  };

  const tabStyle = (active: boolean): React.CSSProperties => ({
    background: "none", border: "none", padding: "5px 10px", cursor: "pointer",
    fontSize: 11, fontFamily: "var(--font-mono)", textTransform: "uppercase" as const,
    letterSpacing: "0.1em", color: active ? "var(--foreground)" : "var(--muted)",
    borderBottom: active ? "1px solid var(--foreground)" : "1px solid transparent",
    transition: "color 0.15s, border-color 0.15s",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {/* Divider */}
      <div style={{ borderTop: "1px solid var(--border)", margin: "4px 0 10px" }} />

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
        <button style={tabStyle(tab === "library")} onClick={() => setTab("library")}>Library</button>
        <button style={tabStyle(tab === "search")} onClick={() => setTab("search")}>Search</button>
      </div>

      {/* Search input */}
      {tab === "search" && (
        <div style={{ display: "flex", alignItems: "center", gap: 7, background: "var(--surface2)", borderRadius: 8, padding: "7px 10px", marginBottom: 8 }}>
          <span style={{ color: "var(--muted)" }}><SearchIcon /></span>
          <input
            autoFocus
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Tracks, albums, playlists…"
            style={{ flex: 1, background: "none", border: "none", outline: "none", fontSize: 12.5, color: "var(--foreground)", fontFamily: "var(--font-body)" }}
          />
          {searching && <span style={{ fontSize: 10, color: "var(--muted)" }}>…</span>}
          {query && !searching && (
            <button onClick={() => { setQuery(""); setResults([]); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: 12, padding: 0, lineHeight: 1 }}>✕</button>
          )}
        </div>
      )}

      {/* List */}
      <div style={{ maxHeight: 260, overflowY: "auto", display: "flex", flexDirection: "column" }}>
        {tab === "search" && query && !searching && results.length === 0 && (
          <div style={{ fontSize: 12, color: "var(--muted)", padding: "12px 0", textAlign: "center" }}>No results</div>
        )}
        {tab === "search" && results.map((item) => (
          <BrowseItem key={item.id + item.type} item={item} activeEmbedUri={activeEmbedUri} onPlay={onPlay} onEmbed={onEmbed} />
        ))}

        {tab === "library" && loadingLib && (
          <div style={{ fontSize: 12, color: "var(--muted)", padding: "12px 0", textAlign: "center" }}>Loading…</div>
        )}
        {tab === "library" && !loadingLib && library && (
          <>
            {library.recentTracks.length > 0 && (
              <>
                <div style={{ fontSize: 10, color: "var(--muted)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.1em", padding: "4px 0 6px" }}>Recently played</div>
                {library.recentTracks.map((item) => (
                  <BrowseItem key={item.id} item={item} activeEmbedUri={activeEmbedUri} onPlay={onPlay} onEmbed={onEmbed} />
                ))}
              </>
            )}
            {library.playlists.length > 0 && (
              <>
                <div style={{ fontSize: 10, color: "var(--muted)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.1em", padding: "10px 0 6px" }}>Your playlists</div>
                {library.playlists.map((item) => (
                  <BrowseItem key={item.id} item={item} activeEmbedUri={activeEmbedUri} onPlay={onPlay} onEmbed={onEmbed} />
                ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main card ────────────────────────────────────────────────────────────────

async function control(body: object) {
  await fetch("/api/spotify/control", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export default function SpotifyCard() {
  const [data, setData] = useState<SpotifyPlayerResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [embedUri, setEmbedUri] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/spotify");
      if (!res.ok) return;
      const json = await res.json();
      setData(json.data ?? null);
    } finally {
      setLoading(false);
    }
  }, []);

  useVisibilityPolling(refresh, 12_000);

  const act = useCallback(async (body: object) => {
    await control(body);
    setTimeout(refresh, 700);
  }, [refresh]);

  const handlePlay = useCallback((item: SpotifySearchItem) => {
    act({ action: "play_uri", uri: item.uri });
  }, [act]);

  const isConnected = data?.connected !== false;
  const track: SpotifyTrack | null = data?.track ?? null;
  const devices: SpotifyDevice[] = data?.devices ?? [];

  // Determine iframe height based on uri type
  const iframeHeight = embedUri
    ? embedUri.includes("/track/") ? 152 : 380
    : 0;

  return (
    <Card>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <SpotifyLogo size={14} />
          <span className="section-title" style={{ margin: 0 }}>Spotify</span>
          {isConnected && !loading && (
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#1DB954", display: "inline-block" }} />
          )}
        </div>
        {isConnected && track && (
          <span style={{ fontSize: 10, color: "var(--muted)", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>
            {track.isPlaying ? "▶ now playing" : "⏸ paused"}
          </span>
        )}
      </div>

      {loading && (
        <div style={{ color: "var(--muted)", fontSize: 13 }}>Connecting…</div>
      )}

      {/* Not connected */}
      {!loading && !isConnected && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "20px 0" }}>
          <SpotifyLogo size={48} />
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--foreground)", marginBottom: 4 }}>Connect Spotify</div>
            <div style={{ fontSize: 12, color: "var(--muted)", maxWidth: 240 }}>
              Link your account to see what&apos;s playing, browse your library, and control playback.
            </div>
          </div>
          <a
            href="/api/spotify/auth"
            style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "#1DB954", color: "#fff",
              border: "none", borderRadius: 24,
              padding: "10px 24px", fontSize: 13, fontWeight: 600,
              textDecoration: "none", cursor: "pointer",
              transition: "opacity 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            <SpotifyLogo size={16} />
            Connect with Spotify
          </a>
          <p style={{ fontSize: 10, color: "var(--muted)", textAlign: "center", margin: 0 }}>
            Requires <code style={{ fontFamily: "var(--font-mono)" }}>SPOTIFY_CLIENT_ID</code> &amp; <code style={{ fontFamily: "var(--font-mono)" }}>SPOTIFY_CLIENT_SECRET</code> in .env
          </p>
        </div>
      )}

      {/* Connected */}
      {!loading && isConnected && (
        <>
          {/* Now playing section */}
          {track && (
            <div style={{ marginBottom: 8 }}>
              <NowPlayingSection
                track={track}
                devices={devices}
                onControl={act}
                onEmbed={setEmbedUri}
                embedUri={embedUri}
              />
            </div>
          )}

          {/* Nothing playing + no devices */}
          {!track && devices.length === 0 && (
            <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 8 }}>
              Nothing playing. Open Spotify on a device first.
            </div>
          )}

          {/* Nothing playing + devices available */}
          {!track && devices.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: "var(--muted)" }}>Nothing playing —</span>
              <DevicePicker devices={devices} onTransfer={(id) => act({ action: "transfer", deviceId: id })} />
            </div>
          )}

          {/* Browse panel */}
          <BrowsePanel
            activeEmbedUri={embedUri}
            onPlay={handlePlay}
            onEmbed={setEmbedUri}
          />

          {/* Iframe embed */}
          {embedUri && (
            <div style={{ marginTop: 12 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 10, color: "var(--muted)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Web player</span>
                <button onClick={() => setEmbedUri(null)}
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: "var(--muted)", padding: 0 }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--foreground)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}
                >✕ close</button>
              </div>
              <iframe
                key={embedUri}
                src={embedUri}
                width="100%"
                height={iframeHeight}
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                style={{ borderRadius: 10, border: "none", display: "block" }}
              />
            </div>
          )}
        </>
      )}
    </Card>
  );
}


