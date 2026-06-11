import React from 'react';

// ─── Geometry helpers ────────────────────────────────────────────────────────

/** Clockwise arc on a circle, angles measured from north (12 o'clock) */
function arc(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const rad = (d: number) => (d - 90) * (Math.PI / 180);
  const x1 = cx + r * Math.cos(rad(startDeg));
  const y1 = cy + r * Math.sin(rad(startDeg));
  const x2 = cx + r * Math.cos(rad(endDeg));
  const y2 = cy + r * Math.sin(rad(endDeg));
  let span = endDeg - startDeg;
  if (span <= 0) span += 360;
  return `M${x1.toFixed(3)},${y1.toFixed(3)} A${r},${r},0,${span > 180 ? 1 : 0},1,${x2.toFixed(3)},${y2.toFixed(3)}`;
}

/** Full circle path (two semicircles) — used in masks and even-odd clips */
function circle(cx: number, cy: number, r: number): string {
  return `M${cx},${cy - r} A${r},${r},0,1,1,${cx},${cy + r} A${r},${r},0,1,1,${cx},${cy - r}Z`;
}

/** Sinusoidal path along the ring's midline — stays within outer/inner bounds */
function wavePath(cx: number, cy: number, midR: number, amp: number, cycles: number, steps = 720): string {
  const pts: string[] = [];
  for (let i = 0; i < steps; i++) {
    const θ = (i / steps) * Math.PI * 2;
    const r = midR + amp * Math.sin(cycles * θ);
    const x = (cx + r * Math.cos(θ - Math.PI / 2)).toFixed(3);
    const y = (cy + r * Math.sin(θ - Math.PI / 2)).toFixed(3);
    pts.push(i === 0 ? `M${x},${y}` : `L${x},${y}`);
  }
  return pts.join('') + 'Z';
}

// ─── Pre-computed paths ───────────────────────────────────────────────────────

const CX = 128, CY = 128;
const R_OUT = 90, R_IN = 68; // ring outer / inner radius
const R_MID = 79;             // waveform midline

// The waveform oscillates ±8 px around the midline → stays within [71, 87],
// well inside the ring bounds of [68, 90].
const WAVE = wavePath(CX, CY, R_MID, 8, 6);

// Even-odd donut = outer circle minus inner circle (used for clip & mask)
const DONUT = circle(CX, CY, R_OUT) + ' ' + circle(CX, CY, R_IN);
// Slightly expanded bloom donut for the wide glow pass
const BLOOM_DONUT = circle(CX, CY, R_OUT + 5) + ' ' + circle(CX, CY, R_IN - 5);

// Specular highlights — three arcs at different radii, upper-left to upper-right
const SPEC_OUT = arc(CX, CY, R_OUT, 302, 24);   // outer glass rim
const SPEC_MID = arc(CX, CY, R_MID, 307, 18);   // waveform track surface
const SPEC_IN  = arc(CX, CY, R_IN,  312, 12);   // inner glass rim

// ─── Logo component ──────────────────────────────────────────────────────────

