/**
 * Solar position (NOAA general solar position equations, accurate to a fraction of a degree,
 * plenty for drawing a sky). Pure functions; longitude is east-positive.
 */
const RAD = Math.PI / 180;

export interface SunPos { elevation: number; azimuth: number }

export function sunPosition(ts: number, lat: number, lon: number): SunPos {
  const d = new Date(ts);
  const start = Date.UTC(d.getUTCFullYear(), 0, 1);
  const doy = Math.floor((ts - start) / 86_400_000) + 1;
  const hour = d.getUTCHours() + d.getUTCMinutes() / 60 + d.getUTCSeconds() / 3600;
  const g = 2 * Math.PI / 365 * (doy - 1 + (hour - 12) / 24);
  const eqtime = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
  const decl = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
  const tst = hour * 60 + eqtime + 4 * lon;
  const ha = (tst / 4 - 180) * RAD;
  const phi = lat * RAD;
  const cosZ = Math.sin(phi) * Math.sin(decl) + Math.cos(phi) * Math.cos(decl) * Math.cos(ha);
  const zen = Math.acos(Math.min(1, Math.max(-1, cosZ)));
  const elevation = 90 - zen / RAD;
  // Azimuth measured clockwise from north.
  const sinZ = Math.sin(zen) || 1e-9;
  let az = Math.acos(Math.min(1, Math.max(-1, (Math.sin(phi) * Math.cos(zen) - Math.sin(decl)) / (Math.cos(phi) * sinZ)))) / RAD;
  az = ha > 0 ? (az + 180) % 360 : (540 - az) % 360;
  return { elevation, azimuth: az };
}

/** Sunrise and sunset for the local day containing `ts` (null in polar day or night). */
export function sunTimes(ts: number, lat: number, lon: number): { rise: number | null; set: number | null } {
  const day = new Date(ts); day.setHours(0, 0, 0, 0);
  const t0 = day.getTime(), step = 5 * 60_000;
  let rise: number | null = null, set: number | null = null;
  let prev = sunPosition(t0, lat, lon).elevation;
  for (let t = t0 + step; t <= t0 + 86_400_000; t += step) {
    const e = sunPosition(t, lat, lon).elevation;
    if (prev < -0.833 && e >= -0.833 && rise === null) rise = t;
    if (prev >= -0.833 && e < -0.833) set = t;
    prev = e;
  }
  return { rise, set };
}

/** A rough location when the user hasn't shared one: longitude from the time zone, a hemisphere guess for latitude. */
export function approxLocation(now = Date.now()): { lat: number; lon: number } {
  const y = new Date(now).getFullYear();
  const std = Math.max(new Date(y, 0, 1).getTimezoneOffset(), new Date(y, 6, 1).getTimezoneOffset());
  const lon = Math.max(-180, Math.min(180, -std / 4));
  let tz = '';
  try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch { /* ignore */ }
  const south = /^(Australia|Antarctica)\//.test(tz) || /Auckland|Sao_Paulo|Buenos_Aires|Argentina|Santiago|Montevideo|Johannesburg|Lima|Asuncion|La_Paz|Maputo|Harare|Windhoek|Jakarta|Fiji|Tongatapu/.test(tz);
  return { lat: south ? -30 : 38, lon };
}
