import { getResolvedRuntimeSettings } from "@/features/settings/server/runtime-settings";
import { SpotifyDevice, SpotifyLibrary, SpotifyPlayerResponse, SpotifySearchItem, SpotifyTrack } from "@/types/spotify";

// ─── Access token cache ───────────────────────────────────────────────────────

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiresAt - 30_000) {
    return cachedToken;
  }

  const settings = await getResolvedRuntimeSettings();
  const refreshToken = settings.spotifyRefreshToken;
  if (!refreshToken) throw new Error("not_connected");

  const credentials = Buffer.from(
    `${settings.spotifyClientId}:${settings.spotifyClientSecret}`
  ).toString("base64");

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) throw new Error(`Spotify token error: ${res.status}`);

  const data = await res.json();
  cachedToken = data.access_token as string;
  tokenExpiresAt = Date.now() + data.expires_in * 1000;

  return cachedToken;
}

async function spotifyFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getAccessToken();
  return fetch(`https://api.spotify.com/v1${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });
}

// ─── Player state ─────────────────────────────────────────────────────────────

export async function fetchSpotifyPlayer(): Promise<SpotifyPlayerResponse> {
  const [playerRes, devicesRes] = await Promise.all([
    spotifyFetch("/me/player?additional_types=track"),
    spotifyFetch("/me/player/devices"),
  ]);

  const devices: SpotifyDevice[] = [];
  if (devicesRes.ok) {
    const devicesData = await devicesRes.json();
    for (const d of devicesData.devices ?? []) {
      devices.push({
        id: d.id,
        name: d.name,
        type: d.type,
        is_active: d.is_active,
        volume_percent: d.volume_percent,
      });
    }
  }

  if (playerRes.status === 204 || !playerRes.ok) {
    return { connected: true, track: null, devices };
  }

  const player = await playerRes.json();
  const item = player.item;

  if (!item || item.type !== "track") {
    return { connected: true, track: null, devices };
  }

  const track: SpotifyTrack = {
    id: item.id,
    name: item.name,
    artists: item.artists.map((a: any) => a.name),
    album: item.album.name,
    albumArt: item.album.images?.[0]?.url ?? null,
    durationMs: item.duration_ms,
    progressMs: player.progress_ms ?? 0,
    isPlaying: player.is_playing,
    embedUrl: `https://open.spotify.com/embed/track/${item.id}?utm_source=generator&theme=0`,
  };

  return { connected: true, track, devices };
}

// ─── Search ───────────────────────────────────────────────────────────────────

function embedUrl(type: string, id: string) {
  return `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0`;
}

export async function fetchSpotifySearch(q: string): Promise<SpotifySearchItem[]> {
  const res = await spotifyFetch(
    `/search?q=${encodeURIComponent(q)}&type=track,album,playlist&limit=8`
  );
  if (!res.ok) return [];

  const data = await res.json();
  const items: SpotifySearchItem[] = [];

  for (const t of data.tracks?.items ?? []) {
    items.push({
      id: t.id,
      type: "track",
      name: t.name,
      subtitle: t.artists.map((a: any) => a.name).join(", "),
      imageUrl: t.album.images?.[1]?.url ?? t.album.images?.[0]?.url ?? null,
      uri: t.uri,
      embedUrl: embedUrl("track", t.id),
    });
  }

  for (const a of data.albums?.items ?? []) {
    items.push({
      id: a.id,
      type: "album",
      name: a.name,
      subtitle: a.artists.map((a: any) => a.name).join(", "),
      imageUrl: a.images?.[1]?.url ?? a.images?.[0]?.url ?? null,
      uri: a.uri,
      embedUrl: embedUrl("album", a.id),
    });
  }

  for (const p of data.playlists?.items ?? []) {
    if (!p) continue;
    items.push({
      id: p.id,
      type: "playlist",
      name: p.name,
      subtitle: p.description || `${p.tracks?.total ?? "?"} tracks`,
      imageUrl: p.images?.[0]?.url ?? null,
      uri: p.uri,
      embedUrl: embedUrl("playlist", p.id),
    });
  }

  return items;
}

// ─── Library ──────────────────────────────────────────────────────────────────

export async function fetchSpotifyLibrary(): Promise<SpotifyLibrary> {
  const [playlistsRes, recentRes] = await Promise.all([
    spotifyFetch("/me/playlists?limit=20"),
    spotifyFetch("/me/player/recently-played?limit=20"),
  ]);

  const playlists: SpotifySearchItem[] = [];
  if (playlistsRes.ok) {
    const data = await playlistsRes.json();
    for (const p of data.items ?? []) {
      if (!p) continue;
      playlists.push({
        id: p.id,
        type: "playlist",
        name: p.name,
        subtitle: `${p.tracks?.total ?? "?"} tracks`,
        imageUrl: p.images?.[0]?.url ?? null,
        uri: p.uri,
        embedUrl: embedUrl("playlist", p.id),
      });
    }
  }

  const recentTracks: SpotifySearchItem[] = [];
  const seen = new Set<string>();
  if (recentRes.ok) {
    const data = await recentRes.json();
    for (const entry of data.items ?? []) {
      const t = entry.track;
      if (!t || seen.has(t.id)) continue;
      seen.add(t.id);
      recentTracks.push({
        id: t.id,
        type: "track",
        name: t.name,
        subtitle: t.artists.map((a: any) => a.name).join(", "),
        imageUrl: t.album.images?.[1]?.url ?? t.album.images?.[0]?.url ?? null,
        uri: t.uri,
        embedUrl: embedUrl("track", t.id),
      });
    }
  }

  return { playlists, recentTracks };
}

// ─── Playback controls ────────────────────────────────────────────────────────

export async function spotifyPlay(deviceId?: string): Promise<void> {
  const query = deviceId ? `?device_id=${deviceId}` : "";
  await spotifyFetch(`/me/player/play${query}`, { method: "PUT" });
}

export async function spotifyPause(): Promise<void> {
  await spotifyFetch("/me/player/pause", { method: "PUT" });
}

export async function spotifyNext(): Promise<void> {
  await spotifyFetch("/me/player/next", { method: "POST" });
}

export async function spotifyPrev(): Promise<void> {
  await spotifyFetch("/me/player/previous", { method: "POST" });
}

export async function spotifyTransferDevice(deviceId: string): Promise<void> {
  await spotifyFetch("/me/player", {
    method: "PUT",
    body: JSON.stringify({ device_ids: [deviceId], play: true }),
  });
}

export async function spotifyPlayUri(uri: string, deviceId?: string): Promise<void> {
  const query = deviceId ? `?device_id=${deviceId}` : "";
  const body = uri.startsWith("spotify:track:")
    ? { uris: [uri] }
    : { context_uri: uri };
  await spotifyFetch(`/me/player/play${query}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

