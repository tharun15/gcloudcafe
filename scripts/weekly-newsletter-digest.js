/**
 * Autonomous Weekly Newsletter Digest Engine & Dispatcher for GCloudCafe
 * 
 * Aggregates:
 * 1. Long-form engineering blog posts published in the last 7 days from content/english/blog/
 * 2. Approved Cloud Pulse micro-news items from Supabase (or data/cloud_pulse.json)
 * 3. Active subscribers from Supabase newsletter_subscribers
 * 
 * Synthesizes with Gemini AI (with deterministic fallback) and generates a ByteDepth-branded HTML email.
 * Supports --dry-run for local previewing and verification.
 */

const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL || "https://axiijcsxtiukloarbfor.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || "sb_publishable_cRcwg02R3nXTykDrxalL6w_-kc9Wesc";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const SITE_URL = process.env.SITE_URL || "https://gcloudcafe.com";

// Parse CLI arguments
const args = process.argv.slice(2);
const IS_DRY_RUN = args.includes('--dry-run') || process.env.DRY_RUN === 'true';
const FORCE_RECENT = args.includes('--force') || IS_DRY_RUN; // If dry-run, include recent posts even if >7 days

/**
 * Parses frontmatter from a Markdown file
 */
function parseMarkdownFrontmatter(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!match) return null;

    const frontmatterBlock = match[1];
    const data = {};

    frontmatterBlock.split(/\r?\n/).forEach(line => {
      const parts = line.split(':');
      if (parts.length < 2) return;
      const key = parts[0].trim();
      let value = parts.slice(1).join(':').trim();

      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      } else if (value.startsWith("'") && value.endsWith("'")) {
        value = value.slice(1, -1);
      } else if (value.startsWith('[') && value.endsWith(']')) {
        value = value.slice(1, -1).split(',').map(s => s.trim().replace(/['"]/g, ''));
      } else if (value === 'true') {
        value = true;
      } else if (value === 'false') {
        value = false;
      }
      data[key] = value;
    });

    data._filename = path.basename(filePath, '.md');
    return data;
  } catch (err) {
    console.error(`Error parsing ${filePath}:`, err.message);
    return null;
  }
}

/**
 * Loads published blog posts from content/english/blog
 */
function getWeeklyBlogPosts(days = 7) {
  const blogDir = path.resolve(__dirname, '../content/english/blog');
  if (!fs.existsSync(blogDir)) return [];

  const files = fs.readdirSync(blogDir).filter(f => f.endsWith('.md') && f !== '_index.md');
  const now = new Date();
  const threshold = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  const posts = [];
  for (const file of files) {
    const post = parseMarkdownFrontmatter(path.join(blogDir, file));
    if (!post || post.draft) continue;

    const postDate = post.date ? new Date(post.date) : null;
    if (postDate) {
      if (postDate >= threshold || FORCE_RECENT) {
        posts.push({
          title: post.title || post._filename,
          description: post.description || '',
          date: postDate,
          categories: Array.isArray(post.categories) ? post.categories : (post.categories ? [post.categories] : []),
          author: post.author || 'GCloudCafe Team',
          url: `${SITE_URL}/blog/${post._filename}/`,
          isWithinWindow: postDate >= threshold
        });
      }
    }
  }

  // Sort descending by date
  posts.sort((a, b) => b.date - a.date);

  // If FORCE_RECENT and no posts in window, take the latest 3
  const inWindow = posts.filter(p => p.isWithinWindow);
  if (inWindow.length > 0) {
    return inWindow;
  }
  return posts.slice(0, 3);
}

/**
 * Loads approved Cloud Pulse micro-news from Supabase or data/cloud_pulse.json
 */
