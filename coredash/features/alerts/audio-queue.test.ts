import assert from "node:assert/strict";
import test, { type TestContext } from "node:test";
import { setImmediate } from "node:timers/promises";
import { AlertAudioQueue, resolveAlertSound } from "./audio-queue";
import type { ScheduledAlert } from "./types";

const alert: ScheduledAlert = { id: "test", title: "Test alert", hour: 10, minute: 0, sound: "/fallback.mp3" };

function mockAudio(t: TestContext) {
  const instances: FakeAudio[] = [];
  class FakeAudio {
    volume = 1;
    onended: (() => void) | null = null;
    onerror: (() => void) | null = null;
    playCalls = 0;
    pauseCalls = 0;
    blocked = false;
    removed = false;
    constructor(public src: string) { instances.push(this); }
    play() {
      this.playCalls += 1;
      return this.blocked
        ? Promise.reject(new DOMException("User interaction required", "NotAllowedError"))
        : Promise.resolve();
    }
    pause() { this.pauseCalls += 1; }
    removeAttribute() { this.removed = true; }
    load() {}
  }
  const original = Object.getOwnPropertyDescriptor(globalThis, "Audio");
  Object.defineProperty(globalThis, "Audio", { value: FakeAudio, configurable: true });
  t.after(() => {
    if (original) Object.defineProperty(globalThis, "Audio", original);
    else Reflect.deleteProperty(globalThis, "Audio");
  });
  return { instances, FakeAudio };
}

test("sound lookup accepts the existing raw list and standard envelopes", async (t) => {
  for (const body of [["/chosen.mp3", "/ignore.wav", null], { data: ["/chosen.mp3"] }]) {
    t.mock.method(globalThis, "fetch", async () => Response.json(body));
    assert.equal(await resolveAlertSound({ ...alert, soundApi: "/sounds" }, new AbortController().signal), "/chosen.mp3");
  }
});

test("failed, malformed, and empty lookups use the fallback sound", async (t) => {
  for (const response of [Response.json([], { status: 503 }), Response.json([]), Response.json({ wrong: true }), new Response("invalid")]) {
    t.mock.method(globalThis, "fetch", async () => response);
    assert.equal(await resolveAlertSound({ ...alert, soundApi: "/sounds" }, new AbortController().signal), alert.sound);
  }
  t.mock.method(globalThis, "fetch", async () => { throw new Error("offline"); });
  assert.equal(await resolveAlertSound({ ...alert, soundApi: "/sounds" }, new AbortController().signal), alert.sound);
});

test("plays simultaneous alerts sequentially and preserves repeat counts and rain volume", async (t) => {
  const { instances } = mockAudio(t);
  const queue = new AlertAudioQueue(() => {});
  t.after(() => queue.dispose());
  queue.enqueue(alert);
  queue.enqueue({ ...alert, id: "rain", volume: 0.7, repeat: 1 });
  await setImmediate();
  assert.equal(instances[0].playCalls, 1);
  assert.equal(instances[1].playCalls, 0);
  for (let i = 0; i < 3; i++) instances[0].onended?.();
  assert.equal(instances[0].playCalls, 3);
  assert.equal(instances[1].playCalls, 1);
  assert.equal(instances[1].volume, 0.7);
  instances[1].onended?.();
  assert.equal(instances[1].playCalls, 1);
  assert.equal(instances[1].pauseCalls, 1);
});

test("blocked playback can retry synchronously from an Enable sound click", async (t) => {
  const { instances, FakeAudio } = mockAudio(t);
  const play = FakeAudio.prototype.play;
  t.mock.method(FakeAudio.prototype, "play", function (this: InstanceType<typeof FakeAudio>) {
    if (this.playCalls === 0) this.blocked = true;
    return play.call(this);
  });
  const changes: boolean[] = [];
  const queue = new AlertAudioQueue((_id, blocked) => changes.push(blocked));
  t.after(() => queue.dispose());
  queue.enqueue(alert);
  await setImmediate();
  assert.equal(changes.at(-1), true);
  instances[0].blocked = false;
  queue.enableSound(alert.id);
  assert.equal(instances[0].playCalls, 2, "play must happen inside the click call, before awaiting anything");
  assert.equal(changes.at(-1), false);
});

test("dismissal stops playback and releases the next queued sound", async (t) => {
  const { instances } = mockAudio(t);
  const queue = new AlertAudioQueue(() => {});
  t.after(() => queue.dispose());
  queue.enqueue(alert);
  queue.enqueue({ ...alert, id: "second" });
  await setImmediate();
  queue.remove(alert.id);
  assert.equal(instances[0].pauseCalls, 1);
  assert.equal(instances[0].onended, null);
  assert.equal(instances[0].removed, true);
  assert.equal(instances[1].playCalls, 1);
});

test("late lookup responses cannot play after dismissal", async (t) => {
  const { instances } = mockAudio(t);
  let finish!: (response: Response) => void;
  let signal: AbortSignal | null | undefined;
  t.mock.method(globalThis, "fetch", (_input: RequestInfo | URL, init?: RequestInit) => {
    signal = init?.signal;
    return new Promise<Response>((resolve) => { finish = resolve; });
  });
  const queue = new AlertAudioQueue(() => {});
  t.after(() => queue.dispose());
  queue.enqueue({ ...alert, soundApi: "/sounds" });
  queue.remove(alert.id);
  assert.equal(signal?.aborted, true);
  finish(Response.json(["/late.mp3"]));
  await setImmediate();
  assert.equal(instances.length, 0);
});

test("media failures release the queue and disposal never starts waiting audio", async (t) => {
  const { instances } = mockAudio(t);
  const queue = new AlertAudioQueue(() => {});
  queue.enqueue(alert);
  queue.enqueue({ ...alert, id: "second" });
  queue.enqueue({ ...alert, id: "third" });
  await setImmediate();
  instances[0].onerror?.();
  assert.equal(instances[1].playCalls, 1);
  queue.dispose();
  assert.equal(instances[2].playCalls, 0);
  assert.ok(instances.every((audio) => audio.onended === null && audio.removed));
});
