import assert from "node:assert/strict";
import test from "node:test";
import { detectLocale, errorCopy, newsMarket, relativeHours, translate, weatherCondition } from "./i18n";

test("detects English and Portuguese, and falls back to Portuguese", () => {
  assert.equal(detectLocale("en"), "en");
  assert.equal(detectLocale(null, "en-US"), "en");
  assert.equal(detectLocale("pt"), "pt-BR");
  assert.equal(detectLocale("pt-BR"), "pt-BR");
  assert.equal(detectLocale("  EN-gb "), "en");
  assert.equal(detectLocale(null, "fr-FR"), "pt-BR");
  assert.equal(detectLocale("mars"), "pt-BR");
});

test("saved locale wins over the browser language", () => {
  assert.equal(detectLocale("en", "pt-BR"), "en");
  assert.equal(detectLocale("pt-BR", "en-US"), "pt-BR");
});

test("translates known keys and interpolates values", () => {
  assert.equal(translate("en", "retry"), "Try again");
  assert.equal(translate("pt-BR", "retry"), "Tentar novamente");
  assert.equal(translate("en", "calendarInDays", { days: 3, title: "Trip" }), "3 days until Trip");
  assert.equal(translate("pt-BR", "weatherFeels", { temp: 22 }), "Sensação 22°C");
});

test("falls back to English, then the key, for a missing translation", () => {
  assert.equal(translate("pt-BR", "missing-key"), "missing-key");
});

test("maps news markets and weather codes for both languages", () => {
  assert.deepEqual(newsMarket("en"), { hl: "en", gl: "us" });
  assert.deepEqual(newsMarket("pt-BR"), { hl: "pt", gl: "br" });
  assert.equal(weatherCondition(0, "en"), "Clear sky");
  assert.equal(weatherCondition(0, "pt-BR"), "Céu limpo");
  assert.equal(weatherCondition(95, "pt-BR"), "Tempestade");
  assert.equal(weatherCondition(1234, "en"), "Unknown condition");
});

test("formats relative news times and error copy without leaking raw failures", () => {
  assert.equal(relativeHours(1, "en"), "about 1 hour ago");
  assert.equal(relativeHours(4, "pt-BR"), "há cerca de 4 horas");
  assert.equal(errorCopy("timeout", "en"), "The request took too long. Try again.");
  assert.equal(errorCopy("failed", "pt-BR"), "Não foi possível carregar. Verifique a conexão e tente de novo.");
  assert.equal(errorCopy("<html>Bad Gateway</html>", "en"), "Could not load this. Check your connection and try again.");
});