export default function PulseLogo({ size = 256 }: { size?: number }) {
  // Every instance gets a unique ID prefix so multiple instances share no defs
  const p = `pl${size}`;

  return (
    <svg
      viewBox="0 0 256 256"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block' }}
    >
      <defs>
        {/* ── Filters ── */}
        <filter id={`${p}fb`} x="-110%" y="-110%" width="320%" height="320%" colorInterpolationFilters="sRGB">
          <feGaussianBlur stdDeviation="26"/>
        </filter>
        <filter id={`${p}fg`} x="-65%" y="-65%" width="230%" height="230%" colorInterpolationFilters="sRGB">
          <feGaussianBlur stdDeviation="9" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id={`${p}fe`} x="-30%" y="-30%" width="160%" height="160%" colorInterpolationFilters="sRGB">
          <feGaussianBlur stdDeviation="2.2" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id={`${p}fs`} x="-35%" y="-35%" width="170%" height="170%" colorInterpolationFilters="sRGB">
          <feGaussianBlur stdDeviation="1.4" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>

        {/* ── Colour gradients ── */}

        {/* Main ring — electric purple → deep violet → neon cyan */}
        <linearGradient id={`${p}rg`} x1="8%" y1="3%" x2="92%" y2="97%">
          <stop offset="0%"   stopColor="#E879F9"/>
          <stop offset="28%"  stopColor="#A855F7"/>
          <stop offset="62%"  stopColor="#7C3AED"/>
          <stop offset="100%" stopColor="#22D3EE"/>
        </linearGradient>

        {/* Waveform stroke — lighter, high-key */}
        <linearGradient id={`${p}wg`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#F5D0FE" stopOpacity="0.90"/>
          <stop offset="50%"  stopColor="#C084FC" stopOpacity="0.70"/>
          <stop offset="100%" stopColor="#A5F3FC" stopOpacity="0.75"/>
        </linearGradient>

        {/* Glass fill inside the ring body */}
        <linearGradient id={`${p}gl`} x1="8%" y1="0%" x2="92%" y2="100%">
          <stop offset="0%"   stopColor="#F5D0FE" stopOpacity="0.26"/>
          <stop offset="45%"  stopColor="#7C3AED" stopOpacity="0.15"/>
          <stop offset="100%" stopColor="#0EA5E9" stopOpacity="0.22"/>
        </linearGradient>

        {/* Deep-space tile background */}
        <radialGradient id={`${p}bg`} cx="42%" cy="34%" r="66%">
          <stop offset="0%"   stopColor="#1E082F"/>
          <stop offset="52%"  stopColor="#0D0D20"/>
          <stop offset="100%" stopColor="#07070E"/>
        </radialGradient>

        {/* Ambient centre wash — spills into the hollow */}
        <radialGradient id={`${p}am`} cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#8B21F5" stopOpacity="0.22"/>
          <stop offset="52%"  stopColor="#5B21B6" stopOpacity="0.07"/>
          <stop offset="100%" stopColor="#000"    stopOpacity="0"/>
        </radialGradient>

        {/* Soft violet glow inside the ring's hollow centre */}
        <radialGradient id={`${p}ig`} cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#9333EA" stopOpacity="0.16"/>
          <stop offset="65%"  stopColor="#6D28D9" stopOpacity="0.05"/>
          <stop offset="100%" stopColor="#000"    stopOpacity="0"/>
        </radialGradient>

        {/* ── Structural clips & masks ── */}

        <clipPath id={`${p}tc`}>
          <rect width="256" height="256" rx="52"/>
        </clipPath>

        {/* Even-odd clip = ring donut region only */}
        <clipPath id={`${p}rc`} clipPathUnits="userSpaceOnUse">
          <path fillRule="evenodd" d={DONUT}/>
        </clipPath>

        {/* Bloom mask = slightly wider donut, drives the outer glow */}
        <mask id={`${p}bm`}>
          <path fill="white" fillRule="evenodd" d={BLOOM_DONUT}/>
        </mask>
      </defs>

      {/* ── Tile background ── */}
      <rect width="256" height="256" rx="52" fill={`url(#${p}bg)`}/>

      <g clipPath={`url(#${p}tc)`}>

        {/* Ambient centre wash (spills across full tile) */}
        <rect width="256" height="256" fill={`url(#${p}am)`}/>

        {/* Soft violet glow in the hollow centre of the ring */}
        <circle cx="128" cy="128" r="66" fill={`url(#${p}ig)`}/>

        {/* ── Pass 1: wide bloom ── */}
        <rect width="256" height="256"
          mask={`url(#${p}bm)`}
          fill={`url(#${p}rg)`}
          filter={`url(#${p}fb)`}
          opacity="0.82"
        />

        {/* ── Pass 2: mid glow (ring-width stroke, blurred) ── */}
        <circle cx="128" cy="128" r={R_MID}
          fill="none"
          stroke={`url(#${p}rg)`}
          strokeWidth="28"
          filter={`url(#${p}fg)`}
          opacity="0.52"
        />

        {/* ── Pass 3: ring glass body ── */}
        <g clipPath={`url(#${p}rc)`}>
          {/* Glass fill */}
          <rect width="256" height="256" fill={`url(#${p}gl)`}/>

          {/* Waveform path — runs along the midline of the ring */}
          <path
            d={WAVE}
            fill="none"
            stroke={`url(#${p}wg)`}
            strokeWidth="1.5"
            opacity="0.88"
          />
        </g>

        {/* ── Rim strokes ── */}

        {/* Outer rim — coloured + edge glow */}
        <circle cx="128" cy="128" r={R_OUT}
          fill="none"
          stroke={`url(#${p}rg)`}
          strokeWidth="1.6"
          filter={`url(#${p}fe)`}
        />

        {/* Inner rim — cool blue, faint */}
        <circle cx="128" cy="128" r={R_IN}
          fill="none"
          stroke="#BAE6FD"
          strokeWidth="0.8"
          opacity="0.28"
        />

        {/* ── Specular highlights (glass rim catching light) ── */}

        {/* Outer rim specular */}
        <path d={SPEC_OUT}
          fill="none" stroke="white" strokeWidth="1.9" strokeLinecap="round"
          opacity="0.72"
          filter={`url(#${p}fs)`}
        />

        {/* Waveform-track specular */}
        <path d={SPEC_MID}
          fill="none" stroke="white" strokeWidth="1.1" strokeLinecap="round"
          opacity="0.40"
        />

        {/* Inner rim specular */}
        <path d={SPEC_IN}
          fill="none" stroke="white" strokeWidth="0.9" strokeLinecap="round"
          opacity="0.24"
        />

      </g>
    </svg>
  );
}