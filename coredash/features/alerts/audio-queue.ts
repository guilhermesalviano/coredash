import { fetchJson } from "@/lib/api-client";
import type { ScheduledAlert } from "./types";

interface AudioJob {
  alert: ScheduledAlert;
  controller: AbortController;
  audio?: HTMLAudioElement;
  plays: number;
  playing: boolean;
}

export async function resolveAlertSound(alert: ScheduledAlert, signal: AbortSignal): Promise<string | undefined> {
  if (alert.soundApi) {
    try {
      const response = await fetchJson<unknown>(alert.soundApi, { cache: "no-store", signal }, 3000);
      const sounds = Array.isArray(response)
        ? response.filter((sound): sound is string => typeof sound === "string" && /\.mp3$/i.test(sound))
        : [];
      if (sounds.length > 0) return sounds[Math.floor(Math.random() * sounds.length)];
    } catch {
      // A failed sound lookup must never prevent the visual alert.
    }
  }
  return signal.aborted ? undefined : alert.sound;
}

export class AlertAudioQueue {
  private jobs = new Map<string, AudioJob>();
  private current: AudioJob | null = null;

  constructor(private readonly onBlocked: (id: string, blocked: boolean) => void) {}

  enqueue(alert: ScheduledAlert): void {
    if (this.jobs.has(alert.id)) return;
    const job: AudioJob = { alert, controller: new AbortController(), plays: 0, playing: false };
    this.jobs.set(alert.id, job);
    void this.prepare(job);
  }

  private async prepare(job: AudioJob): Promise<void> {
    const sound = await resolveAlertSound(job.alert, job.controller.signal);
    if (job.controller.signal.aborted) return;
    if (!sound) {
      this.remove(job.alert.id);
      return;
    }

    const audio = new Audio(sound);
    audio.volume = job.alert.volume ?? 1;
    job.audio = audio;
    audio.onended = () => {
      job.playing = false;
      job.plays += 1;
      if (job.plays < (job.alert.repeat ?? 3)) this.play(job);
      else this.remove(job.alert.id);
    };
    audio.onerror = () => this.remove(job.alert.id);
    this.pump();
  }

  private pump(): void {
    if (this.current) return;
    const next = this.jobs.values().next().value;
    if (!next?.audio) return;
    this.current = next;
    this.play(next);
  }

  private play(job: AudioJob): void {
    if (!job.audio || job.playing || job.controller.signal.aborted) return;
    job.playing = true;
    this.onBlocked(job.alert.id, false);
    // Keep play() synchronous so an Enable sound click supplies user activation.
    void job.audio.play().catch((error: unknown) => {
      if (job.controller.signal.aborted) return;
      job.playing = false;
      if (error instanceof Error && error.name === "NotAllowedError") {
        this.onBlocked(job.alert.id, true);
      } else {
        this.remove(job.alert.id);
      }
    });
  }

  enableSound(id: string): void {
    if (this.current?.alert.id === id) this.play(this.current);
  }

  remove(id: string): void {
    const job = this.jobs.get(id);
    if (!job) return;
    this.jobs.delete(id);
    job.controller.abort();
    if (job.audio) {
      job.audio.onended = null;
      job.audio.onerror = null;
      job.audio.pause();
      job.audio.removeAttribute("src");
      job.audio.load();
    }
    if (this.current === job) this.current = null;
    this.onBlocked(id, false);
    this.pump();
  }

  dispose(): void {
    // Abort everything before removing entries so cleanup cannot start another sound.
    for (const job of this.jobs.values()) job.controller.abort();
    for (const id of this.jobs.keys()) this.remove(id);
  }
}
