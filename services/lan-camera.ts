import { createHash, randomBytes } from "node:crypto";

export interface CameraRequest {
  url: string;
  username?: string;
  password?: string;
}

export interface CameraFrame {
  body: Buffer;
  contentType: string;
}

export type CameraFailure = "timeout" | "unauthorized" | "unreachable" | "unsupported";

export class CameraError extends Error {
  constructor(public readonly reason: CameraFailure, message: string) {
    super(message);
    this.name = "CameraError";
  }
}

const TIMEOUT_MS = 6000;
const MAX_FRAME_BYTES = 8 * 1024 * 1024;
const JPEG_START = Buffer.from([0xff, 0xd8]);
const JPEG_END = Buffer.from([0xff, 0xd9]);

/** Returns the first complete JPEG in `data`, or null while it is still partial. */
export function extractJpegFrame(data: Buffer): Buffer | null {
  const start = data.indexOf(JPEG_START);
  if (start === -1) return null;
  const end = data.indexOf(JPEG_END, start + 2);
  if (end === -1) return null;
  return data.subarray(start, end + 2);
}

function hash(algorithm: string, value: string): string {
  return createHash(algorithm).update(value).digest("hex");
}

/** Builds the Authorization header for an RFC 7616 digest challenge. */
export function digestAuthorization(
  challenge: string,
  request: { method: string; uri: string; username: string; password: string },
  cnonce = randomBytes(8).toString("hex"),
): string | null {
  if (!/^\s*digest\s/i.test(challenge)) return null;
  const params: Record<string, string> = {};
  for (const match of challenge.matchAll(/(\w+)=(?:"([^"]*)"|([^\s,]+))/g)) {
    params[match[1].toLowerCase()] = match[2] ?? match[3];
  }
  const { realm = "", nonce, opaque } = params;
  if (!nonce) return null;

  const algorithmName = params.algorithm ?? "MD5";
  const algorithm = /^sha-256/i.test(algorithmName) ? "sha256" : "md5";
  const qop = params.qop?.split(",").map((item) => item.trim()).includes("auth") ? "auth" : null;
  const nc = "00000001";

  let ha1 = hash(algorithm, `${request.username}:${realm}:${request.password}`);
  if (/-sess$/i.test(algorithmName)) ha1 = hash(algorithm, `${ha1}:${nonce}:${cnonce}`);
  const ha2 = hash(algorithm, `${request.method}:${request.uri}`);
  const response = qop
    ? hash(algorithm, `${ha1}:${nonce}:${nc}:${cnonce}:${qop}:${ha2}`)
    : hash(algorithm, `${ha1}:${nonce}:${ha2}`);

  const parts = [
    `username="${request.username}"`,
    `realm="${realm}"`,
    `nonce="${nonce}"`,
    `uri="${request.uri}"`,
    `algorithm=${algorithmName}`,
    `response="${response}"`,
  ];
  if (qop) parts.push(`qop=${qop}`, `nc=${nc}`, `cnonce="${cnonce}"`);
  if (opaque) parts.push(`opaque="${opaque}"`);
  return `Digest ${parts.join(", ")}`;
}

async function readFrame(response: Response): Promise<CameraFrame> {
  const contentType = (response.headers.get("content-type") ?? "").toLowerCase();
  const isStream = contentType.startsWith("multipart/x-mixed-replace");
  if (!isStream && !contentType.startsWith("image/")) {
    throw new CameraError("unsupported", "Camera did not return an image or an MJPEG stream");
  }
  if (!response.body) throw new CameraError("unreachable", "Camera returned an empty response");

  const chunks: Buffer[] = [];
  let size = 0;
  const reader = response.body.getReader();
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (value) {
        chunks.push(Buffer.from(value));
        size += value.byteLength;
        if (size > MAX_FRAME_BYTES) throw new CameraError("unsupported", "Camera frame is too large");
        if (isStream) {
          // An MJPEG stream never ends, so stop at the first whole frame.
          const frame = extractJpegFrame(Buffer.concat(chunks));
          if (frame) return { body: Buffer.from(frame), contentType: "image/jpeg" };
        }
      }
      if (done) break;
    }
  } finally {
    void reader.cancel().catch(() => {});
  }

  if (isStream || size === 0) throw new CameraError("unreachable", "Camera stream ended before a frame arrived");
  return { body: Buffer.concat(chunks), contentType: contentType.split(";")[0] };
}

/**
 * Fetches one still frame from a LAN camera. Works with snapshot URLs (a
 * single image) and MJPEG streams, using basic or digest authentication.
 */
export async function fetchCameraFrame(request: CameraRequest): Promise<CameraFrame> {
  const { url, username = "", password = "" } = request;
  const hasCredentials = Boolean(username || password);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const get = (authorization?: string) =>
    fetch(url, {
      cache: "no-store",
      signal: controller.signal,
      headers: authorization ? { Authorization: authorization } : undefined,
    });

  try {
    let response = await get(
      hasCredentials ? `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}` : undefined,
    );

    if (response.status === 401 && hasCredentials) {
      const target = new URL(url);
      const digest = digestAuthorization(response.headers.get("www-authenticate") ?? "", {
        method: "GET",
        uri: `${target.pathname}${target.search}`,
        username,
        password,
      });
      if (digest) {
        await response.body?.cancel().catch(() => {});
        response = await get(digest);
      }
    }

    if (response.status === 401 || response.status === 403) {
      await response.body?.cancel().catch(() => {});
      throw new CameraError("unauthorized", "Camera rejected the credentials");
    }
    if (!response.ok) {
      await response.body?.cancel().catch(() => {});
      throw new CameraError("unreachable", `Camera answered with status ${response.status}`);
    }
    return await readFrame(response);
  } catch (error: unknown) {
    if (error instanceof CameraError) throw error;
    if (controller.signal.aborted) throw new CameraError("timeout", "Camera did not answer in time");
    throw new CameraError("unreachable", "Could not reach the camera");
  } finally {
    clearTimeout(timer);
    controller.abort();
  }
}
