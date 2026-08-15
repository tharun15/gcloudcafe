---
title: "TLS for DevOps Engineers (Part 2): The Modern Handshake (TLS 1.2 vs 1.3), Cipher Suites & SSL Troubleshooting"
meta_title: "TLS Handshake Explained: TLS 1.2 vs 1.3, Ciphers & Debugging (Part 2)"
description: "Master the modern TLS Handshake for DevOps: 1-RTT vs 2-RTT packet flows, ECDHE key agreement, cipher suite anatomy, session resumption, and real-world OpenSSL debugging."
date: 2026-08-15
image: "/images/tls-part2-handshake.jpg"
categories: ["Security", "DevOps", "Architecture"]
tags: ["TLS", "SSL", "Networking", "Cryptography", "OpenSSL", "Kubernetes", "DevOps"]
author: tharun-vempati
series: "TLS & mTLS Architecture for DevOps Engineers"
series_order: 2
featured: true
draft: false
---

In [Part 1 of this series](/blog/tls-demystified-part1-cryptography-keys-csr-ca-explained/), we looked at the foundational building blocks of PKI: keeping private keys safe on your servers, using CSRs to request certificates, relying on the Chain of Trust to protect root CAs, and understanding how Diffie-Hellman negotiates session keys.

Now let's tackle the question that actually shows up during on-call rotations: **What happens over the network wire in the first 50 milliseconds when a client opens an HTTPS connection to your server?**

How do a browser and a reverse proxy agree on cryptographic ciphers over an untrusted network? Why did **TLS 1.3 cut handshake round trips in half**, and how does a missing Server Name Indication (SNI) or an out-of-sync session ticket cause sudden connection resets (`SSL_ERROR_ZERO_RETURN` or `wrong version number`) in your Kubernetes Ingress or Envoy proxies?

Welcome to **Part 2 of our 3-Part Deep Dive into TLS & mTLS Architecture for DevOps Engineers**:

- **Part 1:** [The Alice & Bob Foundation: Keys, CSRs, Public vs. Private PKI, and the Chain of Trust](/blog/tls-demystified-part1-cryptography-keys-csr-ca-explained/).
- **Part 2 (You Are Here):** The Modern TLS Handshake (TLS 1.2 vs 1.3), Cipher Suites, Session Resumption, and Production Debugging.
- **Part 3:** Mutual TLS (mTLS), Java KeyStores vs. TrustStores, and Surviving Production Certificate Expirations.

---

## 1. The Passport Control Analogy: How the Handshake Actually Works

Before diving into packet captures and hex dumps, think of the TLS handshake as going through **Airport Border Control**:

<div class="p-6 md:p-8 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 my-8 shadow-sm space-y-5">
<div class="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-lg border-b border-slate-200/80 dark:border-slate-800/80 pb-3">
<span>🛂</span> The Passport Control Analogy (4 Practical Steps)
</div>
<div class="space-y-4">
<div class="flex items-start gap-3.5">
<span class="text-2xl shrink-0 mt-0.5">🗣️</span>
<p class="text-sm md:text-base text-slate-800 dark:text-slate-200 m-0 leading-relaxed">
<b>1. Agreeing on a Language (Cipher Negotiation):</b> You approach the desk and say: <i>"I speak English, French, and Spanish."</i> The officer replies: <i>"Let's speak English."</i> (Client and server agree on supported protocol versions and ciphers).
</p>
</div>
<div class="flex items-start gap-3.5">
<span class="text-2xl shrink-0 mt-0.5">🪪</span>
<p class="text-sm md:text-base text-slate-800 dark:text-slate-200 m-0 leading-relaxed">
<b>2. Checking the Badge (Server Authentication):</b> The officer presents their official government ID (the <b>X.509 Certificate</b>). You check the holographic security stamp (the <b>Digital Signature</b>) to make sure you're talking to a legitimate officer, not an imposter.
</p>
</div>
<div class="flex items-start gap-3.5">
<span class="text-2xl shrink-0 mt-0.5">🤝</span>
<p class="text-sm md:text-base text-slate-800 dark:text-slate-200 m-0 leading-relaxed">
<b>3. Agreeing on a Whisper Code (Diffie-Hellman Key Exchange):</b> Right in front of a crowded airport terminal, you both exchange a pair of public numbers. Using these numbers, you both calculate the exact same secret code (the <b>Session Key</b>)—without anyone else in the room being able to figure it out.
</p>
</div>
<div class="flex items-start gap-3.5">
<span class="text-2xl shrink-0 mt-0.5">🔒</span>
<p class="text-sm md:text-base text-slate-800 dark:text-slate-200 m-0 leading-relaxed">
<b>4. Talking Securely (Encrypted Application Traffic):</b> From that moment on, every message you exchange is encrypted with that secret key. To anyone listening in, it sounds like pure white noise.
</p>
</div>
</div>
</div>

