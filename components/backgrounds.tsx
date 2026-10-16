// ─── Weather code sets ────────────────────────────────────────────────────────

const CLEAR_CODES   = new Set([0]);
const PARTLY_CODES  = new Set([1, 2]);
const OVERCAST_CODE = new Set([3]);
const FOG_CODES     = new Set([45, 48]);
const DRIZZLE_CODES = new Set([51, 53, 55, 56, 57]);
const RAIN_CODES    = new Set([61, 63, 65, 66, 67, 80, 81, 82]);
const SNOW_CODES    = new Set([71, 73, 75, 77, 85, 86]);
const STORM_CODES   = new Set([95, 96, 99]);

type DayWeatherType = "clear" | "partly" | "overcast" | "fog" | "drizzle" | "rain" | "snow" | "storm";

function getDayWeatherType(code: number): DayWeatherType {
  if (CLEAR_CODES.has(code))   return "clear";
  if (PARTLY_CODES.has(code))  return "partly";
  if (OVERCAST_CODE.has(code)) return "overcast";
  if (FOG_CODES.has(code))     return "fog";
  if (DRIZZLE_CODES.has(code)) return "drizzle";
  if (RAIN_CODES.has(code))    return "rain";
  if (SNOW_CODES.has(code))    return "snow";
  if (STORM_CODES.has(code))   return "storm";
  return "partly";
}

// ─── Daytime backgrounds (10–17h) ────────────────────────────────────────────

const DAY_BACKGROUNDS: Record<DayWeatherType, string> = {
  // Rich cerulean — vibrant open sky, clearly "day"
  clear:
    "linear-gradient(170deg, #1a4a8a 0%, #1558b0 35%, #1060c0 65%, #0a3d80 100%)",

  // Softer blue with a faint grey veil — sun behind thin cloud
  partly:
    "linear-gradient(165deg, #2a5a8a 0%, #2060a0 45%, #245890 70%, #163c6a 100%)",

  // Slate grey-blue — flat overcast, no warmth at all
  overcast:
    "linear-gradient(160deg, #3a4858 0%, #2e3c4e 50%, #243040 80%, #1a2230 100%)",

  // Milky blue-grey, washed out — low visibility, diffused light
  fog:
    "linear-gradient(160deg, #5a7080 0%, #4a6070 50%, #3a5060 80%, #283840 100%)",

  // Muted steel blue — between overcast and rain, slight gloom
  drizzle:
    "linear-gradient(165deg, #1e4060 0%, #1a3858 50%, #152e4a 80%, #101e30 100%)",

  // Deep steel — heavy, pressing dark sky
  rain:
    "linear-gradient(160deg, #182030 0%, #101828 50%, #0c1220 80%, #070d18 100%)",

  // Cold silver-blue — crisp winter light, brighter than you'd expect
  snow:
    "linear-gradient(165deg, #5a7a9a 0%, #4a6888 50%, #3a5575 80%, #283848 100%)",

  // Near-black violet bruise — sky before a violent storm
  storm:
    "linear-gradient(160deg, #120a20 0%, #0c0818 50%, #080510 80%, #040308 100%)",
};

// ─── Daytime atmospheric overlays ────────────────────────────────────────────

