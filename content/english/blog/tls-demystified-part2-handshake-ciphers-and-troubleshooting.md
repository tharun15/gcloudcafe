---
title: "TLS for DevOps Engineers (Part 2): The Modern Handshake (TLS 1.2 vs 1.3), Cipher Suites & SSL Troubleshooting"
meta_title: "TLS Handshake Explained: TLS 1.2 vs 1.3, Ciphers & Debugging (Part 2)"
description: "Deep dive into the modern TLS Handshake: 1-RTT vs 2-RTT packet flows, ECDHE key agreement, cipher suite anatomy, 0-RTT session resumption, and real-world OpenSSL debugging."
date: 2026-08-15
image: "/images/tls-part2-handshake.jpg"
categories: ["Security", "DevOps", "Architecture"]
tags: ["TLS", "SSL", "Networking", "Cryptography", "OpenSSL", "Kubernetes", "DevOps"]
author: tharun-vempati
featured: false
draft: false
---

In [Part 1 of our TLS & mTLS Architecture series](/blog/tls-demystified-part1-cryptography-keys-csr-ca-explained/), we established the foundational cryptographic engines: how private keys stay secret, how CSRs prove identity, why the Chain of Trust protects offline Root CAs, and how ephemeral Diffie-Hellman generates forward-secret session keys.

Now comes the pivotal operational question: **What happens over the physical network wire in the first 50 milliseconds when a client opens an HTTPS connection to your server?**

How do client and server agree on cryptographic ciphers over an untrusted network? Why did **TLS 1.3 cut connection latency by 50%**, and how does an out-of-sync session ticket or missing Server Name Indication (SNI) trigger sudden connection resets (`SSL_ERROR_ZERO_RETURN` / `wrong version number`) in your Kubernetes Ingress or Envoy proxies?

Welcome to **Part 2 of our 3-Part Deep Dive into TLS & mTLS Architecture**:

- **Part 1:** [The Alice & Bob Foundation: Keys, CSRs, Public vs. Private PKI, and the Chain of Trust](/blog/tls-demystified-part1-cryptography-keys-csr-ca-explained/).
- **Part 2 (You Are Here):** The Modern TLS Handshake (TLS 1.2 vs 1.3), Cipher Suites, Session Resumption, and Production Debugging.
- **Part 3:** Mutual TLS (mTLS), Java KeyStores vs. TrustStores, and Surviving Production Certificate Expirations.

---

## 1. The Real-World Analogy: Airport Border Control & The Secret Handshake

Before analyzing hex dumps and packet captures, imagine the TLS handshake as an **Airport Border Control interaction**:

<div class="p-6 md:p-8 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 my-8 shadow-sm space-y-5">
<div class="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-lg border-b border-slate-200/80 dark:border-slate-800/80 pb-3">
<span>🛂</span> The Passport Control Analogy (The 4 Handshake Stages)
</div>
<div class="space-y-4">
<div class="flex items-start gap-3.5">
<span class="text-2xl shrink-0 mt-0.5">🗣️</span>
<p class="text-sm md:text-base text-slate-800 dark:text-slate-200 m-0 leading-relaxed">
<b>1. Language Negotiation (Cipher Suite Selection):</b> The traveler approaches the immigration desk and announces: <i>"I speak English, French, and Spanish."</i> The officer replies: <i>"We will speak English."</i> (Client and server agree on supported protocol versions and ciphers).
</p>
</div>
<div class="flex items-start gap-3.5">
<span class="text-2xl shrink-0 mt-0.5">🪪</span>
<p class="text-sm md:text-base text-slate-800 dark:text-slate-200 m-0 leading-relaxed">
<b>2. Passport Verification (Server Authentication):</b> The officer presents official government credentials (the <b>X.509 Certificate</b> signed by a trusted authority). The traveler inspects the security watermark and stamp (the <b>Digital Signature</b>) to confirm the officer is legitimate.
</p>
</div>
<div class="flex items-start gap-3.5">
<span class="text-2xl shrink-0 mt-0.5">🤝</span>
<p class="text-sm md:text-base text-slate-800 dark:text-slate-200 m-0 leading-relaxed">
<b>3. Secret Code Agreement (Ephemeral Diffie-Hellman):</b> Right in front of a crowded room, both parties exchange public mathematical parameters. Without anyone in the room discovering it, both calculate the exact same secret code (the <b>Symmetric Session Key</b>).
</p>
</div>
<div class="flex items-start gap-3.5">
<span class="text-2xl shrink-0 mt-0.5">🔒</span>
<p class="text-sm md:text-base text-slate-800 dark:text-slate-200 m-0 leading-relaxed">
<b>4. Secure Communication (AEAD Bulk Encryption):</b> From that millisecond forward, all further conversation is spoken using that secret code. Eavesdroppers hear only unreadable static.
</p>
</div>
</div>
</div>

