export interface CameraTarget {
  /** Address without credentials; fetch rejects URLs that carry them. */
  url: string;
  username: string;
  password: string;
}

function decode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/**
 * Splits a camera address such as `http://user:pass@192.168.1.20/snapshot.jpg`
 * into the plain URL and its credentials. Returns null for anything that is not
 * an http(s) URL (RTSP streams cannot be read by the dashboard).
 */
export function parseCameraUrl(value: string): CameraTarget | null {
  let parsed: URL;
  try {
    parsed = new URL(value.trim());
  } catch {
    return null;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;

  const username = decode(parsed.username);
  const password = decode(parsed.password);
  parsed.username = "";
  parsed.password = "";
  return { url: parsed.toString(), username, password };
}