async function getWeeklyMicroPulses(days = 7) {
  const now = new Date();
  const threshold = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  // 1. Try Supabase
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/cloud_pulses?status=eq.approved&order=created_at.desc&limit=15`, {
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
      }
    });

    if (res.ok) {
      const items = await res.json();
      if (Array.isArray(items) && items.length > 0) {
        const filtered = items.filter(item => {
          const itemDate = new Date(item.created_at);
          return itemDate >= threshold || FORCE_RECENT;
        });
        if (filtered.length > 0) {
          return filtered.slice(0, 6);
        }
      }
    }
  } catch (err) {
    console.warn("Could not query Supabase cloud_pulses, falling back to local data/cloud_pulse.json");
  }

  // 2. Fallback to data/cloud_pulse.json
  try {
    const localFile = path.resolve(__dirname, '../data/cloud_pulse.json');
    if (fs.existsSync(localFile)) {
      const raw = fs.readFileSync(localFile, 'utf-8');
      const items = JSON.parse(raw);
      if (Array.isArray(items)) {
        const filtered = items.filter(item => item.status === 'approved');
        return filtered.slice(0, 6);
      }
    }
  } catch (err) {
    console.error("Error reading local cloud_pulse.json:", err.message);
  }

  return [];
}

/**
 * Loads active newsletter subscribers from Supabase
 */
async function getActiveSubscribers() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/newsletter_subscribers?select=id,email,created_at`, {
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
      }
    });

    if (res.ok) {
      const subs = await res.json();
      if (Array.isArray(subs)) {
        // Unique emails only
        const unique = [];
        const seen = new Set();
        for (const s of subs) {
          if (!s.email) continue;
          const cleanEmail = s.email.trim().toLowerCase();
          if (!seen.has(cleanEmail) && cleanEmail.includes('@')) {
            seen.add(cleanEmail);
            unique.push({ id: s.id, email: cleanEmail });
          }
        }
        return unique;
      }
    }
  } catch (err) {
    console.warn("Error fetching subscribers from Supabase:", err.message);
  }

  // Fallback demo subscriber for testing
  return [{ id: "preview-subscriber", email: "subscriber@example.com" }];
}

/**
 * Synthesizes engineering updates with Gemini AI if key available, else deterministic fallback
 */
async function generateDigestSummary(posts, pulses) {
  if (GEMINI_API_KEY) {
    try {
      const prompt = `You are the lead editor of GCloudCafe, a high-authority technical cloud architecture publication.
Summarize the following updates into an executive engineering digest for Sunday morning:
Articles:
${posts.map(p => `- ${p.title}: ${p.description}`).join('\n')}

Micro-news & Pulse:
${pulses.map(p => `- ${p.title}`).join('\n')}

Output format (Markdown):
### Executive Overview
(3 concise sentences covering the key architectural trends of the week)

### Key Takeaway
(1 punchy bullet point for infrastructure architects)`;

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text;
      }
    } catch (e) {
      console.warn("Gemini summarization failed, falling back to deterministic template:", e.message);
    }
  }

  // Deterministic high-signal fallback summary
  return `This week's edition brings hands-on production deep dives across Kubernetes, Zero-Trust TLS, and Cloud Architecture. Explore practical configurations and our curated micro-pulse updates from major cloud providers.`;
}

/**
 * Formats clean, cross-client HTML email matching ByteDepth design
 */
