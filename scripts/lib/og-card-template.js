/**
 * Dynamic OpenGraph SVG Template & Typography Engine for GCloudCafe
 * Dimensions: 1200 x 630 px
 */

/**
 * Escapes characters for safe XML/SVG embedding
 */
function escapeXml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Breaks long strings into multiple lines respecting word boundaries
 */
function wrapText(text, maxCharsPerLine = 36, maxLines = 3) {
  if (!text) return [];
  const words = text.trim().split(/\s+/);
  const lines = [];
  let currentLine = '';

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const testLine = currentLine ? currentLine + ' ' + word : word;

    if (testLine.length <= maxCharsPerLine) {
      currentLine = testLine;
    } else {
      if (lines.length + 1 === maxLines) {
        // Last permitted line: truncate with ellipsis if words remain
        const truncated = (currentLine ? currentLine + ' ' : '') + word;
        if (truncated.length > maxCharsPerLine - 3) {
          lines.push(truncated.slice(0, maxCharsPerLine - 3).trim() + '...');
        } else {
          lines.push(truncated + '...');
        }
        currentLine = '';
        break;
      } else {
        if (currentLine) {
          lines.push(currentLine);
        }
        currentLine = word;
      }
    }
  }

  if (currentLine && lines.length < maxLines) {
    lines.push(currentLine);
  }

  return lines;
}

/**
 * Resolves category theme (accent color, label, borders)
 */
