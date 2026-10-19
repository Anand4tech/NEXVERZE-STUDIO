import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

function buildDetailedKnotSvg() {
  const W = 1000;
  const H = 1000;
  const cx = W / 2;
  const cy = H / 2;

  // Exact dimensions matching reference image:
  const L = 110;
  const Ro = 200;
  const Ri = 120;
  const bandW = Ro - Ri; // 80
  const Rmid = (Ro + Ri) / 2; // 160

  const tiltAngle = 38; // degrees

  // Full Stadium path (hollow band with evenodd fill)
  function getStadiumPath() {
    return `
      M ${-L} ${-Ro}
      L ${L} ${-Ro}
      A ${Ro} ${Ro} 0 0 1 ${L} ${Ro}
      L ${-L} ${Ro}
      A ${Ro} ${Ro} 0 0 1 ${-L} ${-Ro}
      Z
      M ${-L} ${-Ri}
      L ${L} ${-Ri}
      A ${Ri} ${Ri} 0 0 1 ${L} ${Ri}
      L ${-L} ${Ri}
      A ${Ri} ${Ri} 0 0 1 ${-L} ${-Ri}
      Z
    `;
  }

  function getOuterBorder() {
    return `M ${-L} ${-Ro} L ${L} ${-Ro} A ${Ro} ${Ro} 0 0 1 ${L} ${Ro} L ${-L} ${Ro} A ${Ro} ${Ro} 0 0 1 ${-L} ${-Ro} Z`;
  }

  function getInnerBorder() {
    return `M ${-L} ${-Ri} L ${L} ${-Ri} A ${Ri} ${Ri} 0 0 1 ${L} ${Ri} L ${-L} ${Ri} A ${Ri} ${Ri} 0 0 1 ${-L} ${-Ri} Z`;
  }

  // Generate PCB tracks matching reference image
  function getCircuitTracks() {
    const lines = [];
    const count = 9;
    const step = (bandW - 16) / (count - 1);

    for (let i = 0; i < count; i++) {
      const r = Ri + 8 + i * step;
      const strokeW = (i === 0 || i === count - 1) ? 1.6 : (i % 2 === 0 ? 2.2 : 1.7);
      const color = i % 2 === 0 ? '#64748b' : '#78889b';

      // Top straight section
      if (i % 2 === 0) {
        lines.push(`
          <path d="M ${-L + 15} ${-r} L ${L - 25} ${-r}" fill="none" stroke="${color}" stroke-width="${strokeW}" stroke-linecap="round" />
          <circle cx="${-L + 15}" cy="${-r}" r="2.8" fill="#f8fafc" stroke="${color}" stroke-width="1.3" />
        `);
      } else {
        const jog = -L + 30 + i * 10;
        lines.push(`
          <path d="M ${-L + 25} ${-r} L ${jog} ${-r} l 8 8 L ${L - 15} ${-r + 8}" fill="none" stroke="${color}" stroke-width="${strokeW}" stroke-linecap="round" />
          <circle cx="${L - 15}" cy="${-r + 8}" r="2.8" fill="#f8fafc" stroke="${color}" stroke-width="1.3" />
        `);
      }

      // Bottom straight section
      if (i % 2 === 1) {
        lines.push(`
          <path d="M ${-L + 20} ${r} L ${L - 15} ${r}" fill="none" stroke="${color}" stroke-width="${strokeW}" stroke-linecap="round" />
          <circle cx="${L - 15}" cy="${r}" r="2.8" fill="#f8fafc" stroke="${color}" stroke-width="1.3" />
        `);
      } else {
        const jog = L - 40 - i * 8;
        lines.push(`
          <path d="M ${-L + 10} ${r} L ${jog} ${r} l -8 -8 L ${-L + 35} ${r - 8}" fill="none" stroke="${color}" stroke-width="${strokeW}" stroke-linecap="round" />
          <circle cx="${-L + 10}" cy="${r}" r="2.8" fill="#f8fafc" stroke="${color}" stroke-width="1.3" />
        `);
      }

      // Curved caps tracks with dashing & via clusters
      lines.push(`
        <path d="M ${L} ${-r} A ${r} ${r} 0 0 1 ${L} ${r}" fill="none" stroke="${color}" stroke-width="${strokeW}" stroke-linecap="round" stroke-dasharray="${i % 2 === 0 ? '55, 18, 70' : '40, 15, 45, 15, 60'}" />
        <path d="M ${-L} ${r} A ${r} ${r} 0 0 1 ${-L} ${-r}" fill="none" stroke="${color}" stroke-width="${strokeW}" stroke-linecap="round" stroke-dasharray="${i % 3 === 0 ? '60, 20, 50, 20' : '35, 12, 80'}" />
      `);

      // Radial Vias around the caps
      if (i % 2 === 0) {
        const a1 = Math.PI * 0.18;
        const a2 = -Math.PI * 0.25;
        lines.push(`
          <circle cx="${L + r * Math.cos(a1)}" cy="${r * Math.sin(a1)}" r="2.8" fill="#f8fafc" stroke="${color}" stroke-width="1.3" />
          <circle cx="${L + r * Math.cos(a2)}" cy="${r * Math.sin(a2)}" r="2.8" fill="#f8fafc" stroke="${color}" stroke-width="1.3" />
        `);
      }
      if (i % 3 === 0) {
        const a1 = Math.PI * 0.22;
        const a2 = -Math.PI * 0.18;
        lines.push(`
          <circle cx="${-L - r * Math.cos(a1)}" cy="${r * Math.sin(a1)}" r="2.8" fill="#f8fafc" stroke="${color}" stroke-width="1.3" />
          <circle cx="${-L - r * Math.cos(a2)}" cy="${r * Math.sin(a2)}" r="2.8" fill="#f8fafc" stroke="${color}" stroke-width="1.3" />
        `);
      }
    }

    // Array of perpendicular bus vias matching reference image
    for (let k = 0; k < 7; k++) {
      const yVia = -Ri - 10 - k * 9;
      lines.push(`
        <line x1="${-L + 40}" y1="${yVia}" x2="${-L + 50}" y2="${yVia}" stroke="#64748b" stroke-width="1.5" />
        <circle cx="${-L + 40}" cy="${yVia}" r="2.4" fill="#f8fafc" stroke="#64748b" stroke-width="1.2" />
        <circle cx="${-L + 50}" cy="${yVia}" r="2.4" fill="#f8fafc" stroke="#64748b" stroke-width="1.2" />
      `);
    }

    for (let k = 0; k < 7; k++) {
      const yVia = Ri + 10 + k * 9;
      lines.push(`
        <line x1="${L - 45}" y1="${yVia}" x2="${L - 35}" y2="${yVia}" stroke="#64748b" stroke-width="1.5" />
        <circle cx="${L - 45}" cy="${yVia}" r="2.4" fill="#f8fafc" stroke="#64748b" stroke-width="1.2" />
        <circle cx="${L - 35}" cy="${yVia}" r="2.4" fill="#f8fafc" stroke="#64748b" stroke-width="1.2" />
      `);
    }

    // Microchip on the top straight band
    lines.push(`
      <g transform="translate(15, -${Rmid})">
        <g stroke="#94a3b8" stroke-width="1.6" stroke-linecap="round">
          <line x1="-10" y1="-23" x2="-10" y2="-17" />
          <line x1="-4" y1="-23" x2="-4" y2="-17" />
          <line x1="4" y1="-23" x2="4" y2="-17" />
          <line x1="10" y1="-23" x2="10" y2="-17" />

          <line x1="-10" y1="17" x2="-10" y2="23" />
          <line x1="-4" y1="17" x2="-4" y2="23" />
          <line x1="4" y1="17" x2="4" y2="23" />
          <line x1="10" y1="17" x2="10" y2="23" />

          <line x1="-23" y1="-8" x2="-17" y2="-8" />
          <line x1="-23" y1="0" x2="-17" y2="0" />
          <line x1="-23" y1="8" x2="-17" y2="8" />

          <line x1="17" y1="-8" x2="23" y2="-8" />
          <line x1="17" y1="0" x2="23" y2="0" />
          <line x1="17" y1="8" x2="23" y2="8" />
        </g>
        <rect x="-17" y="-17" width="34" height="34" rx="4" fill="url(#chipSurfaceGrad)" stroke="#78889b" stroke-width="1.7" filter="url(#dropShadSubtle)" />
        <rect x="-11" y="-11" width="22" height="22" rx="2.5" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.1" />
        <circle cx="-6" cy="-6" r="1.5" fill="#64748b" />
      </g>
    `);

    // Microchip on bottom straight band
    lines.push(`
      <g transform="translate(-15, ${Rmid})">
        <g stroke="#94a3b8" stroke-width="1.6" stroke-linecap="round">
          <line x1="-10" y1="-23" x2="-10" y2="-17" />
          <line x1="-4" y1="-23" x2="-4" y2="-17" />
          <line x1="4" y1="-23" x2="4" y2="-17" />
          <line x1="10" y1="-23" x2="10" y2="-17" />

          <line x1="-10" y1="17" x2="-10" y2="23" />
          <line x1="-4" y1="17" x2="-4" y2="23" />
          <line x1="4" y1="17" x2="4" y2="23" />
          <line x1="10" y1="17" x2="10" y2="23" />

          <line x1="-23" y1="-8" x2="-17" y2="-8" />
          <line x1="-23" y1="0" x2="-17" y2="0" />
          <line x1="-23" y1="8" x2="-17" y2="8" />

          <line x1="17" y1="-8" x2="23" y2="-8" />
          <line x1="17" y1="0" x2="23" y2="0" />
          <line x1="17" y1="8" x2="23" y2="8" />
        </g>
        <rect x="-17" y="-17" width="34" height="34" rx="4" fill="url(#chipSurfaceGrad)" stroke="#78889b" stroke-width="1.7" filter="url(#dropShadSubtle)" />
        <rect x="-11" y="-11" width="22" height="22" rx="2.5" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.1" />
        <circle cx="-6" cy="-6" r="1.5" fill="#64748b" />
      </g>
    `);

    return lines.join('\n');
  }

  const stadiumFill = getStadiumPath();
  const outerBorder = getOuterBorder();
  const innerBorder = getInnerBorder();

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <defs>
    <!-- Soft Emboss Gradients -->
    <linearGradient id="bodyGradA" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="35%" stop-color="#f8fafc" />
      <stop offset="70%" stop-color="#f1f5f9" />
      <stop offset="100%" stop-color="#e2e8f0" />
    </linearGradient>

    <linearGradient id="bodyGradB" x1="100%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="40%" stop-color="#f8fafc" />
      <stop offset="80%" stop-color="#e2e8f0" />
      <stop offset="100%" stop-color="#cbd5e1" />
    </linearGradient>

    <linearGradient id="rimGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="50%" stop-color="#94a3b8" />
      <stop offset="100%" stop-color="#cbd5e1" />
    </linearGradient>

    <linearGradient id="chipSurfaceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="60%" stop-color="#f1f5f9" />
      <stop offset="100%" stop-color="#cbd5e1" />
    </linearGradient>

    <filter id="crossoverShad" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="7" stdDeviation="8" flood-color="#475569" flood-opacity="0.45" />
    </filter>

    <filter id="dropShadSubtle" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#475569" flood-opacity="0.35" />
    </filter>

    <filter id="masterDropShadow" x="-15%" y="-15%" width="130%" height="130%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#334155" flood-opacity="0.25" />
    </filter>

    <!-- Master loop definitions -->
    <g id="loop1Graphic">
      <path d="${stadiumFill}" fill="url(#bodyGradA)" fill-rule="evenodd" />
      <path d="${outerBorder}" fill="none" stroke="url(#rimGrad)" stroke-width="4.0" />
      <path d="${outerBorder}" fill="none" stroke="#ffffff" stroke-width="1.8" opacity="0.9" />
      <path d="${innerBorder}" fill="none" stroke="url(#rimGrad)" stroke-width="4.0" />
      <path d="${innerBorder}" fill="none" stroke="#ffffff" stroke-width="1.8" opacity="0.9" />
      ${getCircuitTracks()}
    </g>

    <g id="loop2Graphic">
      <path d="${stadiumFill}" fill="url(#bodyGradB)" fill-rule="evenodd" />
      <path d="${outerBorder}" fill="none" stroke="url(#rimGrad)" stroke-width="4.0" />
      <path d="${outerBorder}" fill="none" stroke="#ffffff" stroke-width="1.8" opacity="0.9" />
      <path d="${innerBorder}" fill="none" stroke="url(#rimGrad)" stroke-width="4.0" />
      <path d="${innerBorder}" fill="none" stroke="#ffffff" stroke-width="1.8" opacity="0.9" />
      ${getCircuitTracks()}
    </g>

    <!-- Clip paths for Loop 1 (underlying surface) to receive crossover shadows -->
    <clipPath id="loop1Clip">
      <g transform="rotate(${-tiltAngle})">
        <path d="${stadiumFill}" fill-rule="evenodd" />
      </g>
    </clipPath>

    <!-- Clip paths for Loop 2 crossing OVER Loop 1 on Right and Left sides -->
    <!-- In world coords, Right crossing is at (260, 0), Left crossing is at (-260, 0) -->
    <!-- Circles of radius 110 at (+260, 0) and (-260, 0) completely enclose each crossing without touching any other crossing! -->
    <clipPath id="sideCrossingsClip">
      <circle cx="260" cy="0" r="115" />
      <circle cx="-260" cy="0" r="115" />
    </clipPath>
  </defs>

  <g transform="translate(${cx}, ${cy})" filter="url(#masterDropShadow)">
    
    <!-- 1. FULL LOOP 2 (Tilted +${tiltAngle} deg) -->
    <g transform="rotate(${tiltAngle})">
      <use href="#loop2Graphic" />
    </g>

    <!-- 2. FULL LOOP 1 (Tilted -${tiltAngle} deg) - Passes OVER Loop 2 at Top (0, -203) and Bottom (0, 203) -->
    <g transform="rotate(${-tiltAngle})" filter="url(#crossoverShad)">
      <use href="#loop1Graphic" />
    </g>

    <!-- 3. WEAVE OVERLAY: Loop 2 passing OVER Loop 1 at RIGHT and LEFT crossings -->
    <!-- Since it uses identical #loop2Graphic, pixels match with 100% precision with NO seams -->
    <g clip-path="url(#sideCrossingsClip)">
      <g transform="rotate(${tiltAngle})">
        <use href="#loop2Graphic" />
      </g>
    </g>

    <!-- 4. REALISTIC WEAVE SHADOW: Loop 2 casts crossover shadows onto Loop 1 at Right and Left crossings -->
    <g clip-path="url(#loop1Clip)">
      <!-- Right crossing shadow along Loop 2 borders -->
      <g transform="rotate(${tiltAngle})">
        <path d="${outerBorder}" fill="none" stroke="#334155" stroke-width="10" opacity="0.32" filter="url(#crossoverShad)" />
        <path d="${innerBorder}" fill="none" stroke="#334155" stroke-width="10" opacity="0.32" filter="url(#crossoverShad)" />
      </g>
    </g>

  </g>
</svg>
`;

  return svg;
}

async function run() {
  const svg = buildDetailedKnotSvg();
  const svgPath = path.resolve('public/studio/icon_infinity_transparent.svg');
  const pngPath = path.resolve('public/studio/icon_infinity_transparent.png');
  const distPngPath = path.resolve('dist/studio/icon_infinity_transparent.png');
  const distSvgPath = path.resolve('dist/studio/icon_infinity_transparent.svg');
  const rootIconPath = path.resolve('public/nexverze-icon.png');
  const distRootIconPath = path.resolve('dist/nexverze-icon.png');

  fs.writeFileSync(svgPath, svg, 'utf-8');
  console.log('SVG written to', svgPath);

  // Render ultra crisp PNG with Sharp and trim excess transparent padding so watermark fits snugly
  const rawPngBuffer = await sharp(Buffer.from(svg))
    .resize(1024, 1024, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ quality: 100 })
    .toBuffer();

  // Trim transparent edges so the logo bounding box has zero dead space!
  const trimmed = await sharp(rawPngBuffer)
    .trim()
    .toBuffer();

  // Resize trimmed logo to standard high-res watermark (e.g. 512x512)
  await sharp(trimmed)
    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(pngPath);

  console.log('Pristine trimmed PNG written to', pngPath);

  // Copy to dist and root icon
  fs.copyFileSync(pngPath, rootIconPath);
  if (fs.existsSync('dist/studio')) {
    fs.copyFileSync(pngPath, distPngPath);
    fs.copyFileSync(svgPath, distSvgPath);
  }
  if (fs.existsSync('dist/nexverze-icon.png')) {
    fs.copyFileSync(pngPath, distRootIconPath);
  }
  console.log('All watermark destinations synchronized successfully!');
}

run().catch(console.error);