function generateEmailHtml(optionsOrPosts, pulsesArg, summaryArg, recipientEmailArg) {
  let posts, pulses, summary, recipientEmail, editionDate;
  if (Array.isArray(optionsOrPosts)) {
    posts = optionsOrPosts;
    pulses = pulsesArg || [];
    summary = summaryArg || '';
    recipientEmail = recipientEmailArg || 'subscriber@example.com';
    editionDate = new Date();
  } else {
    ({ editionDate = new Date(), summary = '', posts = [], pulses = [], recipientEmail = 'subscriber@example.com' } = optionsOrPosts || {});
  }
  const dateObj = (editionDate instanceof Date) ? editionDate : new Date(editionDate || Date.now());
  const dateStr = dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  
  const postsHtml = posts.map(post => `
    <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 16px;">
      <div style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 11px; font-weight: bold; color: #dc2626; text-transform: uppercase; margin-bottom: 6px;">
        ${(post.categories && post.categories[0]) || 'ARCHITECTURE'}
      </div>
      <h3 style="margin: 0 0 8px 0; font-size: 18px; line-height: 1.3; font-weight: 800; color: #0f172a;">
        <a href="${post.url}" style="color: #0f172a; text-decoration: none;">${post.title}</a>
      </h3>
      <p style="margin: 0 0 14px 0; font-size: 14px; line-height: 1.5; color: #475569;">
        ${post.description}
      </p>
      <a href="${post.url}" style="display: inline-block; font-family: ui-monospace, monospace; font-size: 12px; font-weight: bold; color: #dc2626; text-decoration: none;">
        Read article &rarr;
      </a>
    </div>
  `).join('');

  const pulsesHtml = pulses.map(pulse => {
    const cleanContent = (pulse.content || '').replace(/<[^>]+>/g, '').slice(0, 160);
    const link = pulse.link_url || `${SITE_URL}/pulse/`;
    return `
      <div style="padding: 12px 0; border-bottom: 1px solid #f1f5f9;">
        <div style="font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 4px;">
          <a href="${link}" style="color: #0f172a; text-decoration: none;">${pulse.title}</a>
        </div>
        <div style="font-size: 12px; color: #64748b; line-height: 1.4;">
          ${cleanContent}...
        </div>
      </div>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GCloudCafe Weekly Dispatch — ${dateStr}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; -webkit-font-smoothing: antialiased;">
  
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 30px 10px;">
    <tr>
      <td align="center">
        <!-- Main Email Container: 600px Max -->
        <table width="600" border="0" cellspacing="0" cellpadding="0" style="width: 100%; max-width: 600px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background-color: #0c1220; padding: 28px 32px; border-bottom: 3px solid #dc2626;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <div style="font-family: ui-monospace, monospace; font-size: 10px; font-weight: bold; color: #ef4444; letter-spacing: 0.15em; text-transform: uppercase; margin-bottom: 6px;">
                      GCLOUDCAFE &middot; BYTEDEPTH DIGEST
                    </div>
                    <div style="font-size: 24px; font-weight: 900; color: #ffffff; letter-spacing: -0.02em;">
                      GCloud<span style="color: #ef4444;">Cafe</span>
                    </div>
                  </td>
                  <td align="right" style="font-family: ui-monospace, monospace; font-size: 11px; color: #94a3b8;">
                    ${dateStr}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Intro & Summary -->
          <tr>
            <td style="padding: 32px 32px 20px 32px; background-color: #ffffff;">
              <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: -0.02em;">
                Engineering insights, twice a month
              </h2>
              <div style="font-size: 14px; line-height: 1.6; color: #334155; background-color: #f8fafc; border-left: 3px solid #dc2626; padding: 14px 16px; border-radius: 4px; margin-bottom: 24px;">
                ${summary.replace(/\n/g, '<br>')}
              </div>

              <!-- Long-Form Articles Section -->
              ${posts.length > 0 ? `
                <div style="font-family: ui-monospace, monospace; font-size: 11px; font-weight: bold; color: #64748b; letter-spacing: 0.1em; text-transform: uppercase; margin: 24px 0 12px 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">
                  Featured Architecture &amp; Deep Dives
                </div>
                ${postsHtml}
              ` : ''}

              <!-- Micro-Pulse Newsroom Section -->
              ${pulses.length > 0 ? `
                <div style="font-family: ui-monospace, monospace; font-size: 11px; font-weight: bold; color: #64748b; letter-spacing: 0.1em; text-transform: uppercase; margin: 32px 0 12px 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">
                  Cloud Pulse &middot; Fast Engineering Highlights
                </div>
                ${pulsesHtml}
              ` : ''}

              <!-- CTA to Hub -->
              <div style="text-align: center; margin: 36px 0 12px 0;">
                <a href="${SITE_URL}/blog/" style="background-color: #dc2626; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-size: 13px; font-weight: bold; display: inline-block;">
                  View all guides on GCloudCafe &rarr;
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f1f5f9; padding: 24px 32px; border-top: 1px solid #e2e8f0; font-family: ui-monospace, monospace; font-size: 11px; color: #64748b; line-height: 1.6;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    &copy; 2026 GCloudCafe &middot; Deep technical writing for engineers.<br>
                    Sent to ${recipientEmail || 'you@company.com'} because you subscribed on GCloudCafe.
                  </td>
                  <td align="right" valign="top">
                    <a href="${SITE_URL}/privacy-policy/" style="color: #64748b; text-decoration: underline; margin-right: 12px;">Privacy</a>
                    <a href="${SITE_URL}/newsletter/?unsubscribe=true" style="color: #dc2626; text-decoration: underline;">Unsubscribe</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;
}

/**
 * Dispatches the email to subscribers (supports Resend, SendGrid, or Dry-Run)
 */
async function dispatchNewsletter({ html, subject, subscribers, isDryRun = IS_DRY_RUN }) {
  console.log(`\n📮 Dispatching "${subject}"...`);
  console.log(`👥 Target audience: ${subscribers.length} verified subscriber(s)`);

  if (isDryRun) {
    const previewDir = path.resolve(__dirname, '../dist');
    if (!fs.existsSync(previewDir)) {
      fs.mkdirSync(previewDir, { recursive: true });
    }
    const previewPath = path.join(previewDir, 'weekly-newsletter-preview.html');
    fs.writeFileSync(previewPath, html, 'utf-8');
    const staticPreview = path.resolve(__dirname, '../static/weekly-newsletter-preview.html');
    try { fs.writeFileSync(staticPreview, html, 'utf-8'); } catch(e) {}
    console.log(`\n[DRY RUN] Newsletter generated successfully!`);
    console.log(`[DRY RUN] Preview saved to: ${previewPath}`);
    console.log(`[DRY RUN] No live emails were sent.`);
    return { success: true, count: subscribers.length, mode: 'dry-run', previewPath };
  }

  // Check for Resend API Key
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (RESEND_API_KEY) {
    console.log("Using Resend API for newsletter broadcast...");
    let sent = 0;
    for (const sub of subscribers) {
      try {
        const payload = {
          from: "GCloudCafe Digest <newsletter@gcloudcafe.com>",
          to: [sub.email],
          subject: subject,
          html: html.replace('${recipientEmail}', sub.email)
        };
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });
        if (res.ok) sent++;
      } catch (e) {
        console.error(`Failed sending to ${sub.email}:`, e.message);
      }
    }
    console.log(`✓ Delivered ${sent}/${subscribers.length} emails via Resend.`);
    return { success: true, count: sent, mode: 'resend' };
  }

  // Fallback / Generic alert
  console.warn("No RESEND_API_KEY or email provider configured in environment. Completed in preview mode.");
  return { success: true, count: subscribers.length, mode: 'mock' };
}

/**
 * Main execution flow
 */
async function runWeeklyDigest(options = {}) {
  const isDryRun = options.dryRun !== undefined ? options.dryRun : IS_DRY_RUN;
  console.log("=================================================");
  console.log("🚀 GCloudCafe Sunday Weekly Newsletter Dispatcher");
  console.log(`📅 Execution time: ${new Date().toISOString()}`);
  console.log(`⚙️  Mode: ${isDryRun ? 'DRY RUN (Preview Only)' : 'LIVE DISPATCH'}`);
  console.log("=================================================\n");

  // 1. Gather articles
  const posts = getWeeklyBlogPosts(7);
  console.log(`✓ Aggregated ${posts.length} blog post(s) for the digest.`);

  // 2. Gather micro-pulses
  const pulses = await getWeeklyMicroPulses(7);
  console.log(`✓ Aggregated ${pulses.length} approved micro-pulse update(s).`);

  // 3. Gather subscribers
  const subscribers = await getActiveSubscribers();
  console.log(`✓ Loaded ${subscribers.length} active subscriber(s).`);

  // 4. Synthesize content
  console.log("🧠 Generating executive digest summary...");
  const summary = await generateDigestSummary(posts, pulses);

  // 5. Generate ByteDepth HTML email
  const editionDate = new Date();
  const dateStr = editionDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const subject = `GCloudCafe Digest: Architecture & Cloud Insights (${dateStr})`;

  const emailHtml = generateEmailHtml({
    editionDate,
    summary,
    posts,
    pulses,
    recipientEmail: subscribers[0]?.email || 'subscriber@example.com'
  });

  // 6. Dispatch or save preview
  const result = await dispatchNewsletter({
    html: emailHtml,
    subject,
    subscribers,
    isDryRun
  });

  // 7. Update website archive record
  const archiveDir = path.resolve(__dirname, '../data');
  const archivePath = path.join(archiveDir, 'newsletter_archive.json');
  let archive = [];
  if (fs.existsSync(archivePath)) {
    try {
      archive = JSON.parse(fs.readFileSync(archivePath, 'utf-8'));
    } catch (e) {}
  }
  const editionRecord = {
    id: `edition-${editionDate.toISOString().slice(0, 10)}`,
    date: editionDate.toISOString(),
    title: subject,
    summary: summary.slice(0, 200),
    postCount: posts.length,
    pulseCount: pulses.length,
    url: `${SITE_URL}/newsletter/`
  };
  archive.unshift(editionRecord);
  fs.writeFileSync(archivePath, JSON.stringify(archive.slice(0, 20), null, 2), 'utf-8');
  console.log(`✓ Updated newsletter archive at data/newsletter_archive.json`);

  return {
    ...result,
    dryRun: isDryRun,
    subscribersCount: subscribers.length,
    postsCount: posts.length,
    pulsesCount: pulses.length
  };
}

if (require.main === module) {
  runWeeklyDigest()
    .then(() => {
      console.log("\n🎉 Weekly newsletter process completed successfully.");
      process.exit(0);
    })
    .catch(err => {
      console.error("\n❌ Fatal error in weekly newsletter process:", err);
      process.exit(1);
    });
}

module.exports = {
  getWeeklyBlogPosts,
  getWeeklyMicroPulses,
  getActiveSubscribers,
  generateDigestSummary,
  generateEmailHtml,
  runWeeklyDigest
};
