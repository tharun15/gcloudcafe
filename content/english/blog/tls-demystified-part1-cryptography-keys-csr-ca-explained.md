---
title: "TLS for DevOps Engineers (Part 1): Keys, CSRs, CAs, and the Chain of Trust Demystified"
meta_title: "TLS for DevOps (Part 1): Keys, CSRs, CAs & Chain of Trust"
description: "Master modern TLS fundamentals for DevOps & Kubernetes: The postcard internet, Alice & Bob's padlock story, Key-to-Cert pipeline, 5 common misconceptions, and OpenSSL commands."
date: 2026-08-14
image: "/images/tls-part1-foundations.jpg"
categories: ["Security", "DevOps", "Architecture"]
tags: ["TLS", "SSL", "Cryptography", "Certificates", "OpenSSL", "DevOps", "Security"]
author: tharun-vempati
featured: true
draft: false
---

When you enter a password, submit credit card details, or deploy an ingress route right now, how do you know someone isn't silently sniffing every byte you send?

Look at the top of your web browser. Right next to the address bar, you will see a small padlock icon. If you click it, your browser displays a reassuring message: *"Connection is secure."*

We rely on that tiny lock hundreds of times a day. But what is actually happening behind that symbol? Why is an open network like the internet so vulnerable to eavesdropping by default, and how does your browser prove you are talking to the legitimate website rather than an imposter?

Welcome to **Part 1 of our 3-Part Deep Dive into TLS & mTLS Architecture for DevOps Engineers**:

- **Part 1 (You Are Here):** The Alice & Bob Foundation: Keys, CSRs, Public vs. Private PKI, and the Chain of Trust.
- **Part 2:** The Modern TLS Handshake (TLS 1.2 vs 1.3), Cipher Suites, and Real-World SSL Debugging.
- **Part 3:** Mutual TLS (mTLS), Java KeyStores vs. TrustStores, and Surviving Production Certificate Expirations.

---

## 1. Why TLS Exists: The Postcard Internet

When you send a traditional letter inside a sealed envelope, you expect privacy. But the original internet wasn't built with envelopes—it was built with **postcards**.

Whenever you browse an unprotected website (`http://`), your computer transmits plain text messages across an open network. Your data hops through dozens of intermediate systems:

- The public Wi-Fi router at your local coffee shop.
- Your Internet Service Provider (ISP).
- Commercial backbone routers and switches spanning continents.

<div class="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 my-8 shadow-sm space-y-3">
<div class="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-base">
<span>📮</span> The Open Postcard Analogy
</div>
<p class="text-sm text-slate-800 dark:text-slate-200 leading-relaxed m-0">
Anyone handling an open postcard can read every word written on it. If you write your credit card number, login password, or private messages on a postcard, anyone along the delivery route can inspect it, photocopy it, or even take an eraser and rewrite the numbers.
</p>
</div>

This open design created three fundamental security challenges:

1. **Eavesdropping:** Anyone with packet-sniffing access on the network path can inspect plain text traffic.
2. **Tampering:** Intermediate actors can modify data in transit without either party knowing.
3. **Impersonation:** A rogue server can pretend to be your target bank or API, and you would have no native way to verify its true identity.

To solve this, **TLS (Transport Layer Security)** is designed to provide three fundamental security properties:

- **Confidentiality:** Bulk symmetric encryption prevents passive eavesdroppers from reading traffic. *(Note: Metadata like packet sizes and destination IP/SNI may remain observable unless specific padding or Encrypted Client Hello is used.)*
- **Integrity:** Authenticated encryption (AEAD) ensures that any in-transit modification or tampering causes the connection to terminate immediately.
- **Authentication:** Digital signatures and X.509 certificates verify that the server (and optionally the client in mTLS) legitimately owns the identity it claims.

---

## 2. Public-Key Cryptography: The Alice, Bob, and Padlock Story

Before exploring modern protocol mechanics, let's look at how two parties—**Alice and Bob**—solve the problem of establishing trust and privacy across an open, untrusted postal route.

Bob wants *anyone in the world* (including Alice) to be able to send him confidential mail, even if Bob and Alice have never met in person before.

