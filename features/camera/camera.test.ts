import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";

import { parseCameraUrl } from "@/features/camera/camera-url";
import { validateRuntimeSettingsPatch } from "@/features/settings/server/setup-validation";
import { digestAuthorization, extractJpegFrame } from "@/services/lan-camera";

test("splits credentials out of a camera URL", () => {
  assert.deepEqual(parseCameraUrl(" http://admin:p%40ss@192.168.1.20:8080/snap.jpg?ch=1 "), {
    url: "http://192.168.1.20:8080/snap.jpg?ch=1",
    username: "admin",
    password: "p@ss",
  });
  assert.deepEqual(parseCameraUrl("https://cam.lan/video"), {
    url: "https://cam.lan/video",
    username: "",
    password: "",
  });
});

test("rejects camera URLs the dashboard cannot read", () => {
  assert.equal(parseCameraUrl("rtsp://192.168.1.20/stream"), null);
  assert.equal(parseCameraUrl("192.168.1.20/snap.jpg"), null);
  assert.equal(parseCameraUrl(""), null);
});

test("settings accept only http(s) camera URLs", () => {
  assert.deepEqual(
    validateRuntimeSettingsPatch({ cameraUrl: " http://192.168.1.20/snap.jpg " }),
    { cameraUrl: "http://192.168.1.20/snap.jpg" },
  );
  assert.deepEqual(validateRuntimeSettingsPatch({ cameraUrl: null }), { cameraUrl: null });
  assert.throws(() => validateRuntimeSettingsPatch({ cameraUrl: "rtsp://192.168.1.20/stream" }), /cameraUrl must be/);
});

test("extracts the first whole JPEG from an MJPEG stream", () => {
  const jpeg = Buffer.from([0xff, 0xd8, 0x01, 0x02, 0x03, 0xff, 0xd9]);
  const stream = Buffer.concat([
    Buffer.from("--frame\r\nContent-Type: image/jpeg\r\n\r\n"),
    jpeg,
    Buffer.from("\r\n--frame\r\n"),
    jpeg,
  ]);
  assert.deepEqual(extractJpegFrame(stream), jpeg);
  assert.equal(extractJpegFrame(stream.subarray(0, stream.indexOf(jpeg) + 4)), null);
  assert.equal(extractJpegFrame(Buffer.from("no image here")), null);
});

test("answers a digest challenge", () => {
  const md5 = (value: string) => createHash("md5").update(value).digest("hex");
  const header = digestAuthorization(
    'Digest realm="cam", nonce="abc", qop="auth", opaque="xyz"',
    { method: "GET", uri: "/snap.jpg", username: "admin", password: "secret" },
    "0a0b",
  );
  const expected = md5(`${md5("admin:cam:secret")}:abc:00000001:0a0b:auth:${md5("GET:/snap.jpg")}`);
  assert.ok(header?.startsWith("Digest "));
  assert.ok(header?.includes(`response="${expected}"`));
  assert.ok(header?.includes('opaque="xyz"'));
  assert.equal(
    digestAuthorization('Basic realm="cam"', { method: "GET", uri: "/", username: "a", password: "b" }),
    null,
  );
});
