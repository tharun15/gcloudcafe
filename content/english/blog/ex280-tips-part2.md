---
title: "EX280 – OpenShift Administrator Tips & Tricks (Part 2): Network Policies and Edge Routes"
meta_title: "OpenShift EX280 Tips – Network Policies and Edge Routes"
date: 2025-11-09
image: "/images/post6-dp-tips2.png"
description: "Continuing the EX280 – OpenShift Administrator Tips & Tricks mini-series with a deep dive into Network Policies and Edge Routes."
categories: ["OpenShift & Linux"]
tags: ["Red Hat", "OpenShift", "EX280", "Tips", "NetworkPolicy", "EdgeRoutes", "Security", "Administrator", "Certifications", "DevOps"]
author: tharun-vempati
series: "EX280 – OpenShift Administrator Tips & Tricks"
series_order: 2
draft: false
---

Welcome to the second part of my **EX280 – OpenShift Administrator Tips & Tricks** mini-series!  
In this post, we’ll explore **Network Policies** and **Edge Routes** — two essential exam objectives that often confuse first-time candidates. Mastering them not only boosts your chances of success in the EX280 but also builds your foundation as a secure OpenShift administrator.

---

## 🧩 Why Network Policies Matter

Network Policies in OpenShift (and Kubernetes) define how pods communicate with each other and with the outside world.  
By default, pods can talk to any other pod in the same cluster — which is not ideal for production-grade security.  

**Your goal in the exam:**  
You should be able to create, test, and apply a **NetworkPolicy** that limits communication between specific namespaces or pod groups.

---

### Example: Restrict Traffic Between Namespaces

Here’s a typical exam-style task you might encounter:

> “Only allow pods with label `app=frontend` in the `dev` namespace to communicate with pods labeled `app=backend` in the `prod` namespace.”

You could achieve that using the following manifest:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-frontend-to-backend
  namespace: prod
spec:
  podSelector:
    matchLabels:
      app: backend
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          kubernetes.io/metadata.name: dev
      podSelector:
        matchLabels:
          app: frontend
  policyTypes:
  - Ingress
```

✅ **Pro Tip:**  
Always double-check your **labels** and **namespaces** — 80% of NetworkPolicy issues stem from incorrect selectors.

---

## 🌐 Understanding Edge, Passthrough, and Re-encrypt Routes

Routes in OpenShift expose your applications externally.  
The EX280 focuses mainly on your ability to **create secure routes** and understand **different TLS termination types**.

### Three Key Route Types You Must Know

| Type | Description | TLS Termination |
|------|--------------|----------------|
| **Edge** | TLS terminates at the router. The router decrypts traffic before forwarding it to the backend.  The router (Ingress Controller) decrypts (terminates) the TLS traffic, so backend pods receive unencrypted (HTTP) traffic. | ✅ Yes |
| **Passthrough** | TLS terminates at the pod, allowing full end-to-end encryption. | 🚫 No |
| **Re-encrypt** | TLS terminates at the router, then re-encrypts before reaching the pod. | ✅ Yes (twice) |

---

### Example: Creating a Secure Edge Route

## 🔐 Edge Routes — The Exam's Subtle Sysadmin Challenge

Creating an edge-terminated route in OpenShift is straightforward when everything is provided. But during the EX280 exam, things are deliberately structured to test your real-world troubleshooting mindset.

You’ll often see instructions like:

> “Use the provided script `create-certs.sh` to generate the certificates required for an edge route.”

Sounds simple, right?  
But here’s the catch:

- The script name is provided ✅  
- **The path to the script is not** ❌  

This is intentional. It tests your ability to locate files across the Linux filesystem — a crucial skill for any OpenShift admin operating in production environments.

---

## 🕵️ Searching for the Certificate Script

The script can be anywhere inside the workstation filesystem. Searching manually is time-consuming and inefficient.

This is where your **Linux sysadmin skills** shine.

Use the `find` command:

```bash
find / -type f -name "create-certs.sh" 2>/dev/null
```
If you only remember part of the script name (which is common in exam pressure):
```bash
find / -type f | grep cert
```


If you only remember part of the script name (which is common in exam pressure):
```bash
find / -type f | grep cert
```
✅ Adding 2>/dev/null helps suppress permission-denied noise and keeps your output readable.

Once you find the script:
📁 Copy the Script to Your Working Directory
```bash
cd /path/to/script
cp create-certs.sh ~/
cd ~/
```
Next, ensure you have permission to execute it:
```bash
chmod +x create-certs.sh
```
And run it:
```bash
./create-certs.sh
```

The script typically generates:
tls.crt
tls.key
sometimes ca.crt
These files are essential for the edge route.

🚀 Create the Edge Route Using Certificates
Once you have the certificates in your home directory, run:
```bash
oc create route edge secure-app \
  --service=myapp \
  --cert=tls.crt \
  --key=tls.key
```
If the script outputs a CA file and it's required:
```bash
--ca-cert=ca.crt
```

Make sure you reference the correct service name.

✅ **Pro Tip:**  
You can test the route’s TLS configuration quickly using:
```bash
oc get route myapp-edge -o yaml | grep tls
```

🧠 Why This Matters

This entire process tests more than OpenShift knowledge:

Navigating Linux directories

Using find and grep effectively

Understanding file permissions

Executing scripts

Generating and applying certificates

These are the real-world skills you’ll use in day-to-day OpenShift administration — and the exam expects you to perform them confidently.

---

## 🧠 Exam Strategy

- Practice **creating and deleting routes** using both the CLI and the web console.  
- Be comfortable identifying which **route type** to use in a given scenario.  
- Learn to **validate route status** using:
  ```bash
  oc describe route <route-name>
  ```
- Always **label namespaces and pods consistently** when writing NetworkPolicies.
- Practice using find and grep under pressure

If you can configure a secure Edge route and apply a valid NetworkPolicy in **under 10 minutes**, you’re well on your way to scoring high in this section.

---

## ⏱️ My Advice

Spend at least **30 minutes** revising NetworkPolicy syntax before your exam.  
Practice in Red Hat’s DO280 labs — they’re excellent for this section.  

The more you understand *why* a policy behaves a certain way, the more confident you’ll feel during the test.

---

### Coming Up Next…
In **Part 3**, we’ll look at one of the most hands-on exam areas — **Storage, ConfigMaps, and Secrets** — the heart of persistent and configurable OpenShift applications.

Stay tuned 🚀  
And as always, practice, break, and rebuild — that’s the best way to master OpenShift.
