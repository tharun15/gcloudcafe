const SUPABASE_URL = process.env.SUPABASE_URL || "https://axiijcsxtiukloarbfor.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || "sb_publishable_cRcwg02R3nXTykDrxalL6w_-kc9Wesc";

async function main() {
  const fetchRes = await fetch(`${SUPABASE_URL}/rest/v1/cloud_pulses?status=eq.pending_approval&order=created_at.desc&select=id,title,content,link_url,tags,created_at`, {
    headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` }
  });
  const data = await fetchRes.json();
  console.log("=== PENDING CANDIDATE ARTICLES ===");
  console.log(JSON.stringify(data, null, 2));
}

main();