const DAY_OVERLAYS: Record<DayWeatherType, string> = {
  // Strong warm-blue zenith glow — feels genuinely sunny
  clear:
    "radial-gradient(ellipse 160% 70% at 50% -10%, rgba(80,150,255,0.35) 0%, rgba(40,100,220,0.15) 40%, transparent 70%)",

  // Softer, slightly hazy blue glow
  partly:
    "radial-gradient(ellipse 140% 65% at 50% 0%, rgba(60,120,220,0.22) 0%, rgba(30,80,180,0.10) 45%, transparent 70%)",

  // Cool grey wash — no colour, just flat diffused light
  overcast:
    "radial-gradient(ellipse 130% 55% at 50% 0%, rgba(100,120,150,0.18) 0%, transparent 65%)",

  // Wide soft white bloom — mimics diffused foggy light
  fog:
    "radial-gradient(ellipse 180% 80% at 50% 5%, rgba(180,200,220,0.18) 0%, rgba(140,170,190,0.08) 50%, transparent 75%)",

  // Subdued blue — rain clouds blocking direct light
  drizzle:
    "radial-gradient(ellipse 130% 60% at 50% 0%, rgba(50,90,160,0.20) 0%, transparent 65%)",

  // Dark cold blue — heavy rain, sky is pressing down
  rain:
    "radial-gradient(ellipse 120% 50% at 50% 0%, rgba(20,40,80,0.22) 0%, transparent 60%)",

  // Wide cool-white diffusion — winter sky, pale and bright at horizon
  snow:
    "radial-gradient(ellipse 170% 75% at 50% 0%, rgba(180,210,240,0.22) 0%, rgba(140,180,220,0.10) 50%, transparent 75%)",

  // Dark purple-indigo bruise — storm clouds eating the sky
  storm:
    "radial-gradient(ellipse 150% 65% at 35% 0%, rgba(60,20,100,0.28) 0%, rgba(20,10,50,0.15) 50%, transparent 70%)",
};

// ─── Main exported functions ──────────────────────────────────────────────────

/**
 * Returns the CSS background gradient for the given hour + weather code.
 * Daytime (10–17h) uses weather-aware variations; other hours follow the sun arc.
 */
export function getDayNightBackground(hour: number, code?: number): string {
  // Deep night — near-black navy
  if (hour >= 0 && hour < 5)
    return "linear-gradient(160deg, #080c14 0%, #060810 60%, #030508 100%)";

  // Pre-dawn — deep indigo, faint warmth creeping in
  if (hour < 7)
    return "linear-gradient(160deg, #0e0c22 0%, #130e28 50%, #09090f 100%)";

  // Sunrise — amber bleeds into blue-violet
  if (hour < 10)
    return "linear-gradient(160deg, #c87941 0%, #7a4a8a 45%, #1a1535 100%)";

  // Daytime — weather-aware
  if (hour < 17) {
    if (code !== undefined) return DAY_BACKGROUNDS[getDayWeatherType(code)];
    return DAY_BACKGROUNDS.clear;
  }

  // Golden hour — deep amber bleeding into mauve
  if (hour < 19)
    return "linear-gradient(160deg, #e8912a 0%, #a0421a 40%, #3a1a28 100%)";

  // Dusk — deep violet-rose fading to night
  if (hour < 21)
    return "linear-gradient(160deg, #7a1a4a 0%, #3a1230 50%, #0e0814 100%)";

  // Early night — dark blue-grey
  return "linear-gradient(160deg, #141720 0%, #0b0d11 60%, #080a0e 100%)";
}

/**
 * Returns the CSS atmospheric overlay for the given hour + weather code.
 * Daytime uses weather-aware overlays; other hours follow the sun arc.
 */
export function getAtmosphericOverlay(hour: number, code?: number): string {
  // Sunrise — warm amber glow from top
  if (hour >= 7 && hour < 10)
    return "radial-gradient(ellipse 140% 65% at 50% 0%, rgba(220,130,50,0.30) 0%, rgba(150,80,160,0.15) 45%, transparent 70%)";

  // Daytime — weather-aware
  if (hour >= 10 && hour < 17) {
    if (code !== undefined) return DAY_OVERLAYS[getDayWeatherType(code)];
    return DAY_OVERLAYS.clear;
  }

  // Golden hour — rich amber-orange
  if (hour >= 17 && hour < 19)
    return "radial-gradient(ellipse 140% 65% at 50% 0%, rgba(230,140,40,0.32) 0%, rgba(180,70,20,0.18) 45%, transparent 70%)";

  // Dusk — violet-pink bleed
  if (hour >= 19 && hour < 21)
    return "radial-gradient(ellipse 130% 60% at 40% 0%, rgba(160,40,100,0.25) 0%, rgba(80,20,60,0.12) 50%, transparent 70%)";

  // Night — cold blue-indigo
  return "radial-gradient(ellipse 120% 55% at 50% 0%, rgba(40,70,130,0.16) 0%, transparent 65%)";
}