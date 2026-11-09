import { parseCameraUrl } from "@/features/camera/camera-url";
import { getResolvedRuntimeSettings } from "@/features/settings/server/runtime-settings";
import { AppError } from "@/lib/api-error";
import { globalSingleton } from "@/lib/global-singleton";
import { CameraError, fetchCameraFrame, type CameraFrame } from "@/services/lan-camera";

// Several open dashboards share one request to the camera instead of each
// opening their own; small cameras only serve a few connections at a time.
const FRAME_TTL_MS = 800;

const state = globalSingleton("cameraSnapshot", () => ({
  pending: null as Promise<CameraFrame> | null,
  frame: null as CameraFrame | null,
  url: "",
  fetchedAt: 0,
}));

const STATUS: Record<CameraError["reason"], number> = {
  timeout: 504,
  unauthorized: 502,
  unreachable: 502,
  unsupported: 502,
};

export async function getCameraSnapshot(): Promise<CameraFrame> {
  const { cameraUrl } = await getResolvedRuntimeSettings();
  if (!cameraUrl) throw new AppError("Camera is not configured", 404, "not_configured");

  const target = parseCameraUrl(cameraUrl);
  if (!target) throw new AppError("Camera URL must be an http(s) address", 404, "not_configured");

  if (state.url === cameraUrl) {
    if (state.frame && Date.now() - state.fetchedAt < FRAME_TTL_MS) return state.frame;
    if (state.pending) return state.pending;
  }

  const pending = fetchCameraFrame(target)
    .then((frame) => {
      if (state.pending === pending) {
        state.frame = frame;
        state.fetchedAt = Date.now();
      }
      return frame;
    })
    .catch((error: unknown) => {
      if (error instanceof CameraError) throw new AppError(error.message, STATUS[error.reason], error.reason);
      throw error;
    })
    .finally(() => {
      if (state.pending === pending) state.pending = null;
    });

  state.url = cameraUrl;
  state.frame = null;
  state.pending = pending;
  return pending;
}
