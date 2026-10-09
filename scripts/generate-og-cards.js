const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');
const { buildOgSvg } = require('./lib/og-card-template.js');

/**
 * Parses markdown frontmatter and extracts key metadata fields
 */
function parseFrontmatter(content) {
  if (!content) return {};
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};

  const yamlBlock = match[1];
  const meta = {
    tags: [],
    categories: []
  };

  const lines = yamlBlock.split(/\r?\n/);
  let currentArrayKey = null;

  for (let line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    if (trimmed.startsWith('-') && currentArrayKey) {
      const val = trimmed.replace(/^-\s*/, '').replace(/^["']|["']$/g, '').trim();
      meta[currentArrayKey].push(val);
      continue;
    }

    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;

    const key = line.slice(0, colonIdx).trim();
    let val = line.slice(colonIdx + 1).trim();

    if (val.startsWith('[') && val.endsWith(']')) {
      const items = val.slice(1, -1).split(',')
        .map(s => s.trim().replace(/^["']|["']$/g, ''))
        .filter(Boolean);
      meta[key] = items;
      currentArrayKey = null;
      continue;
    }

    if (!val && (key === 'tags' || key === 'categories')) {
      currentArrayKey = key;
      meta[key] = [];
      continue;
    }

    currentArrayKey = null;
    val = val.replace(/^["']|["']$/g, '').trim();

    if (key === 'title') meta.title = val;
    else if (key === 'meta_title') meta.meta_title = val;
    else if (key === 'description') meta.description = val;
    else if (key === 'date') meta.rawDate = val;
    else if (key === 'author') meta.rawAuthor = val;
  }

  if (meta.rawAuthor === 'tharun-vempati' || !meta.rawAuthor) {
    meta.author = 'Tharun Vempati';
  } else {
    meta.author = meta.rawAuthor
      .split('-')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  if (meta.rawDate) {
    const d = new Date(meta.rawDate);
    if (!isNaN(d.getTime())) {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[d.getUTCMonth()];
      const day = String(d.getUTCDate()).padStart(2, '0');
      const year = d.getUTCFullYear();
      meta.date = `${month} ${day}, ${year}`;
    } else {
      meta.date = meta.rawDate;
    }
  } else {
    meta.date = 'Oct 2026';
  }

  return meta;
}

/**
 * Calculates estimated reading time from word count
 */
function calculateReadingTime(text) {
  if (!text) return '5 min read';
  const clean = text
    .replace(/^---\r?\n[\s\S]*?\r?\n---/, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/<[^>]+>/g, ' ');

  const words = clean.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}

/**
 * Generates an OG card for a single Markdown file with cache check
 */
function generateCardForFile(filePath, options = {}) {
  const outputDir = options.outputDir || path.resolve(__dirname, '../static/images/og');
  const force = options.force || false;

  const slug = path.basename(filePath, path.extname(filePath));
  const destPath = path.join(outputDir, `${slug}.png`);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  if (!force && fs.existsSync(destPath)) {
    const srcMtime = fs.statSync(filePath).mtimeMs;
    const destMtime = fs.statSync(destPath).mtimeMs;
    if (destMtime >= srcMtime) {
      return { skipped: true, slug, dest: destPath };
    }
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const meta = parseFrontmatter(content);
  meta.readingTime = calculateReadingTime(content);

  if (!meta.description) {
    const bodyMatch = content.replace(/^---\r?\n[\s\S]*?\r?\n---/, '').trim();
    const firstPara = bodyMatch.split(/\r?\n\r?\n/)[0] || '';
    meta.description = firstPara.replace(/[#*`_]/g, '').trim().slice(0, 140);
  }

  const svg = buildOgSvg(meta);
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: 1200 },
    shapeRendering: 2,
    textRendering: 1,
    imageRendering: 1
  });

  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();

  fs.writeFileSync(destPath, pngBuffer);
  return { generated: true, slug, dest: destPath };
}

/**
 * Batch generates OG cards for all Markdown blog posts
 */
function batchGenerateOgCards(options = {}) {
  const rootDir = options.rootDir || path.resolve(__dirname, '..');
  const outputDir = options.outputDir || path.join(rootDir, 'static/images/og');
  const contentDirs = options.contentDirs || [
    { dir: path.join(rootDir, 'content/english/blog'), outDir: outputDir },
    { dir: path.join(rootDir, 'content/italian/blog'), outDir: path.join(outputDir, 'it') }
  ];
  const force = options.force || false;

  const stats = { generated: 0, skipped: 0, errors: 0 };

  contentDirs.forEach(source => {
    const dir = typeof source === 'string' ? source : source.dir;
    const targetOutDir = typeof source === 'string' ? outputDir : (source.outDir || outputDir);

    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);

    files.forEach(file => {
      if (!file.endsWith('.md') || file === '_index.md') return;
      const fullPath = path.join(dir, file);

      try {
        const res = generateCardForFile(fullPath, { outputDir: targetOutDir, force });
        if (res.generated) stats.generated++;
        else if (res.skipped) stats.skipped++;
      } catch (err) {
        console.error(`[OG Engine] Error generating card for ${file}:`, err.message);
        stats.errors++;
      }
    });
  });

  return stats;
}

if (require.main === module) {
  const force = process.argv.includes('--force');
  console.log(`\n🎨 [GCloudCafe OG Engine] Scanning blog posts for social share cards (force: ${force})...`);
  const result = batchGenerateOgCards({ force });
  console.log(`✨ [GCloudCafe OG Engine] Complete! Generated: ${result.generated}, Cached/Skipped: ${result.skipped}, Errors: ${result.errors}\n`);
}

module.exports = {
  parseFrontmatter,
  calculateReadingTime,
  generateCardForFile,
  batchGenerateOgCards
};
