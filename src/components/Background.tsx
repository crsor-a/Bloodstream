import { useEffect, useRef, useState } from 'preact/hooks';
import type { Theme } from '../model/types';
import { incognito, settings } from '../state';
import { approxLocation, sunPosition } from '../lib/sun';
import { prefersReducedMotion } from './controls';
import { PROGRAMS, VERT, type ShaderEffect } from './shaders';

type RGB = [number, number, number];
const STOPS: { e: number; z: RGB; h: RGB; g: RGB; s: number }[] = [
  { e: -18, z: [0.004, 0.006, 0.016], h: [0.012, 0.018, 0.04], g: [0, 0, 0], s: 1 },
  { e: -12, z: [0.01, 0.015, 0.05], h: [0.05, 0.06, 0.14], g: [0.05, 0.04, 0.1], s: 0.85 },
  { e: -6, z: [0.05, 0.07, 0.2], h: [0.36, 0.22, 0.36], g: [0.42, 0.2, 0.22], s: 0.35 },
  { e: -2, z: [0.12, 0.18, 0.42], h: [0.86, 0.45, 0.32], g: [0.95, 0.42, 0.2], s: 0.06 },
  { e: 2, z: [0.18, 0.32, 0.62], h: [1, 0.62, 0.38], g: [1, 0.55, 0.25], s: 0 },
  { e: 8, z: [0.15, 0.38, 0.78], h: [0.88, 0.78, 0.68], g: [0.9, 0.62, 0.38], s: 0 },
  { e: 20, z: [0.1, 0.36, 0.82], h: [0.62, 0.8, 0.97], g: [0.62, 0.56, 0.45], s: 0 },
  { e: 50, z: [0.07, 0.3, 0.78], h: [0.55, 0.76, 0.98], g: [0.5, 0.5, 0.45], s: 0 }
];
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const mix3 = (a: RGB, b: RGB, k: number): RGB => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
const sstep = (a: number, b: number, x: number) => { const u = Math.min(1, Math.max(0, (x - a) / (b - a))); return u * u * (3 - 2 * u); };

/** Sky colors for a sun elevation in degrees. */
export function skyPalette(e: number) {
  let i = STOPS.findIndex(s => s.e > e);
  if (i === -1) i = STOPS.length - 1; if (i === 0) i = 1;
  const a = STOPS[i - 1], b = STOPS[i];
  const k = Math.min(1, Math.max(0, (e - a.e) / (b.e - a.e)));
  return { zenith: mix3(a.z, b.z, k), horizon: mix3(a.h, b.h, k), glow: mix3(a.g, b.g, k), stars: lerp(a.s, b.s, k), sunUp: sstep(-3, 1, e), cloud: lerp(0.45, 0.8, sstep(-8, 6, e)), cloudLight: sstep(-9, 6, e) };
}

/** Moon phase: 0 new, 0.5 full. Synodic month from a known new moon (2000-01-06 18:14 UTC). */
export function moonPhase(ts: number): number {
  const p = ((ts - 947182440000) / 86_400_000 / 29.530588853) % 1;
  return p < 0 ? p + 1 : p;
}

export function skyState(theme: Theme, ts = Date.now()) {
  const loc = theme.location ?? approxLocation(ts);
  const sun = sunPosition(ts, loc.lat, loc.lon);
  const south = loc.lat < 0;
  const az = south ? (sun.azimuth + 180) % 360 : sun.azimuth;
  const x = Math.min(0.95, Math.max(0.05, 0.5 + (south ? -1 : 1) * (az - 180) / 180 * 0.9));
  const y = 0.08 + sun.elevation / 60 * 0.85;
  // The moon sits roughly where the sun was a fraction of a day earlier (its elongation), which is
  // close enough to rise and set at believable times for its phase.
  const phase = moonPhase(ts);
  const illum = (1 - Math.cos(2 * Math.PI * phase)) / 2;
  const mpos = sunPosition(ts - phase * 86_400_000 * 1.035, loc.lat, loc.lon);
  const maz = south ? (mpos.azimuth + 180) % 360 : mpos.azimuth;
  const moon = {
    x: Math.min(0.92, Math.max(0.08, 0.5 + (south ? -1 : 1) * (maz - 180) / 180 * 0.9)),
    y: Math.min(0.9, 0.12 + mpos.elevation / 60 * 0.8),
    k: (phase < 0.5 ? 1 : -1) * illum,
    vis: illum > 0.04 ? sstep(-1, 6, mpos.elevation) * sstep(3, -6, sun.elevation) : 0
  };
  return { ...skyPalette(sun.elevation), x, y, elevation: sun.elevation, moon };
}