---

## 2. Handshake Mechanics: TLS 1.2 (2-RTT) vs. TLS 1.3 (1-RTT)

Network latency is governed by the speed of light. Every network round-trip time (**RTT**) between a mobile user in Sydney and an ingress load balancer in Virginia costs **150ms to 250ms**. 

Reducing round trips during connection establishment is the single most impactful performance optimization in modern web networking.

### The Legacy TLS 1.2 Handshake (2 Full Round Trips)

In TLS 1.2 ([RFC 5246](https://datatracker.ietf.org/doc/html/rfc5246)), setting up a secure channel requires **two complete round trips (2-RTT)** before any application data (HTTP request) can be sent:

```text
CLIENT                                               SERVER
  │                                                    │
  │ ─── 1. ClientHello (Ciphers, Random, SNI) ───────> │  [RTT 1: Negotiation]
  │ <── 2. ServerHello (Chosen Cipher, Random) ─────── │
  │ <── 3. Certificate (Leaf + Intermediates) ──────── │  (Sent in Cleartext!)
  │ <── 4. ServerKeyExchange (ECDHE Params + Sig) ──── │
  │ <── 5. ServerHelloDone ─────────────────────────── │
  │                                                    │
  │ ─── 6. ClientKeyExchange (Client ECDHE Share) ───> │  [RTT 2: Key Confirm]
  │ ─── 7. ChangeCipherSpec ─────────────────────────> │
  │ ─── 8. Finished (Encrypted Verify Hash) ─────────> │
  │ <── 9. ChangeCipherSpec ────────────────────────── │
  │ <── 10. Finished (Encrypted Verify Hash) ───────── │
  │                                                    │
  │ ─── 11. Encrypted Application Data (HTTP GET) ───> │  [RTT 3: First HTTP Data]
```

#### Why TLS 1.2 Was Slow & Vulnerable:
1. **High Latency (2 RTT):** Together with the 1-RTT TCP 3-way handshake (`SYN` ➔ `SYN-ACK` ➔ `ACK`), the user waits **3 full round trips** before their first byte of HTTP payload leaves their browser.
2. **Cleartext Metadata:** The server's certificate was sent unencrypted over the wire, allowing eavesdroppers to inspect which organization and domain was being accessed.
3. **Static RSA Key Transport Weakness:** TLS 1.2 allowed RSA key exchange, where the client encrypted the premaster secret using the server's public key. If the server's private key was ever stolen years later, attackers could decrypt all historical traffic recorded from network taps.

---

### The Modern TLS 1.3 Handshake (1 Full Round Trip)

Published in 2018, **TLS 1.3 ([RFC 8446](https://datatracker.ietf.org/doc/html/rfc8446)) revolutionized the protocol**:

- It cut the standard handshake to **1-RTT**.
- It encrypted the entire handshake after `ServerHello` (protecting certificates and extensions).
- It completely abolished insecure legacy algorithms (RSA key transport, CBC ciphers, SHA-1, MD5).

```text
CLIENT                                               SERVER
  │                                                    │
  │ ─── 1. ClientHello ──────────────────────────────> │  [RTT 1]
  │        • Supported Ciphers (AES-GCM / ChaCha20)    │
  │        • KeyShare (Client ECDHE Public Share: X25519)
  │        • SNI + ALPN (h2, http/1.1)                │
  │                                                    │
  │ <── 2. ServerHello ─────────────────────────────── │
  │        • Chosen Cipher + Matching KeyShare (X25519)│
  │ ┌────────────────────────────────────────────────┐ │
  │ │  ALL MESSAGES BELOW ARE NOW FULLY ENCRYPTED    │ │
  │ └────────────────────────────────────────────────┘ │
  │ <── 3. EncryptedExtensions (ALPN confirmation) ─── │
  │ <── 4. Certificate (Server X.509 Chain) ────────── │
  │ <── 5. CertificateVerify (RSA-PSS/ECDSA Signature) │
  │ <── 6. Finished (HMAC over entire transcript) ──── │
  │                                                    │
  │ ─── 7. Finished (Client HMAC verification) ──────> │  [DATA FLOWS IMMEDIATELY!]
  │ ─── 8. Encrypted Application Data (HTTP GET) ─────> │
```

---

## 3. 🗺️ Visual Architecture Comparison: TLS 1.2 vs. TLS 1.3

<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 my-8">
<!-- TLS 1.2 Column -->
<div class="p-6 rounded-3xl bg-slate-50 dark:bg-slate-900/90 border-2 border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
<div>
<div class="flex items-center justify-between mb-4">
<span class="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-rose-500/20 text-rose-700 dark:text-rose-300">Legacy • 2-RTT</span>
<span class="text-xs font-mono font-bold text-slate-500">RFC 5246</span>
</div>
<h4 class="text-base font-bold text-slate-900 dark:text-white m-0 mb-4">🐢 TLS 1.2 Handshake (2 Round Trips)</h4>
<div class="space-y-2.5 font-mono text-xs">
<div class="p-3 rounded-xl bg-slate-200/70 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700">
<b>RTT 1:</b> ClientHello ➔ ServerHello, Cert, ServerKeyExchange
<div class="text-rose-600 dark:text-rose-400 text-[11px] mt-1">⚠️ Certificate sent in plain cleartext!</div>
</div>
<div class="p-3 rounded-xl bg-slate-200/70 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700">
<b>RTT 2:</b> ClientKeyExchange, ChangeCipherSpec, Finished
</div>
<div class="p-3 rounded-xl bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
<b>RTT 3:</b> Application Data (HTTP GET/POST) starts flowing.
</div>
</div>
</div>
<div class="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
Total handshake delay: <b>2 RTTs (~200-400ms on mobile)</b>
</div>
</div>

<!-- TLS 1.3 Column -->
<div class="p-6 rounded-3xl bg-slate-50 dark:bg-slate-900/90 border-2 border-emerald-500/40 shadow-md flex flex-col justify-between">
<div>
<div class="flex items-center justify-between mb-4">
<span class="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">Modern • 1-RTT</span>
<span class="text-xs font-mono font-bold text-slate-500">RFC 8446</span>
</div>
<h4 class="text-base font-bold text-slate-900 dark:text-white m-0 mb-4">⚡ TLS 1.3 Handshake (1 Round Trip)</h4>
<div class="space-y-2.5 font-mono text-xs">
<div class="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-950 dark:text-sky-100 border border-sky-300 dark:border-sky-700">
<b>RTT 1:</b> Client sends <code>KeyShare</code> (ECDHE guess) + Ciphers.
<div class="text-sky-700 dark:text-sky-300 text-[11px] mt-1">Server responds with matching KeyShare + Certificate.</div>
</div>
<div class="p-3 rounded-xl bg-emerald-500/20 text-emerald-900 dark:text-emerald-200 border-2 border-emerald-500/60 font-bold">
<b>RTT 1 (End):</b> Handshake completes! Everything after ServerHello is encrypted.
</div>
<div class="p-3 rounded-xl bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
<b>RTT 2:</b> Application Data (HTTP GET/POST) flows immediately!
</div>
</div>
</div>
<div class="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs text-emerald-700 dark:text-emerald-300 font-bold">
Total handshake delay: <b>1 RTT (50% latency reduction!)</b>
</div>
</div>
</div>

---

## 4. 🚨 5 Fatal TLS Handshake Misconceptions Every DevOps Engineer Must Unlearn

<div class="grid grid-cols-1 md:grid-cols-2 gap-4 my-8">
<div class="p-5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60">
<h5 class="text-sm font-bold text-rose-950 dark:text-rose-200 m-0 mb-1.5">❌ Myth 1: "TLS 1.3 0-RTT Early Data is safe for all APIs."</h5>
<p class="text-xs text-slate-700 dark:text-slate-300 m-0 leading-relaxed">
<b>Reality:</b> 0-RTT Early Data has <b>no forward secrecy and no native replay protection</b>. An attacker intercepting a 0-RTT packet can replay it multiple times. 0-RTT must <b>only</b> be enabled for idempotent GET requests, never for POST, payment, or state-mutating endpoints.
</p>
</div>

<div class="p-5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60">
<h5 class="text-sm font-bold text-rose-950 dark:text-rose-200 m-0 mb-1.5">❌ Myth 2: "Cipher suites dictate the server's certificate key type."</h5>
<p class="text-xs text-slate-700 dark:text-slate-300 m-0 leading-relaxed">
<b>Reality:</b> In TLS 1.3, cipher suites are strictly symmetric. They define only the bulk AEAD cipher and hash algorithm (e.g., <code>TLS_AES_256_GCM_SHA384</code>). Key exchange and certificate signatures are negotiated completely independently in extension fields.
</p>
</div>

<div class="p-5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60">
<h5 class="text-sm font-bold text-rose-950 dark:text-rose-200 m-0 mb-1.5">❌ Myth 3: "SNI (Server Name Indication) is encrypted by default."</h5>
<p class="text-xs text-slate-700 dark:text-slate-300 m-0 leading-relaxed">
<b>Reality:</b> The SNI header is sent in the initial unencrypted <code>ClientHello</code>. Anyone on the local network (ISPs, public Wi-Fi) can see which domain you are visiting. Encrypted Client Hello (ECH) is required to encrypt SNI metadata.
</p>
</div>

<div class="p-5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60">
<h5 class="text-sm font-bold text-rose-950 dark:text-rose-200 m-0 mb-1.5">❌ Myth 4: "Session Tickets store state on the server."</h5>
<p class="text-xs text-slate-700 dark:text-slate-300 m-0 leading-relaxed">
<b>Reality:</b> In RFC 5077 / TLS 1.3 PSK, the server encrypts the session state with a secret key (STEK) and sends the ticket to the <b>client</b>. The client returns the ticket on resumption. The server keeps zero state in memory.
</p>
</div>

<div class="p-5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 md:col-span-2">
<h5 class="text-sm font-bold text-amber-950 dark:text-amber-200 m-0 mb-1.5">❌ Myth 5: "The certificate signature proves the server owns the domain right now."</h5>
<p class="text-xs text-slate-700 dark:text-slate-300 m-0 leading-relaxed">
<b>Reality:</b> The CA signature on the certificate only proves the server owned the domain when the certificate was issued. To prove live ownership *during the connection*, the server dynamically signs the current handshake transcript using its private key in <code>CertificateVerify</code>.
</p>
</div>
</div>

---

## 5. Cipher Suite Anatomy: TLS 1.2 vs. TLS 1.3

A **Cipher Suite** is a standardized cryptographic recipe negotiated between client and server.

<div class="space-y-6 my-8">
<!-- TLS 1.2 Cipher Breakdown -->
<div class="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
<div class="flex items-center justify-between flex-wrap gap-2 mb-3">
<h5 class="text-sm font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 m-0">TLS 1.2 Monolithic Cipher Syntax</h5>
<span class="text-xs font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">RFC 5246</span>
</div>
<div class="font-mono text-sm sm:text-base font-bold text-slate-900 dark:text-white p-3 rounded-xl bg-slate-200/60 dark:bg-slate-800/60 mb-3 overflow-x-auto">
TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384
</div>
<div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
<div class="p-2.5 rounded-lg bg-sky-500/10 border border-sky-500/20">
<span class="text-[10px] uppercase font-bold text-sky-600 dark:text-sky-400 block">Key Exchange</span>
<b>ECDHE</b> (Diffie-Hellman)
</div>
<div class="p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
<span class="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 block">Authentication</span>
<b>RSA</b> (Signature)
</div>
<div class="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
<span class="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 block">Bulk Cipher & Mode</span>
<b>AES_256_GCM</b> (AEAD)
</div>
<div class="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
<span class="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 block">Integrity / PRF</span>
<b>SHA384</b> (MAC Hash)
</div>
</div>
</div>

<!-- TLS 1.3 Cipher Breakdown -->
<div class="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border-2 border-emerald-500/50 shadow-sm">
<div class="flex items-center justify-between flex-wrap gap-2 mb-3">
<h5 class="text-sm font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 m-0">TLS 1.3 Orthogonal Cipher Syntax (Clean & Decoupled)</h5>
<span class="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-bold">RFC 8446</span>
</div>
<div class="font-mono text-sm sm:text-base font-bold text-emerald-950 dark:text-emerald-200 p-3 rounded-xl bg-emerald-500/10 mb-3 overflow-x-auto">
TLS_AES_256_GCM_SHA384
</div>
<div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
<div class="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
<span class="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block">Bulk Record Cipher & Mode</span>
<b>AES_256_GCM</b> (Hardware-accelerated AEAD)
</div>
<div class="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
<span class="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block">HKDF Hash Algorithm</span>
<b>SHA384</b> (Used for Key Derivation)
</div>
</div>
<p class="text-xs text-slate-700 dark:text-slate-300 m-0 mt-3 leading-relaxed">
<b>Why the difference?</b> In TLS 1.3, Key Exchange (<code>supported_groups</code>: X25519, P-256) and Authentication (<code>signature_algorithms</code>: RSA-PSS, ECDSA) are negotiated separately. There are only <b>5 standardized cipher suites in TLS 1.3</b>, eliminating dangerous misconfigurations.
</p>
</div>
</div>

---

## 6. Session Resumption: Session IDs, Tickets & 0-RTT Pre-Shared Keys

When a client reconnects to your server, performing a full handshake again is wasteful. TLS provides three generations of session resumption:

```text
Generation 1: Session IDs (Stateful)
Server stores session cache in RAM ──> Client sends Session ID ──> Cache lookup on Server

Generation 2: Session Tickets (Stateless RFC 5077)
Server encrypts state with STEK Key ──> Client stores Ticket ──> Server decrypts on return

Generation 3: TLS 1.3 PSK (Pre-Shared Key & 0-RTT)
Client sends Pre-Shared Key ticket + 0-RTT Application Data in the very first ClientHello!
```

### Production Gotcha: Session Ticket Encryption Keys (STEK) in Load-Balanced Clusters
In Kubernetes, if a client sends a Session Ticket to Pod A, and subsequent requests hit Pod B:
- If Pod A and Pod B do not share the exact same **Session Ticket Encryption Key (STEK)**, Pod B cannot decrypt the ticket and forces a full 1-RTT fallback handshake.
- Cloud Ingress controllers (Nginx Ingress, Traefik, Envoy, AWS ALB) synchronize STEKs across all proxy replicas to maintain high resumption cache hit rates.

---

## 7. ALPN (Application-Layer Protocol Negotiation)

In older web servers, switching from HTTP/1.1 to HTTP/2 required an initial plaintext HTTP `Upgrade` request.

**ALPN ([RFC 7301](https://datatracker.ietf.org/doc/html/rfc7301))** eliminates this round trip by negotiating the application protocol **directly inside the TLS handshake**:

1. Client announces supported protocols in `ClientHello`: `["h2", "http/1.1"]`.
2. Server confirms chosen protocol in `EncryptedExtensions`: `h2`.
3. The moment the TLS handshake completes, the first byte sent over the wire is native HTTP/2 binary framing!

---

## 8. ⚠️ Critical Production Gotchas: Why TLS Handshakes Fail

### 1. The SNI (Server Name Indication) Routing Trap
When hosting multiple services behind a single Ingress IP (e.g., `api.gcloudcafe.com` and `auth.gcloudcafe.com`):
- The client must populate the **SNI extension** in `ClientHello`.
- If a client (e.g., an older CLI script or custom embedded client) connects directly by raw IP without setting SNI, the Ingress proxy falls back to the **default catch-all certificate**, causing instant domain mismatch errors.

### 2. TLS Protocol Mismatch on Plaintext Ports
If a client sends an unencrypted plaintext HTTP request to an HTTPS port (or vice versa):
```text
curl http://api.gcloudcafe.com:443
# Result: curl: (56) Recv failure: Connection reset by peer
# Server log: http: TLS handshake error from ...: client sent an HTTP request to an HTTPS server
```

---

## 9. Hands-On OpenSSL Lab: Inspecting Handshakes & Troubleshooting

Let’s translate protocol theory into live diagnostic commands:

### 9.1. Tracing the Complete TLS 1.3 Handshake Packet-by-Packet
Use OpenSSL's `-msg` flag to view every raw handshake message exchanged:

```bash
openssl s_client -connect gcloudcafe.com:443 -servername gcloudcafe.com -tls1_3 -msg
```
**Output highlights:**
```text
>>> TLS 1.3, ClientHello
<<< TLS 1.3, ServerHello
<<< TLS 1.3, EncryptedExtensions
<<< TLS 1.3, Certificate
<<< TLS 1.3, CertificateVerify
<<< TLS 1.3, Finished
>>> TLS 1.3, Finished
```

### 9.2. Verifying ALPN Negotiation (HTTP/2 vs HTTP/1.1)
```bash
openssl s_client -connect gcloudcafe.com:443 -servername gcloudcafe.com -alpn h2,http/1.1
```
**Check output line:**
```text
ALPN protocol: h2
```

### 9.3. Profiling TLS Handshake Latency with cURL
Measure the exact millisecond cost of DNS, TCP 3-way handshake, and TLS negotiation:

```bash
curl -w "\
\n--- Timing Breakdown ---\n\
DNS Lookup:        %{time_namelookup}s\n\
TCP Connect:       %{time_connect}s\n\
TLS Handshake:     %{time_appconnect}s\n\
First Byte (TTFB): %{time_starttransfer}s\n\
Total Time:        %{time_total}s\n" \
-o /dev/null -s https://gcloudcafe.com
```

### 9.4. Testing Cipher Suite Support with testssl.sh
In production CI/CD pipelines, run `testssl.sh` or scan your domain with [Qualys SSL Labs](https://www.ssllabs.com/ssltest/) to verify that insecure TLS 1.0, 1.1, and CBC ciphers are disabled:

```bash
docker run --rm -ti drwetter/testssl.sh gcloudcafe.com
```

---

## 📚 Authoritative Standards & References

To explore the underlying IETF specifications:

- **[RFC 8446](https://datatracker.ietf.org/doc/html/rfc8446):** *The Transport Layer Security (TLS) Protocol Version 1.3*.
- **[RFC 5246](https://datatracker.ietf.org/doc/html/rfc5246):** *The Transport Layer Security (TLS) Protocol Version 1.2*.
- **[RFC 7301](https://datatracker.ietf.org/doc/html/rfc7301):** *Transport Layer Security (TLS) Application-Layer Protocol Negotiation Extension (ALPN)*.
- **[RFC 5077](https://datatracker.ietf.org/doc/html/rfc5077):** *Transport Layer Security (TLS) Session Resumption without Server-Side State*.
- **[RFC 8470](https://datatracker.ietf.org/doc/html/rfc8470):** *Using Early Data in HTTP (0-RTT Security Guidance)*.

---

## Summary & What's Next in Part 3

| Metric / Feature | TLS 1.2 (Legacy) | TLS 1.3 (Modern Standard) |
| :--- | :--- | :--- |
| **Handshake Latency** | **2 RTTs** (Two full round trips) | **1 RTT** (50% faster) / **0-RTT** Resumption |
| **Handshake Encryption** | Certificate sent in cleartext | Certificate encrypted after `ServerHello` |
| **Key Exchange** | Static RSA (insecure) or (EC)DHE | **Ephemeral Diffie-Hellman (ECDHE) ONLY** |
| **Forward Secrecy** | Optional (depended on cipher suite) | **Mandatory by design** |
| **Cipher Suite Syntax** | Monolithic (`TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384`) | Orthogonal (`TLS_AES_256_GCM_SHA384`) |
| **Session Resumption** | Session ID / RFC 5077 Tickets | **PSK (Pre-Shared Key) + 0-RTT Early Data** |

Now that you have mastered how the TLS handshake negotiates cryptographic engines over the network wire, you are ready to tackle internal enterprise security.

👉 **In Part 3: Production TLS, mTLS, KeyStores & Incident Management**, we will explore:
- **Mutual TLS (mTLS):** Enforcing bidirectional client certificate authentication in zero-trust architectures.
- **Java KeyStores (`.jks`) vs. TrustStores (`cacerts`):** Solving `PKIX path building failed` once and for all.
- **Automating Certificate Lifecycles:** Kubernetes `cert-manager`, Vault PKI, and automated zero-downtime rotation.
- **Post-Mortem Playbook:** Surviving 3 AM production certificate expiration incidents.