function getCategoryTheme(tags = [], categories = []) {
  const combined = [
    ...(Array.isArray(categories) ? categories : []),
    ...(Array.isArray(tags) ? tags : [])
  ].map(t => String(t).toUpperCase().replace(/^#/, ''));

  if (combined.some(t => t.includes('GCP') || t.includes('GOOGLE') || t.includes('BIGQUERY') || t.includes('DATAFORM'))) {
    if (combined.some(t => t.includes('DATA'))) {
      return {
        label: 'GOOGLE CLOUD · DATA ENGINEERING',
        accentColor: '#38bdf8', // sky-400
        bgGradient: 'rgba(56, 189, 248, 0.15)',
        borderColor: 'rgba(56, 189, 248, 0.4)'
      };
    }
    return {
      label: 'GOOGLE CLOUD',
      accentColor: '#38bdf8',
      bgGradient: 'rgba(56, 189, 248, 0.15)',
      borderColor: 'rgba(56, 189, 248, 0.4)'
    };
  }

  if (combined.some(t => t.includes('KUBERNETES') || t.includes('K8S') || t.includes('CNCF'))) {
    return {
      label: 'KUBERNETES',
      accentColor: '#22d3ee', // cyan-400
      bgGradient: 'rgba(34, 211, 238, 0.15)',
      borderColor: 'rgba(34, 211, 238, 0.4)'
    };
  }

  if (combined.some(t => t.includes('AWS') || t.includes('AMAZON'))) {
    return {
      label: 'AWS',
      accentColor: '#fbbf24', // amber-400
      bgGradient: 'rgba(251, 191, 36, 0.15)',
      borderColor: 'rgba(251, 191, 36, 0.4)'
    };
  }

  if (combined.some(t => t.includes('SECURITY') || t.includes('TLS') || t.includes('MTLS'))) {
    return {
      label: 'ZERO TRUST · SECURITY',
      accentColor: '#c084fc', // purple-400
      bgGradient: 'rgba(192, 132, 252, 0.15)',
      borderColor: 'rgba(192, 132, 252, 0.4)'
    };
  }

  if (combined.some(t => t.includes('OPENSHIFT') || t.includes('REDHAT'))) {
    return {
      label: 'OPENSHIFT',
      accentColor: '#fb7185', // rose-400
      bgGradient: 'rgba(251, 113, 133, 0.15)',
      borderColor: 'rgba(251, 113, 133, 0.4)'
    };
  }

  return {
    label: (combined[0] || 'CLOUD ARCHITECTURE').replace(/_/g, ' '),
    accentColor: '#34d399', // emerald-400
    bgGradient: 'rgba(52, 211, 153, 0.15)',
    borderColor: 'rgba(52, 211, 153, 0.4)'
  };
}

/**
 * Generates the complete 1200x630 SVG string
 */
function buildOgSvg(metadata = {}) {
  const title = metadata.title || 'GCloudCafe Technical Guide';
  const description = metadata.description || 'Deep architectural deep dives, production benchmarks, and cloud engineering.';
  const author = metadata.author || 'Tharun Vempati';
  const date = metadata.date || 'Oct 2026';
  const readingTime = metadata.readingTime || '8 min read';
  const theme = getCategoryTheme(metadata.tags, metadata.categories);

  const titleLines = wrapText(title, 36, 3);
  const descLines = wrapText(description, 62, 2);

  const titleFontSize = titleLines.length > 2 ? 48 : 54;
  const titleLineHeight = titleFontSize + 14;

  const titleStartYSvg = titleLines.length === 1 ? 270 : (titleLines.length === 2 ? 240 : 210);

  const titleTspans = titleLines.map((line, idx) => {
    const y = titleStartYSvg + idx * titleLineHeight;
    return `<text x="80" y="${y}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="${titleFontSize}" font-weight="800" fill="#f8fafc" letter-spacing="-0.025em">${escapeXml(line)}</text>`;
  }).join('\n      ');

  const descStartYSvg = titleStartYSvg + titleLines.length * titleLineHeight + 16;
  const descTspans = descLines.map((line, idx) => {
    const y = descStartYSvg + idx * 36;
    return `<text x="80" y="${y}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="24" font-weight="400" fill="#94a3b8" letter-spacing="-0.01em">${escapeXml(line)}</text>`;
  }).join('\n      ');

  return `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Background Radial Gradients -->
    <radialGradient id="topRightGlow" cx="88%" cy="12%" r="48%">
      <stop offset="0%" stop-color="#0284c7" stop-opacity="0.22" />
      <stop offset="60%" stop-color="#0369a1" stop-opacity="0.06" />
      <stop offset="100%" stop-color="#070b16" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="bottomLeftGlow" cx="12%" cy="88%" r="44%">
      <stop offset="0%" stop-color="#e11d48" stop-opacity="0.14" />
      <stop offset="70%" stop-color="#be123c" stop-opacity="0.03" />
      <stop offset="100%" stop-color="#070b16" stop-opacity="0" />
    </radialGradient>

    <!-- Subtle Dot Grid Pattern -->
    <pattern id="dotGrid" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1.2" fill="#334155" fill-opacity="0.25" />
    </pattern>

    <!-- Linear Accent for Card Edge -->
    <linearGradient id="edgeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.accentColor}" stop-opacity="0.5" />
      <stop offset="50%" stop-color="#334155" stop-opacity="0.3" />
      <stop offset="100%" stop-color="#e11d48" stop-opacity="0.4" />
    </linearGradient>
  </defs>

  <!-- Solid Canvas Background -->
  <rect width="1200" height="630" fill="#070b16" />

  <!-- Ambient Light Gradients -->
  <rect width="1200" height="630" fill="url(#topRightGlow)" />
  <rect width="1200" height="630" fill="url(#bottomLeftGlow)" />

  <!-- Dot Grid Pattern -->
  <rect width="1200" height="630" fill="url(#dotGrid)" opacity="0.75" />

  <!-- Outer Glass Frame -->
  <rect x="36" y="36" width="1128" height="558" rx="24" fill="#0b1329" fill-opacity="0.45" stroke="url(#edgeGradient)" stroke-width="1.5" />

  <!-- Top Header Row -->
  <g transform="translate(80, 80)">
    <!-- Brand Mark -->
    <g transform="translate(0, 4)">
      <!-- Cloud Icon SVG Shape -->
      <path d="M7 16a4 4 0 0 1-.88-7.9A5 5 0 0 1 15.9 6 4 4 0 0 1 19 12h.5A3.5 3.5 0 0 1 23 15.5 3.5 3.5 0 0 1 19.5 19H7a4 4 0 0 1 0-3z" transform="scale(1.4)" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="44" y="22" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="900" fill="#f8fafc" letter-spacing="-0.03em">GCloud<tspan fill="#38bdf8">Cafe</tspan></text>
      <text x="166" y="21" font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" font-size="11" font-weight="700" fill="#64748b" letter-spacing="0.12em">· ARCHITECTURE</text>
    </g>

    <!-- Category Pill Badge -->
    <g transform="translate(680, 0)">
      <rect x="0" y="0" width="360" height="38" rx="19" fill="${theme.bgGradient}" stroke="${theme.borderColor}" stroke-width="1.25" />
      <circle cx="20" cy="19" r="4.5" fill="${theme.accentColor}" />
      <text x="34" y="24" font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" font-size="13" font-weight="800" fill="${theme.accentColor}" letter-spacing="0.06em">${escapeXml(theme.label)}</text>
    </g>
  </g>

  <!-- Main Headline -->
  <g>
    ${titleTspans}
  </g>

  <!-- Subtitle / Value Proposition -->
  <g>
    ${descTspans}
  </g>

  <!-- Footer Metadata Bar -->
  <g transform="translate(80, 525)">
    <!-- Thin divider -->
    <line x1="0" y1="-25" x2="1040" y2="-25" stroke="#1e293b" stroke-width="1.2" />

    <!-- Author Avatar Circle -->
    <circle cx="20" cy="18" r="18" fill="#1e293b" stroke="#38bdf8" stroke-width="1.5" />
    <text x="20" y="24" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="14" font-weight="bold" fill="#38bdf8">TV</text>

    <!-- Author & Post Meta -->
    <text x="50" y="24" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="600" fill="#e2e8f0">
      ${escapeXml(author)}
      <tspan fill="#475569">  •  </tspan>
      <tspan font-family="ui-monospace, monospace" font-size="14" fill="#94a3b8">${escapeXml(date)}</tspan>
      <tspan fill="#475569">  •  </tspan>
      <tspan font-family="ui-monospace, monospace" font-size="14" fill="#94a3b8">${escapeXml(readingTime)}</tspan>
    </text>

    <!-- Right Brand Watermark -->
    <text x="1040" y="24" text-anchor="end" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="15" font-weight="700" fill="#64748b" letter-spacing="0.02em">
      <tspan fill="#10b981">⚡ </tspan>gcloudcafe.com
    </text>
  </g>
</svg>`;
}

module.exports = {
  escapeXml,
  wrapText,
  getCategoryTheme,
  buildOgSvg
};