<div class="p-6 md:p-8 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 my-8 shadow-sm space-y-5">
<div class="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-lg border-b border-slate-200/80 dark:border-slate-800/80 pb-3">
<span>💡</span> The Padlock & Briefcase Story (The Core Mental Model)
</div>
<div class="space-y-4">
<div class="flex items-start gap-3.5">
<span class="text-2xl shrink-0 mt-0.5">🔓</span>
<p class="text-sm md:text-base text-slate-800 dark:text-slate-200 m-0 leading-relaxed">
<b>1. The Open Padlock (Bob's Public Key):</b> Bob buys thousands of identical metal padlocks, leaves them in the <b>open (unlocked)</b> state, and distributes them freely to anyone who asks.
</p>
</div>
<div class="flex items-start gap-3.5">
<span class="text-2xl shrink-0 mt-0.5">🔑</span>
<p class="text-sm md:text-base text-slate-800 dark:text-slate-200 m-0 leading-relaxed">
<b>2. The Secret Key (Bob's Private Key):</b> Bob holds the single physical key that unlocks those padlocks. He keeps it safely in his pocket and never shares it with anyone.
</p>
</div>
<div class="flex items-start gap-3.5">
<span class="text-2xl shrink-0 mt-0.5">📦</span>
<p class="text-sm md:text-base text-slate-800 dark:text-slate-200 m-0 leading-relaxed">
<b>3. Alice Locks the Message:</b> Alice writes a private note, places it inside a metal briefcase, grabs one of Bob's open padlocks, snaps it shut (<i>Click!</i> 🔒), and sends it through the mail. Once snapped shut, even Alice cannot re-open the briefcase.
</p>
</div>
<div class="flex items-start gap-3.5">
<span class="text-2xl shrink-0 mt-0.5">🔓</span>
<p class="text-sm md:text-base text-slate-800 dark:text-slate-200 m-0 leading-relaxed">
<b>4. Bob Unlocks It:</b> Eavesdroppers along the postal route cannot open the briefcase. Only Bob, using his private physical key, can unlock the padlock and read Alice's message.
</p>
</div>
</div>
</div>

This story provides the intuitive mental model for public-key cryptography. But in modern internet engineering, asymmetric keys are not used to encrypt the entire data stream.

---

## 3. The 3 Cryptographic Jobs: Authentication vs. Key Exchange vs. Encryption

In legacy TLS 1.2 handshakes, systems sometimes used *static RSA key transport*—where the client encrypted a secret directly using the server's public key. 

However, **modern TLS 1.3 ([RFC 8446](https://datatracker.ietf.org/doc/html/rfc8446)) completely removed static RSA key exchange** because it lacked **Forward Secrecy** (if the server's private key was ever leaked in the future, all historically recorded encrypted traffic could be decrypted).

Modern TLS cleanly divides cryptographic work into three distinct roles:

<div class="space-y-4 my-8">
<div class="p-6 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/70 shadow-sm">
<div class="flex items-center justify-between flex-wrap gap-2 mb-2">
<div class="flex items-center gap-3">
<span class="text-2xl">🪪</span>
<h4 class="text-base font-bold text-indigo-950 dark:text-indigo-100 m-0">1. Authentication (Digital Signatures)</h4>
</div>
<span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-mono">RSA-PSS / ECDSA / Ed25519</span>
</div>
<p class="text-sm text-slate-800 dark:text-slate-200 leading-relaxed m-0">
The server's certificate contains an asymmetric public key. The server creates a digital signature over the handshake transcript using its private key (<code>CertificateVerify</code>) to prove it legitimately owns the certificate. <b>The certificate's asymmetric key authenticates identity; it is NOT used to encrypt the session secret.</b>
</p>
</div>

<div class="p-6 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/70 shadow-sm">
<div class="flex items-center justify-between flex-wrap gap-2 mb-2">
<div class="flex items-center gap-3">
<span class="text-2xl">🤝</span>
<h4 class="text-base font-bold text-blue-950 dark:text-blue-100 m-0">2. Key Exchange (Ephemeral Diffie-Hellman)</h4>
</div>
<span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-700 dark:text-blue-300 font-mono">ECDHE (X25519 / P-256)</span>
</div>
<p class="text-sm text-slate-800 dark:text-slate-200 leading-relaxed m-0">
Client and server each generate one-time, ephemeral key pairs. Through Diffie-Hellman mathematics, both sides independently calculate the exact same shared secret without transmitting it over the wire. This ensures <b>Forward Secrecy</b>.
</p>
</div>

<div class="p-6 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/70 shadow-sm">
<div class="flex items-center justify-between flex-wrap gap-2 mb-2">
<div class="flex items-center gap-3">
<span class="text-2xl">⚡</span>
<h4 class="text-base font-bold text-emerald-950 dark:text-emerald-100 m-0">3. Record Encryption (Symmetric AEAD via HKDF)</h4>
</div>
<span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-mono">AES-GCM / ChaCha20-Poly1305</span>
</div>
<p class="text-sm text-slate-800 dark:text-slate-200 leading-relaxed m-0">
Using HKDF (HMAC-based Key Derivation Function), both endpoints derive temporary symmetric traffic keys from the shared secret. Authenticated Encryption with Associated Data (AEAD) encrypts application data at gigabits per second with native CPU acceleration (AES-NI / ARM Crypto).
</p>
</div>
</div>

### 🗺️ The Complete TLS Mental Model Flowchart

Here is the exact architectural pipeline from certificate verification to encrypted traffic:

<div class="p-6 sm:p-8 rounded-3xl bg-slate-50 dark:bg-slate-900/90 border-2 border-slate-200 dark:border-slate-800 my-8 shadow-md">
<div class="text-center font-extrabold text-lg sm:text-xl text-slate-900 dark:text-white mb-6 flex items-center justify-center gap-2">
<span>🧭</span> The Modern TLS Architecture Mental Model
</div>
<div class="flex flex-col items-center space-y-3.5 max-w-xl mx-auto">
<div class="w-full p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/60 border-2 border-sky-300 dark:border-sky-600/70 text-center shadow-xs">
<div class="text-xs font-bold uppercase tracking-wider text-sky-800 dark:text-sky-300 mb-1">Step 1 • X.509 Certificate (RFC 5280)</div>
<div class="text-sm sm:text-base font-bold text-sky-950 dark:text-sky-100">Server Public Key · Domain / SANs · Issuer · CA Signature</div>
</div>
<div class="text-sky-600 dark:text-sky-400 font-black text-2xl">↓</div>
<div class="w-full p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border-2 border-indigo-300 dark:border-indigo-600/70 text-center shadow-xs">
<div class="text-xs font-bold uppercase tracking-wider text-indigo-800 dark:text-indigo-300 mb-1">Step 2 • Identity Proof (RFC 8446)</div>
<div class="text-sm sm:text-base font-bold text-indigo-950 dark:text-indigo-100">Client Trusts CA ➔ Server Identity <span class="text-emerald-700 dark:text-emerald-400 font-extrabold underline decoration-2">AUTHENTICATED</span> via Signature</div>
</div>
<div class="text-indigo-600 dark:text-indigo-400 font-black text-2xl">↓</div>
<div class="w-full p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border-2 border-blue-300 dark:border-blue-600/70 text-center shadow-xs">
<div class="text-xs font-bold uppercase tracking-wider text-blue-800 dark:text-blue-300 mb-1">Step 3 • Ephemeral Key Agreement (ECDHE)</div>
<div class="text-sm sm:text-base font-bold text-blue-950 dark:text-blue-100">ECDHE (X25519 / P-256) ➔ Independent Computation of <span class="text-amber-700 dark:text-amber-300 font-black">Shared Secret</span></div>
</div>
<div class="text-blue-600 dark:text-blue-400 font-black text-2xl">↓</div>
<div class="w-full p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border-2 border-amber-300 dark:border-amber-600/70 text-center shadow-xs">
<div class="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 mb-1">Step 4 • HKDF Key Derivation (AEAD)</div>
<div class="text-sm sm:text-base font-bold text-amber-950 dark:text-amber-100">Derive Symmetric Session Keys (AES-256-GCM / ChaCha20-Poly1305)</div>
</div>
<div class="text-emerald-600 dark:text-emerald-400 font-black text-2xl">↓</div>
<div class="w-full p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 border-2 border-emerald-500 dark:border-emerald-500/80 text-center shadow-md">
<div class="text-sm sm:text-base font-black text-emerald-900 dark:text-emerald-200 flex items-center justify-center gap-2">
<span>🔒</span> Fast, Tamper-Proof Application Data Flow
</div>
</div>
</div>
</div>

---

## 4. 🚨 5 Fatal TLS Misconceptions Every DevOps Engineer Must Unlearn

Before configuring Ingress controllers or debugging certificate pipelines, let's dispel the most common myths:

<div class="grid grid-cols-1 md:grid-cols-2 gap-4 my-8">
<div class="p-5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60">
<h5 class="text-sm font-bold text-rose-950 dark:text-rose-200 m-0 mb-1.5">❌ Myth 1: "The certificate is the private key."</h5>
<p class="text-xs text-slate-700 dark:text-slate-300 m-0 leading-relaxed">
<b>Reality:</b> The certificate (<code>.crt</code>/<code>.pem</code>) is public and contains only your <b>Public Key</b> and domain identity. The <b>Private Key</b> (<code>.key</code>) is generated locally and must never leave your server.
</p>
</div>

<div class="p-5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60">
<h5 class="text-sm font-bold text-rose-950 dark:text-rose-200 m-0 mb-1.5">❌ Myth 2: "The CSR contains the private key."</h5>
<p class="text-xs text-slate-700 dark:text-slate-300 m-0 leading-relaxed">
<b>Reality:</b> A CSR contains your Public Key and requested SANs. It is signed by your Private Key to prove possession, but contains <b>zero private key material</b>.
</p>
</div>

<div class="p-5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60">
<h5 class="text-sm font-bold text-rose-950 dark:text-rose-200 m-0 mb-1.5">❌ Myth 3: "The CA creates and gives me my private key."</h5>
<p class="text-xs text-slate-700 dark:text-slate-300 m-0 leading-relaxed">
<b>Reality:</b> You generate the private key on your own machine. The CA only receives your CSR, verifies domain control, and issues a signed certificate.
</p>
</div>

<div class="p-5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60">
<h5 class="text-sm font-bold text-rose-950 dark:text-rose-200 m-0 mb-1.5">❌ Myth 4: "The public key encrypts all HTTPS traffic."</h5>
<p class="text-xs text-slate-700 dark:text-slate-300 m-0 leading-relaxed">
<b>Reality:</b> In TLS 1.3, public keys are used exclusively for authentication. Ephemeral Diffie-Hellman derives temporary symmetric session keys (AES-GCM/ChaCha20) that encrypt bulk traffic.
</p>
</div>

<div class="p-5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 md:col-span-2">
<h5 class="text-sm font-bold text-amber-950 dark:text-amber-200 m-0 mb-1.5">❌ Myth 5: "Self-signed certificates have weaker encryption than CA certificates."</h5>
<p class="text-xs text-slate-700 dark:text-slate-300 m-0 leading-relaxed">
<b>Reality:</b> The mathematical cipher algorithms (AES-256, P-256) are identical. What self-signed certificates lack is <b>trusted third-party identity verification</b>, making them vulnerable to Man-in-the-Middle impersonation.
</p>
</div>
</div>

---

## 5. The Imposter Problem & CSRs (Certificate Signing Requests)

Now consider the core problem: **What if an attacker named Eve intercepts the connection and presents her own public key, claiming to be Bob?**

Alice would establish a secure, encrypted connection—but with Eve instead of Bob!

To prevent this Man-in-the-Middle impersonation, Bob cannot just send an unverified public key. **Bob must submit a CSR to a Certificate Authority (CA) to get an official digital certificate.**

<div class="p-6 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 my-6 shadow-sm">
<h4 class="text-base font-bold text-amber-950 dark:text-amber-100 m-0 mb-2">📄 The Key-to-Certificate Pipeline</h4>
<div class="font-mono text-xs sm:text-sm bg-slate-900 text-slate-200 p-4 rounded-xl my-3 leading-relaxed overflow-x-auto">
Private Key (server.key) [SECRET]<br>
&nbsp;&nbsp;&nbsp;&nbsp;│<br>
&nbsp;&nbsp;&nbsp;&nbsp;├──→ Extracts Public Key<br>
&nbsp;&nbsp;&nbsp;&nbsp;│<br>
&nbsp;&nbsp;&nbsp;&nbsp;└──→ Packages into CSR (server.csr) ──→ Submits to CA<br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│<br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓ CA signs with its key<br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Signed Certificate (server.crt)<br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│<br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓ Installed on Nginx / Ingress<br>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Production TLS / HTTPS
</div>
<p class="text-sm text-slate-800 dark:text-slate-200 leading-relaxed m-0">
A CSR (defined in <a href="https://datatracker.ietf.org/doc/html/rfc2986" target="_blank" rel="noopener" class="underline font-bold">RFC 2986 / PKCS #10</a>) contains your <b>Public Key</b>, your organization details, and your domain names (SANs). It is signed by your Private Key to prove you possess the key pair.
</p>
</div>

### Quick Comparison Cheat Sheet

| Term | What It Is | Role in Modern TLS | Is It Secret? |
| :--- | :--- | :--- | :--- |
| **Private Key** (`.key`) | Secret cryptographic key kept strictly on the server. | Creates digital signatures during TLS authentication. | **YES (Strictly Confidential)** |
| **Public Key** (`.pub`) | Public counterpart embedded in the X.509 certificate. | Used by clients to verify the server's digital signatures. | **No (Publicly Distributed)** |
| **Key Exchange (ECDHE)** | Ephemeral key agreement protocol (X25519, P-256). | Both endpoints independently derive the shared session secret. | Temporary (Ephemeral) |
| **CSR** (Certificate Signing Request) | Standardized request bundle with Public Key & SANs. | Submitted to CA to obtain a signed certificate. | **No** |
| **CA** (Certificate Authority) | Accredited entity that verifies domain ownership. | Digitally signs certificates with its private key. | Public Root CAs are pre-trusted |
| **Digital Certificate** (`.crt`, `.pem`) | X.509 document binding a Public Key to domain names. | Sent to clients during handshake for identity proof. | **No** |
| **SAN** (Subject Alternative Name) | Domain names, wildcards, or IP addresses certified. | Defines exact hosts the certificate is valid for. | **No** |

---

## 6. Digital Certificates: The Notarized Identity

Once the CA verifies you control the domain, it produces an **X.509 Digital Certificate** ([RFC 5280](https://datatracker.ietf.org/doc/html/rfc5280)).

Bob installs this certificate on his web server, Kubernetes Ingress controller, or [OpenShift Edge Route](/blog/ex280-tips-part2/) and presents it to clients during the TLS handshake.

### Key Length vs. File Size on Disk (Key Size ≠ File Size)
A frequent point of confusion is the difference between cryptographic key parameters and actual file sizes on disk:

> **Important:** Key length refers to the mathematical bit-length of the underlying cryptographic key material, which is **not the same as the size of the encoded private-key file or certificate on disk**.

<div class="grid grid-cols-1 md:grid-cols-2 gap-5 my-8">
<div class="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm">
<h5 class="text-base font-bold text-primary m-0 mb-3">🔑 Cryptographic Key Strength (Bits)</h5>
<ul class="text-sm text-slate-800 dark:text-slate-200 space-y-2.5 m-0 pl-4">
<li><b>RSA 2048-bit:</b> 2,048-bit modulus size (~112-bit security level). Baseline web standard.</li>
<li><b>RSA 4096-bit:</b> 4,096-bit modulus size (~128-bit security level). Used for Root and Intermediate CAs.</li>
<li><b>ECDSA P-256:</b> 256-bit elliptic curve key. Provides ~128-bit security strength (commonly compared with RSA-3072 in NIST guidelines) with faster signature generation.</li>
<li><b>AES-256:</b> 256-bit symmetric session key for bulk data encryption.</li>
</ul>
</div>

<div class="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm">
<h5 class="text-base font-bold text-emerald-600 dark:text-emerald-400 m-0 mb-3">📄 Physical File Sizes on Disk (Kilobytes)</h5>
<ul class="text-sm text-slate-800 dark:text-slate-200 space-y-2.5 m-0 pl-4">
<li><b>Private Key File (<code>server.key</code>):</b> <b>~250 bytes (ECDSA) to ~1.7 KB (RSA 2048)</b> due to ASN.1 encoding headers, exponents, and prime factors in Base64 PEM text.</li>
<li><b>Single Certificate (<code>server.crt</code>):</b> <b>~1.2 KB to 2.5 KB</b>. Contains public key, SANs, validity dates, extensions, and CA signature.</li>
<li><b>Full Chain Bundle (<code>fullchain.pem</code>):</b> <b>~3.5 KB to 6 KB</b> (Leaf + Intermediate certificates combined).</li>
</ul>
</div>
</div>

---

## 7. Certificate Authorities: Public CAs vs. Private PKI & Certificate Management

Who issues and validates these certificates?

<div class="grid grid-cols-1 md:grid-cols-2 gap-5 my-8">
<div class="p-6 rounded-2xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/60 shadow-sm">
<div class="flex items-center gap-2 font-bold text-sky-950 dark:text-sky-100 text-base mb-3">
<span>🌐</span> Public Certificate Authorities
</div>
<ul class="text-sm text-slate-800 dark:text-slate-200 space-y-2 m-0 pl-4 leading-relaxed">
<li><b>Examples:</b> Let's Encrypt, DigiCert, Sectigo, Google Trust Services.</li>
<li><b>Trust Model:</b> For publicly trusted certificates, the client typically already has the required root trust anchor in its trust store (pre-installed in OS, browser, or JVM).</li>
<li><b>Use Case:</b> Public internet websites, customer-facing SaaS apps, public REST APIs.</li>
<li><b>Constraints:</b> Requires verifiable public domain control (ACME RFC 8555). Cannot issue certificates for internal private DNS.</li>
</ul>
</div>

<div class="p-6 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 shadow-sm">
<div class="flex items-center gap-2 font-bold text-indigo-950 dark:text-indigo-100 text-base mb-3">
<span>🏢</span> Private PKI & Certificate Management
</div>
<ul class="text-sm text-slate-800 dark:text-slate-200 space-y-2 m-0 pl-4 leading-relaxed">
<li><b>Managed Private CA Services:</b> AWS Private CA, Google Cloud Certificate Authority Service (CAS).</li>
<li><b>PKI Engines & Tools:</b> HashiCorp Vault PKI secrets engine, Smallstep <code>step-ca</code>.</li>
<li><b>Certificate Management & Automation:</b> Kubernetes <code>cert-manager</code> (a controller that manages certificate lifecycles from Vault, ACME, or internal issuers).</li>
<li><b>Trust Model:</b> Untrusted by default. Private PKI roots must be explicitly distributed and trusted across servers, JVM truststores, and containers.</li>
<li><b>Use Case:</b> Internal microservices, Kubernetes service meshes (Istio/Linkerd), internal mTLS, database connections.</li>
</ul>
</div>
</div>

---

## 8. The Chain of Trust: Root CAs vs. Intermediate CAs

How does a client verify a certificate? Trust is established through a **hierarchical Chain of Trust**:

<div class="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 my-8 shadow-sm space-y-4">
<div class="p-4 rounded-xl bg-sky-500/15 border border-sky-500/30">
<div class="flex items-center justify-between mb-1">
<span class="text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">Step 1 • Trust Anchor</span>
<span class="text-xs px-2.5 py-0.5 rounded bg-sky-500/20 text-sky-700 dark:text-sky-300 font-mono font-bold">Root CA</span>
</div>
<h5 class="text-sm font-bold text-slate-900 dark:text-white m-0">🏛️ Root Certificate Authority (e.g., DigiCert Global Root CA / ISRG Root X1)</h5>
<p class="text-sm text-slate-700 dark:text-slate-300 m-0 mt-1 leading-relaxed">Trusted via client TrustStore. Root CA private keys are typically kept offline or under strict operational controls (HSMs and multi-party signing ceremonies).</p>
</div>

<div class="text-center text-sky-500 font-bold text-lg">↓ Signs & Endorses</div>

<div class="p-4 rounded-xl bg-blue-500/15 border border-blue-500/30">
<div class="flex items-center justify-between mb-1">
<span class="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Step 2 • Intermediate Signing CA</span>
<span class="text-xs px-2.5 py-0.5 rounded bg-blue-500/20 text-blue-700 dark:text-blue-300 font-mono font-bold">Online CA</span>
</div>
<h5 class="text-sm font-bold text-slate-900 dark:text-white m-0">🏢 Intermediate CA (e.g., Let's Encrypt R3 / DigiCert Global G2 TLS)</h5>
<p class="text-sm text-slate-700 dark:text-slate-300 m-0 mt-1 leading-relaxed">Issued by Root CA. Actively signs day-to-day end-entity web and API certificates.</p>
</div>

<div class="text-center text-emerald-500 font-bold text-lg">↓ Issues & Signs</div>

<div class="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30">
<div class="flex items-center justify-between mb-1">
<span class="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Step 3 • Your Service / API</span>
<span class="text-xs px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-mono font-bold">Leaf Cert</span>
</div>
<h5 class="text-sm font-bold text-slate-900 dark:text-white m-0">📄 Leaf / End-Entity Certificate (e.g., api.gcloudcafe.com)</h5>
<p class="text-sm text-slate-700 dark:text-slate-300 m-0 mt-1 leading-relaxed">Installed on your Nginx reverse proxy, Ingress controller, Envoy proxy, or cloud load balancer.</p>
</div>
</div>

### Why Do Intermediate CAs Exist?
- **Blast Radius & Risk Isolation:** If a Root CA key is compromised, all certificates issued by it across the globe become invalid. Root CAs are therefore protected offline.
- **Operational Agility:** The Root CA issues Intermediate certificates valid for several years. The Intermediate CA stays online to handle daily customer requests. If an intermediate is compromised, only that single intermediate is revoked.

---

## 9. ⚠️ Critical Section: Does Certificate Chain Order Matter?

**YES, certificate chain order matters critically!**

According to the official TLS specification ([RFC 5246 Section 7.4.2](https://datatracker.ietf.org/doc/html/rfc5246#section-7.4.2) & [RFC 8446 Section 4.4.2](https://datatracker.ietf.org/doc/html/rfc8446#section-4.4.2)), when bundling certificates into a single file (such as `fullchain.pem` or `bundle.crt` for Nginx, HAProxy, Envoy, or Kubernetes Secrets), **they must be placed in strict top-down hierarchical order**:

<div class="space-y-3 my-6 p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm">
<div class="p-4 rounded-xl bg-emerald-500/15 border-2 border-emerald-500/40 flex items-center justify-between">
<div class="flex items-center gap-3">
<span class="w-8 h-8 rounded-lg bg-emerald-500 text-white font-bold flex items-center justify-center text-sm">1</span>
<div>
<span class="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Leaf / Server Certificate</span>
<div class="font-mono text-sm font-semibold text-slate-900 dark:text-white">api.gcloudcafe.com</div>
</div>
</div>
<span class="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-200">MUST BE FIRST</span>
</div>

<div class="p-4 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-between">
<div class="flex items-center gap-3">
<span class="w-8 h-8 rounded-lg bg-blue-500 text-white font-bold flex items-center justify-center text-sm">2</span>
<div>
<span class="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">Intermediate CA</span>
<div class="font-mono text-sm font-semibold text-slate-900 dark:text-white">DigiCert / Let's Encrypt Intermediate</div>
</div>
</div>
<span class="text-sm text-slate-700 dark:text-slate-300 font-medium">Signs the Leaf</span>
</div>
</div>

In your PEM bundle file, it must be structured as:

```text
-----BEGIN CERTIFICATE-----
(Your Server / Leaf Certificate)
-----END CERTIFICATE-----
-----BEGIN CERTIFICATE-----
(Intermediate CA Certificate)
-----END CERTIFICATE-----
```

### Why Incomplete or Out-of-Order Chains Cause Production Outages

Different clients and certificate-validation implementations can build and validate certificate paths differently. This means a configuration that appears to work in one client may fail in another, particularly when intermediates are missing or incorrectly configured.

- Some desktop browsers may attempt to dynamically fetch missing intermediates via **AIA (Authority Information Access)** or use locally cached intermediate certificates.
- Programmatic HTTP clients, CLI tools (`curl`), Java JVMs, Python `urllib3`, Go runtimes, and microservice frameworks require the complete, properly ordered chain directly from the TLS handshake. When the intermediate is missing or the order is inverted, they fail immediately with:
  ```text
  javax.net.ssl.SSLHandshakeException: PKIX path building failed
  curl: (35) error:0A000086:SSL routines::certificate verify failed
  ```

> **Should you include the Root CA in `fullchain.pem`?**
> **No.** The Root CA is the trust anchor expected to already reside in the client's local TrustStore. Sending the Root CA in the TLS handshake wastes packet bytes and is ignored or flagged by strict TLS validators.

---

## 10. What is a Self-Signed Certificate?

In a standard PKI setup, an accredited CA signs your certificate.

A **Self-Signed Certificate** is a certificate where **the Subject and the Issuer are identical**. You generate a private key and use that same key to sign its own public certificate—acting as your own root authority.

<div class="grid grid-cols-1 md:grid-cols-2 gap-5 my-8">
<div class="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 shadow-sm">
<div class="flex items-center gap-2 font-bold text-emerald-900 dark:text-emerald-200 text-sm mb-2">
<span>✅</span> CA-Signed Certificate
</div>
<ul class="text-sm text-slate-800 dark:text-slate-200 space-y-1.5 m-0 pl-4">
<li><b>Subject:</b> <code>api.gcloudcafe.com</code></li>
<li><b>Issuer:</b> <code>Let's Encrypt / DigiCert</code></li>
<li><b>Trust:</b> Verified automatically via pre-installed root trust stores.</li>
</ul>
</div>

<div class="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 shadow-sm">
<div class="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-200 text-sm mb-2">
<span>⚠️</span> Self-Signed Certificate
</div>
<ul class="text-sm text-slate-800 dark:text-slate-200 space-y-1.5 m-0 pl-4">
<li><b>Subject:</b> <code>localhost</code></li>
<li><b>Issuer:</b> <code>localhost</code> (Self)</li>
<li><b>Trust:</b> Untrusted by default unless manually installed into the client's trust store.</li>
</ul>
</div>
</div>

### Generating a Self-Signed Certificate in 1 Command
For local development, Docker environments, or testing, you can generate a self-signed certificate in one step:

```bash
# Generate a 2048-bit RSA Key and a Self-Signed Certificate valid for 365 days
openssl req -x509 -newkey rsa:2048 -nodes \
  -keyout dev.key \
  -out dev.crt \
  -days 365 \
  -subj "/CN=localhost"
```

### When to Use Self-Signed Certificates (and When NOT To)
- **Appropriate Uses:** Local Docker compose environments, isolated testbeds, bootstrapping initial control planes before provisioning `cert-manager`.
- **Inappropriate for Production:** Using self-signed certificates in production leads developers to disable certificate verification (`curl -k`, `InsecureSkipVerify: true`, `NODE_TLS_REJECT_UNAUTHORIZED=0`), which disables authentication and leaves connections vulnerable to Man-in-the-Middle attacks.

---

## 11. Anatomy of an X.509 Certificate

An X.509 certificate ([RFC 5280](https://datatracker.ietf.org/doc/html/rfc5280)) contains several structured fields:

<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 my-8">
<div class="p-5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
<span class="text-xs font-bold uppercase tracking-wider text-primary">Field 1</span>
<h5 class="text-base font-bold text-slate-900 dark:text-white m-0 mb-1">📅 Validity Period</h5>
<p class="text-sm text-slate-700 dark:text-slate-300 m-0 leading-relaxed"><code>Not Before</code> and <code>Not After</code> timestamps defining the active lifespan of the certificate.</p>
</div>

<div class="p-5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
<span class="text-xs font-bold uppercase tracking-wider text-primary">Field 2</span>
<h5 class="text-base font-bold text-slate-900 dark:text-white m-0 mb-1">🌐 Subject & SANs</h5>
<p class="text-sm text-slate-700 dark:text-slate-300 m-0 leading-relaxed">Common Name (CN) and Subject Alternative Names listing all authorized domain names, wildcards, and IP addresses.</p>
</div>

<div class="p-5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
<span class="text-xs font-bold uppercase tracking-wider text-primary">Field 3</span>
<h5 class="text-base font-bold text-slate-900 dark:text-white m-0 mb-1">🏢 Issuer</h5>
<p class="text-sm text-slate-700 dark:text-slate-300 m-0 leading-relaxed">Distinguished Name (DN) of the Certificate Authority that signed the certificate.</p>
</div>

<div class="p-5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
<span class="text-xs font-bold uppercase tracking-wider text-primary">Field 4</span>
<h5 class="text-base font-bold text-slate-900 dark:text-white m-0 mb-1">✍️ Digital Signature</h5>
<p class="text-sm text-slate-700 dark:text-slate-300 m-0 leading-relaxed">Cryptographic signature generated by the CA's private key over the certificate payload.</p>
</div>
</div>

---

## 12. Hands-On OpenSSL Lab: From Private Key to Verified Certificate

Let’s translate these concepts into a practical engineering workflow:

### Step 1: Generate an ECDSA Private Key
```bash
openssl ecparam -name prime256v1 -genkey -noout -out server.key
```
**File contents of `server.key`:**
```text
-----BEGIN EC PRIVATE KEY-----
MHcCAQEEIJe7x8yB9...[Base64 Encoded Private Key Data]...
-----END EC PRIVATE KEY-----
```

### Step 2: Generate a Certificate Signing Request (CSR)
```bash
openssl req -new -key server.key -out server.csr \
  -subj "/C=US/ST=California/L=San Francisco/O=GCloudCafe/CN=api.gcloudcafe.com"
```
**File contents of `server.csr`:**
```text
-----BEGIN CERTIFICATE REQUEST-----
MIICvDCCAaQCAQAw...[Public Key + Subject Identity Info]...
-----END CERTIFICATE REQUEST-----
```

### Step 3: Inspect Certificate Metadata
```bash
# Inspect Subject, Issuer, and Validity dates
openssl x509 -in server.crt -noout -subject -issuer -dates

# Inspect Subject Alternative Names (SANs)
openssl x509 -in server.crt -noout -ext subjectAltName
```

### Step 4: Verify Private Key Matches Certificate (SHA-256 Public Key Digest)
To verify that a Private Key matches a Certificate, extract their public keys in DER format and compute their **SHA-256 digests**:

```bash
# Extract and hash public key from Certificate:
openssl x509 -in server.crt -noout -pubkey | openssl pkey -pubin -outform DER | sha256sum

# Extract and hash public key from Private Key:
openssl pkey -in server.key -pubout -outform DER | sha256sum
```

> If the two SHA-256 hashes match identically, the private key and certificate are a valid cryptographic pair. This command works universally across **RSA, ECDSA, and Ed25519** keys without relying on legacy hash algorithms.

---

## 📚 Authoritative Standards & References

To explore the underlying cryptographic specifications and RFC standards:

- **[RFC 8446](https://datatracker.ietf.org/doc/html/rfc8446):** *The Transport Layer Security (TLS) Protocol Version 1.3* (IETF Standard).
- **[RFC 5280](https://datatracker.ietf.org/doc/html/rfc5280):** *Internet X.509 Public Key Infrastructure Certificate and Certificate Revocation List (CRL) Profile*.
- **[RFC 2986](https://datatracker.ietf.org/doc/html/rfc2986):** *PKCS #10: Certification Request Syntax Specification Version 1.7*.
- **[RFC 8555](https://datatracker.ietf.org/doc/html/rfc8555):** *Automatic Certificate Management Environment (ACME)*.
- **[NIST SP 800-57](https://csrc.nist.gov/publications/detail/sp/800-57-part-1/rev-5/final):** *Recommendation for Key Management (Security Strength Comparisons)*.

---

## Summary & What's Next in Part 2

| Concept | Key Architectural Takeaway |
| :--- | :--- |
| **Modern TLS Model** | Digital signatures authenticate identity; Ephemeral Diffie-Hellman (ECDHE) negotiates shared secrets (Forward Secrecy); Symmetric AEAD ciphers encrypt bulk data. |
| **What is a CSR?** | An application bundle containing your public key and identity metadata sent to a CA. It **never** contains your private key. |
| **Key Size ≠ File Size** | Key size refers to mathematical bit strength (e.g., 2048-bit RSA, 256-bit ECDSA); File size reflects ASN.1/PEM-encoded structures on disk (~1.5 KB to 5 KB). |
| **Public vs. Private PKI** | Public CAs secure internet-facing traffic via globally pre-trusted root stores; Private PKI (Vault, AWS Private CA, cert-manager) secures internal microservices/mTLS. |
| **Chain of Trust** | Intermediates protect offline Root CAs. In server bundles, the Leaf certificate must be first, followed by Intermediates. |

Now that you have a rock-solid foundation on cryptographic roles, keys, CSRs, public/private PKI, and chain ordering, you are ready to explore the protocol handshake itself.

👉 **In Part 2: The Standard TLS Handshake, Cipher Suites & SSL Troubleshooting**, we will break down:
- The step-by-step TLS 1.2 vs 1.3 handshake packet exchange (0-RTT, ServerHello, `CertificateVerify`, Encrypted Extensions).
- Real-world diagnostic tools including [SSL Shopper](https://www.sslshopper.com/ssl-checker.html), [Qualys SSL Labs](https://www.ssllabs.com/ssltest/), and OpenSSL `s_client`.
- Connecting TLS termination strategies to Kubernetes Ingress and [OpenShift Edge Routes](/blog/ex280-tips-part2/).