---

## 2. Handshake Mechanics: TLS 1.2 vs. TLS 1.3

### What is an RTT (Round Trip Time)?
An **RTT** is simply the time it takes for a data packet to travel from your client to the server and back again. If your user is in London and your API gateway is in Oregon, a single round trip easily takes **120ms to 180ms**. When setting up a secure connection, every round trip you eliminate directly cuts user-facing latency.

---

### The Legacy TLS 1.2 Handshake (2 Full Round Trips)

In TLS 1.2 ([RFC 5246](https://datatracker.ietf.org/doc/html/rfc5246)), setting up a secure channel takes **two full round trips (2-RTT)** before the client receives its first response to application data:

```text
CLIENT                                               SERVER
  │                                                    │
  │ ─── 1. ClientHello (Ciphers, Random, SNI) ───────> │  [RTT 1: Negotiation]
  │ <── 2. ServerHello (Chosen Cipher, Random) ─────── │
  │ <── 3. Certificate (Leaf + Intermediates) ──────── │  (Sent in Cleartext!)
  │ <── 4. ServerKeyExchange (ECDHE Params + Sig) ──── │
  │ <── 5. ServerHelloDone ─────────────────────────── │
  │                                                    │
  │ ─── 6. ClientKeyExchange (Client ECDHE Share) ───> │  [RTT 2: Key Confirmation]
  │ ─── 7. ChangeCipherSpec ─────────────────────────> │
  │ ─── 8. Finished (Encrypted Verify Hash) ─────────> │
  │ ─── 9. Encrypted Application Data (HTTP GET) ────> │  (Sent in second client flight)
  │ <── 10. ChangeCipherSpec ───────────────────────── │
  │ <── 11. Finished (Encrypted Verify Hash) ───────── │
```

<div class="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-slate-200 my-4">
<b>💡 In Plain English:</b> In TLS 1.2, the client and server spend the first round trip figuring out ciphers and looking at certificates. They spend the second round trip computing keys and verifying that encryption works. Only in the second flight can the client send its HTTP payload.
</div>

---

### Why TLS 1.3 Improved on TLS 1.2

Published in 2018, **TLS 1.3 ([RFC 8446](https://datatracker.ietf.org/doc/html/rfc8446)) cleaned up the protocol to make it both faster and safer**:

1. **50% Handshake RTT Reduction (1-RTT):** The client includes its key guess (e.g., X25519) right inside `ClientHello`. The server answers with its matching share, and the handshake finishes in just **one round trip**.
2. **Encrypted Handshake Records:** In TLS 1.2, certificates traveled in cleartext over the network. In TLS 1.3, everything after `ServerHello` is encrypted, keeping domain identities and extensions hidden from passive sniffers.
3. **Mandatory Ephemeral Key Exchange:** Completely dropped static RSA key exchange (which lacked forward secrecy) in favor of ephemeral Diffie-Hellman (`ECDHE`), while deprecating legacy hash functions (such as SHA-1 and MD5) for signature verification in standard setups.

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
<b>Flight 2:</b> Client Application Data follows Finished message.
</div>
</div>
</div>
<div class="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
Handshake negotiation overhead: <b>2 RTTs</b>
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
<div class="text-sky-700 dark:text-sky-300 text-[11px] mt-1">Server responds with matching KeyShare + Encrypted Certificate.</div>
</div>
<div class="p-3 rounded-xl bg-emerald-500/20 text-emerald-900 dark:text-emerald-200 border-2 border-emerald-500/60 font-bold">
<b>RTT 1 (End):</b> Handshake completes! Everything after ServerHello is encrypted.
</div>
<div class="p-3 rounded-xl bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
<b>Data Flow:</b> Application Data flows immediately in 1 RTT!
</div>
</div>
</div>
<div class="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs text-emerald-700 dark:text-emerald-300 font-bold">
Handshake negotiation overhead: <b>1 RTT (50% TLS Handshake RTT reduction!)</b>
</div>
</div>
</div>

---

## 4. 🚨 5 Fatal TLS Handshake Misconceptions Every DevOps Engineer Must Unlearn

<div class="grid grid-cols-1 md:grid-cols-2 gap-4 my-8">
<div class="p-5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60">
<h5 class="text-sm font-bold text-rose-950 dark:text-rose-200 m-0 mb-1.5">❌ Myth 1: "TLS 1.3 0-RTT Early Data is safe for all APIs."</h5>
<p class="text-xs text-slate-700 dark:text-slate-300 m-0 leading-relaxed">
<b>Reality:</b> 0-RTT application data <b>does not provide the same forward-secrecy properties as the 1-RTT handshake</b> and is vulnerable to <b>Replay Attacks</b>. 0-RTT should only be accepted for operations that are safe to replay (idempotent GET queries). State-mutating actions (payments, POST mutations) must reject Early Data unless the application implements anti-replay tokens.
</p>
</div>

<div class="p-5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60">
<h5 class="text-sm font-bold text-rose-950 dark:text-rose-200 m-0 mb-1.5">❌ Myth 2: "Cipher suites dictate the server's certificate key type."</h5>
<p class="text-xs text-slate-700 dark:text-slate-300 m-0 leading-relaxed">
<b>Reality:</b> In TLS 1.3, cipher suites are strictly symmetric. They define only the bulk AEAD cipher and hash algorithm (e.g., <code>TLS_AES_256_GCM_SHA384</code>). Key exchange (ECDHE groups) and certificate signatures (RSA-PSS/ECDSA) are negotiated completely independently in extension fields.
</p>
</div>

<div class="p-5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60">
<h5 class="text-sm font-bold text-rose-950 dark:text-rose-200 m-0 mb-1.5">❌ Myth 3: "SNI (Server Name Indication) is encrypted by default."</h5>
<p class="text-xs text-slate-700 dark:text-slate-300 m-0 leading-relaxed">
<b>Reality:</b> In standard TLS, the SNI header is sent in plaintext inside the initial <code>ClientHello</code>. Anyone on the network path can observe the target hostname. <b>Encrypted Client Hello (ECH)</b> is specifically designed to protect SNI and sensitive extension metadata from network observers.
</p>
</div>

<div class="p-5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60">
<h5 class="text-sm font-bold text-rose-950 dark:text-rose-200 m-0 mb-1.5">❌ Myth 4: "Session Tickets store state on the server."</h5>
<p class="text-xs text-slate-700 dark:text-slate-300 m-0 leading-relaxed">
<b>Reality:</b> In RFC 5077 / TLS 1.3 PSK, the server does not need to maintain per-session state for the ticket itself. It encrypts the session parameters using a secret key (STEK) and sends the ticket to the client. When the client returns, the server validates and decrypts the ticket.
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
<span class="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 block">PRF Hash</span>
<b>SHA384</b> (Key Derivation)
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
<b>Why the difference?</b> TLS 1.3 defines a small, curated set of standardized AEAD cipher suites (such as <code>TLS_AES_256_GCM_SHA384</code>, <code>TLS_CHACHA20_POLY1305_SHA256</code>, <code>TLS_AES_128_GCM_SHA256</code>). Key Exchange (<code>supported_groups</code>: X25519, P-256) and Authentication (<code>signature_algorithms</code>: RSA-PSS, ECDSA) are negotiated separately, eliminating dangerous legacy cipher configurations.
</p>
</div>
</div>

---

## 6. Session Resumption: Session IDs, Tickets & 0-RTT Pre-Shared Keys

When a client reconnects to your server, performing a full handshake all over again is a waste of CPU and network round trips. TLS provides three generations of session resumption:

```text
Generation 1: Session IDs (Stateful)
Server stores session cache in RAM ──> Client sends Session ID ──> Cache lookup on Server

Generation 2: Session Tickets (Stateless RFC 5077)
Server encrypts state with STEK Key ──> Client stores Ticket ──> Server decrypts on return

Generation 3: TLS 1.3 PSK (Pre-Shared Key & 0-RTT)
Client sends Pre-Shared Key ticket + 0-RTT Application Data in the very first ClientHello!
```

### Production Gotcha: Session Ticket Encryption Keys (STEK) in Load-Balanced Clusters
In multi-replica architectures (such as Kubernetes Ingress or reverse proxy tiers), if a client receives a Session Ticket from Proxy A and returns to Proxy B:
- If Proxy A and Proxy B do not share the exact same **Session Ticket Encryption Key (STEK)**, Proxy B cannot decrypt the ticket and forces a full 1-RTT fallback handshake.
- Production ingress setups often configure synchronized STEKs or rely on sticky routing to maintain optimal resumption cache rates.

---

## 7. ALPN (Application-Layer Protocol Negotiation)

In older web setups, upgrading from HTTP/1.1 to HTTP/2 required an initial plaintext HTTP `Upgrade` request.

**ALPN ([RFC 7301](https://datatracker.ietf.org/doc/html/rfc7301))** eliminates this round trip by negotiating the application protocol **directly inside the TLS handshake**:

1. The client lists its supported protocols in `ClientHello`: `["h2", "http/1.1"]`.
2. The server picks its preferred protocol in `EncryptedExtensions`: `h2`.
3. The moment the TLS handshake completes, the first byte sent over the wire is native HTTP/2 binary frames.

---

## 8. ⚠️ Common Production Gotchas: Why TLS Handshakes Break

### 1. The SNI (Server Name Indication) Routing Trap
When hosting multiple services behind a single Ingress IP (e.g., `api.gcloudcafe.com` and `auth.gcloudcafe.com`):
- The client must include the **SNI extension** in `ClientHello`.
- If a client (e.g., an older script or custom embedded client) connects directly by raw IP without setting SNI, the Ingress proxy falls back to the **default catch-all certificate**, resulting in instant domain mismatch errors.

### 2. Plaintext vs. HTTPS Port Mismatches
If a client accidentally sends an unencrypted HTTP request to an HTTPS port:
```text
curl http://api.gcloudcafe.com:443
# Result: curl: (56) Recv failure: Connection reset by peer
# Server log: http: TLS handshake error from ...: client sent an HTTP request to an HTTPS server
```

---

## 9. Hands-On OpenSSL Lab: Inspecting Handshakes & Troubleshooting

Here are the exact diagnostic commands you can run right from your terminal:

### 9.1. Tracing the Complete TLS 1.3 Handshake Packet-by-Packet
Use OpenSSL's `-msg` flag to view every raw handshake message exchanged:

```bash
openssl s_client -connect gcloudcafe.com:443 -servername gcloudcafe.com -tls1_3 -msg
```
**Output highlights to look for:**
```text
>>> TLS 1.3, ClientHello
<<< TLS 1.3, ServerHello
<<< TLS 1.3, EncryptedExtensions
<<< TLS 1.3, Certificate
<<< TLS 1.3, CertificateVerify
<<< TLS 1.3, Finished
>>> TLS 1.3, Finished
```

### 9.2. Verifying ALPN Protocol Selection
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
| **Handshake Latency** | **2 RTTs** (Two full round trips) | **1 RTT** (50% handshake RTT reduction) / **0-RTT** Resumption |
| **Handshake Encryption** | Certificate sent in cleartext | Certificate encrypted after `ServerHello` |
| **Key Exchange** | Static RSA (insecure) or (EC)DHE | **Ephemeral Diffie-Hellman (`(EC)DHE`) or Pre-Shared Key (`PSK` / `PSK+(EC)DHE`)** |
| **Forward Secrecy** | Optional (depended on cipher suite) | **Mandatory in standard (EC)DHE handshakes** |
| **Cipher Suite Syntax** | Monolithic (`TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384`) | Orthogonal (`TLS_AES_256_GCM_SHA384`) |
| **Session Resumption** | Session ID / RFC 5077 Tickets | **PSK (Pre-Shared Key) + 0-RTT Early Data** |

Now that you have a firm grasp on how the TLS handshake negotiates cryptographic engines over the wire, you're ready to dive into internal enterprise security.

👉 **In Part 3: Production TLS, mTLS, KeyStores & Incident Management**, we will explore:
- **Mutual TLS (mTLS):** Enforcing bidirectional client certificate authentication in zero-trust architectures.
- **Java KeyStores (`.jks`) vs. TrustStores (`cacerts`):** Solving `PKIX path building failed` once and for all.
- **Automating Certificate Lifecycles:** Kubernetes `cert-manager`, Vault PKI, and automated zero-downtime rotation.
- **Post-Mortem Playbook:** Surviving 3 AM production certificate expiration incidents.
