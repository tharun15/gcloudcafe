/**
 * GCloudCafe Windsor.ai Automated SEO & Search Performance Tracker
 * Queries Google Search Console & GA4 live metrics via Windsor.ai API.
 * Stores timestamped historical snapshots and displays terminal dashboard.
 */

const fs = require('fs');
const path = require('path');

function getApiKey() {
  if (process.env.WINDSOR_API_KEY) return process.env.WINDSOR_API_KEY;

  // Try reading from mcp_config.json
  const configPaths = [
    '/mnt/c/Users/Thara/.gemini/config/mcp_config.json',
    'C:/Users/Thara/.gemini/config/mcp_config.json',
    path.join(process.env.HOME || '', '.gemini/config/mcp_config.json')
  ];

  for (const cp of configPaths) {
    if (fs.existsSync(cp)) {
      try {
        const raw = fs.readFileSync(cp, 'utf8');
        const json = JSON.parse(raw);
        if (json.mcpServers?.windsor?.serverUrl) {
          const match = json.mcpServers.windsor.serverUrl.match(/api_key=([^&]+)/);
          if (match && match[1]) return match[1];
        }
      } catch (e) {}
    }
  }

  return '9565ba6d2376ce2a53a9cc9e4f638d20cabf';
}

async function fetchWindsorData(url) {
  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`Windsor API error: ${resp.status} ${resp.statusText}`);
  }
  return await resp.json();
}

async function runTracker() {
  const apiKey = getApiKey();
  const dateStr = new Date().toISOString().split('T')[0];

  console.log('\n======================================================');
  console.log('🚀 GCloudCafe SEO & Search Performance Pulse (Windsor.ai)');
  console.log(`📅 Snapshot Date: ${dateStr}`);
  console.log('======================================================\n');

  try {
    // 1. Fetch Google Search Console Queries
    console.log('📡 Fetching Search Console Query Metrics...');
    const queriesUrl = `https://connectors.windsor.ai/searchconsole?api_key=${apiKey}&fields=query,clicks,impressions,ctr,position&date_preset=last_7d`;
    const queriesData = await fetchWindsorData(queriesUrl);
    const queries = queriesData.data || [];

    // 2. Fetch Google Search Console Pages
    console.log('📡 Fetching Search Console Landing Pages...');
    const pagesUrl = `https://connectors.windsor.ai/searchconsole?api_key=${apiKey}&fields=page,clicks,impressions,ctr,position&date_preset=last_7d`;
    const pagesData = await fetchWindsorData(pagesUrl);
    const pages = pagesData.data || [];

    // 3. Fetch Overall Traffic Sources
    console.log('📡 Fetching Traffic Acquisition Channels...');
    const sourcesUrl = `https://connectors.windsor.ai/all?api_key=${apiKey}&fields=source,medium,clicks,sessions,users&date_preset=last_7d`;
    const sourcesData = await fetchWindsorData(sourcesUrl);
    const sources = sourcesData.data || [];

    // Save snapshot
    const snapshotsDir = path.join(__dirname, '../data/seo_snapshots');
    if (!fs.existsSync(snapshotsDir)) {
      fs.mkdirSync(snapshotsDir, { recursive: true });
    }

    const snapshotPayload = {
      date: dateStr,
      timestamp: new Date().toISOString(),
      summary: {
        totalQueries: queries.length,
        totalPages: pages.length,
        totalSources: sources.length
      },
      queries,
      pages,
      sources
    };

    const snapshotPath = path.join(snapshotsDir, `snapshot-${dateStr}.json`);
    const latestPath = path.join(snapshotsDir, 'latest.json');

    fs.writeFileSync(snapshotPath, JSON.stringify(snapshotPayload, null, 2), 'utf8');
    fs.writeFileSync(latestPath, JSON.stringify(snapshotPayload, null, 2), 'utf8');

    console.log(`\n💾 Snapshot saved to: data/seo_snapshots/snapshot-${dateStr}.json\n`);

    // --- DISPLAY DASHBOARD ---

    // 1. Traffic Sources
    console.log('─── 🌐 TRAFFIC SOURCES & AI CITATIONS (LAST 7 DAYS) ───');
    sources
      .sort((a, b) => (b.sessions || 0) - (a.sessions || 0))
      .forEach(s => {
        const sess = s.sessions != null ? `${s.sessions} sessions` : `${s.clicks || 0} clicks`;
        const users = s.users != null ? `(${s.users} users)` : '';
        console.log(`  • ${s.source.padEnd(20)} [${s.medium || 'N/A'}]: ${sess} ${users}`);
      });

    // 2. Top Google Search Queries
    console.log('\n─── 🏆 TOP SEARCH QUERIES & RANKING POSITIONS ───');
    queries
      .sort((a, b) => (b.impressions || 0) - (a.impressions || 0))
      .slice(0, 10)
      .forEach(q => {
        const pos = q.position ? q.position.toFixed(1) : 'N/A';
        const imp = q.impressions || 0;
        const clk = q.clicks || 0;
        const ctr = ((q.ctr || 0) * 100).toFixed(1);
        console.log(`  • "${q.query}": ${imp} impr, ${clk} clicks, ${ctr}% CTR (Avg Pos: #${pos})`);
      });

    // 3. Striking Distance Opportunities (Positions 4.0 - 15.0)
    console.log('\n─── 🎯 STRIKING DISTANCE OPPORTUNITIES (POSITIONS 4.0 – 15.0) ───');
    const striking = queries.filter(q => q.position >= 4.0 && q.position <= 15.0 && (q.impressions || 0) >= 2);
    if (striking.length === 0) {
      console.log('  No high-impression queries currently in striking range.');
    } else {
      striking
        .sort((a, b) => (b.impressions || 0) - (a.impressions || 0))
        .forEach(q => {
          console.log(`  ★ "${q.query}" (Pos #${q.position.toFixed(1)}): ${q.impressions} impr → Target: Push to Top 3`);
        });
    }

    // 4. Top Landing Pages by Impressions
    console.log('\n─── 📄 TOP SEARCH LANDING PAGES & CTR LEAKS ───');
    pages
      .sort((a, b) => (b.impressions || 0) - (a.impressions || 0))
      .slice(0, 8)
      .forEach(p => {
        const shortUrl = p.page.replace('https://gcloudcafe.com', '');
        const imp = p.impressions || 0;
        const clk = p.clicks || 0;
        const ctr = ((p.ctr || 0) * 100).toFixed(1);
        const pos = p.position ? p.position.toFixed(1) : 'N/A';
        console.log(`  • ${shortUrl}`);
        console.log(`    ${imp} impr | ${clk} clicks | CTR: ${ctr}% | Pos: #${pos}`);
      });

    console.log('\n======================================================');
    console.log('✨ SEO Telemetry pulse completed successfully!');
    console.log('======================================================\n');

  } catch (err) {
    console.error('❌ SEO Tracker Error:', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  runTracker();
}

module.exports = { getApiKey, fetchWindsorData };
