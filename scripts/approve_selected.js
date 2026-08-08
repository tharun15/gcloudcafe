const SUPABASE_URL = process.env.SUPABASE_URL || "https://axiijcsxtiukloarbfor.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || "sb_publishable_cRcwg02R3nXTykDrxalL6w_-kc9Wesc";

const idsToApprove = [
  "f5e55367-f6c3-4d54-b84c-ebd049a564de", // Item 1: Stop burning your AI budget
  "992b1cb0-1d72-464d-be4a-7bfe2fe42508"  // Item 3: Managing VMs on OpenShift with Service Mesh
];

async function main() {
  for (const id of idsToApprove) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/cloud_pulses?id=eq.${id}`, {
      method: "PATCH",
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
      },
      body: JSON.stringify({ status: "approved" })
    });
    const updated = await res.json();
    console.log(`✅ Approved pulse item: ${id}`, updated);
  }
}

main();