const css = (c: RGB) => `rgb(${c.map(v => Math.round(Math.min(1, v) * 255)).join(',')})`;
/** Used when WebGL isn't available, and as the first paint before the shader compiles. */
function fallback(effect: string, theme: Theme): string {
  switch (effect) {
    case 'sky': { const s = skyState(theme); return `linear-gradient(to top, ${css(s.horizon)}, ${css(s.zenith)} 75%)`; }
    case 'aurora': return 'radial-gradient(120% 60% at 50% 70%, rgba(40,220,140,.35), transparent 60%), linear-gradient(#000208, #02060c)';
    case 'rain': return 'radial-gradient(40% 25% at 30% 30%, rgba(255,140,60,.25), transparent), radial-gradient(35% 20% at 70% 45%, rgba(80,140,255,.2), transparent), linear-gradient(#0d1220, #05070d)';
    case 'snow': return 'radial-gradient(60% 30% at 80% 10%, rgba(160,170,190,.25), transparent), linear-gradient(#03050a, #10141d)';
    case 'nebula': return 'radial-gradient(60% 40% at 40% 40%, rgba(140,30,120,.45), transparent), radial-gradient(50% 40% at 65% 60%, rgba(30,70,190,.4), transparent), #020208';
    case 'gradient': return `linear-gradient(160deg, ${theme.colors.join(', ')})`;
    default: return '#000';
  }
}

const hexRGB = (h: string): RGB => { const m = /^#?([0-9a-f]{6})$/i.exec(h); const n = m ? parseInt(m[1], 16) : 0; return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; };

function compile(gl: WebGLRenderingContext, frag: string): WebGLProgram | null {
  const sh = (type: number, src: string) => { const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(s)); return null; } return s; };
  const v = sh(gl.VERTEX_SHADER, VERT), f = sh(gl.FRAGMENT_SHADER, frag);
  if (!v || !f) return null;
  const p = gl.createProgram()!; gl.attachShader(p, v); gl.attachShader(p, f); gl.bindAttribLocation(p, 0, 'p'); gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) { console.warn(gl.getProgramInfoLog(p)); return null; }
  return p;
}

function GLBackground({ effect, theme }: { effect: ShaderEffect; theme: Theme }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [failed, setFailed] = useState(false);
  const themeRef = useRef(theme); themeRef.current = theme;
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    let gl: WebGLRenderingContext | null = null;
    try { gl = canvas.getContext('webgl', { antialias: false, alpha: false, depth: false, stencil: false, powerPreference: 'low-power', preserveDrawingBuffer: false }) as WebGLRenderingContext | null; } catch { gl = null; }
    if (!gl) { setFailed(true); return; }
    const prog = compile(gl, PROGRAMS[effect]);
    if (!prog) { setFailed(true); return; }
    gl.useProgram(prog);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    const U = (n: string) => gl!.getUniformLocation(prog, n);
    const uRes = U('uRes'), uTime = U('uTime'), uSeed = U('uSeed');
    gl.uniform1f(uSeed, 0.37);

    const scale = effect === 'rain' || effect === 'snow' ? 0.62 : 0.5;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.round(window.innerWidth * dpr * scale)), h = Math.max(1, Math.round(window.innerHeight * dpr * scale));
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      gl!.viewport(0, 0, w, h);
      gl!.uniform2f(uRes, w, h);
    };
    resize();

    const setDynamic = () => {
      const th = themeRef.current;
      if (effect === 'sky') {
        const s = skyState(th);
        gl!.uniform3fv(U('uZenith'), s.zenith); gl!.uniform3fv(U('uHorizon'), s.horizon); gl!.uniform3fv(U('uGlow'), s.glow);
        gl!.uniform2f(U('uSun'), s.x, s.y); gl!.uniform1f(U('uSunUp'), s.sunUp); gl!.uniform1f(U('uStarVis'), s.stars); gl!.uniform1f(U('uCloud'), s.cloud);
        gl!.uniform1f(U('uCloudLight'), s.cloudLight); gl!.uniform4f(U('uMoon'), s.moon.x, s.moon.y, s.moon.k, s.moon.vis);
      }
      if (effect === 'gradient') {
        const c = th.colors.length >= 3 ? th.colors : [...th.colors, ...th.colors, ...th.colors].slice(0, 3);
        gl!.uniform3fv(U('uC0'), hexRGB(c[0])); gl!.uniform3fv(U('uC1'), hexRGB(c[1])); gl!.uniform3fv(U('uC2'), hexRGB(c[2]));
      }
    };
    setDynamic();

    const t0 = performance.now() - 20_000; // start mid-animation so nothing looks "empty" on first paint
    let raf = 0, last = 0, lastDyn = 0, running = true;
    const animate = () => themeRef.current.motion && !prefersReducedMotion();
    const draw = (now: number) => {
      gl!.uniform1f(uTime, (now - t0) / 1000);
      gl!.drawArrays(gl!.TRIANGLES, 0, 3);
    };
    const loop = (now: number) => {
      if (!running) return;
      raf = requestAnimationFrame(loop);
      if (now - last < 32) return; // ~30 fps is plenty for ambient motion
      last = now;
      if (now - lastDyn > 30_000) { setDynamic(); lastDyn = now; }
      draw(now);
    };
    const start = () => {
      cancelAnimationFrame(raf);
      setDynamic(); draw(performance.now());
      if (animate() && !document.hidden) { running = true; raf = requestAnimationFrame(loop); } else running = false;
    };
    start();
    // Static mode still refreshes the sky every minute so day turns to night.
    const slow = window.setInterval(() => { if (!running && !document.hidden) { setDynamic(); draw(performance.now()); } }, 60_000);
    const onVis = () => { if (document.hidden) { running = false; cancelAnimationFrame(raf); } else start(); };
    const onResize = () => { resize(); if (!running) draw(performance.now()); };
    const onLost = (e: Event) => { e.preventDefault(); running = false; setFailed(true); };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('resize', onResize);
    canvas.addEventListener('webglcontextlost', onLost);
    (canvas as any).__restart = start;
    return () => {
      running = false; cancelAnimationFrame(raf); clearInterval(slow);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('resize', onResize);
      canvas.removeEventListener('webglcontextlost', onLost);
      gl!.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, [effect]);

  // Theme tweaks (colors, motion, location) apply without recompiling.
  useEffect(() => { (ref.current as any)?.__restart?.(); }, [theme.motion, theme.colors.join(), theme.location?.lat, theme.location?.lon]);

  return (
    <div class="bg" aria-hidden="true" style={{ background: fallback(effect, theme) }}>
      {!failed && <canvas ref={ref} class="bg-canvas" />}
      <div class="bg-dim" style={{ opacity: theme.dim }} />
    </div>
  );
}

/** Full-screen background behind the app. Off in incognito. Turns on the translucent "glass" UI. */
export function Background() {
  const th = settings.value.theme;
  const effect = incognito.value ? 'none' : th.effect;
  useEffect(() => {
    document.documentElement.classList.toggle('glass', effect !== 'none');
    return () => document.documentElement.classList.remove('glass');
  }, [effect]);
  if (effect === 'none') return null;
  if (effect === 'solid') return <div class="bg" aria-hidden="true" style={{ background: th.colors[0] || '#1c1c1e' }}><div class="bg-dim" style={{ opacity: th.dim }} /></div>;
  return <GLBackground key={effect} effect={effect} theme={th} />;
}
