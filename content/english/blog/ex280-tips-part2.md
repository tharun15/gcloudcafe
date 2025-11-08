---
title: "EX280 – OpenShift Administrator Tips & Tricks (Part 2): Network Policies and Edge Routes"
meta_title: "OpenShift EX280 Tips – Network Policies and Edge Routes"
date: 2025-11-10
image: "/images/post6-dp-tips2.png"
description: "Continuing the EX280 – OpenShift Administrator Tips & Tricks mini-series with a deep dive into Network Policies and Edge Routes."
categories: ["Certifications", "DevOps", "Red Hat", "OpenShift", "Administrator"]
tags: ["Red Hat", "OpenShift", "EX280", "Tips", "NetworkPolicy", "EdgeRoutes", "Security"]
author: tharun-vempati
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

```bash
oc expose service myapp --name=myapp-edge --hostname=myapp.apps.example.com --port=8080 --path=/ --insecure-policy=Redirect
oc annotate route myapp-edge "haproxy.router.openshift.io/timeout"="5m"
```

This exposes your application securely over HTTPS with automatic redirection from HTTP.

✅ **Pro Tip:**  
You can test the route’s TLS configuration quickly using:
```bash
oc get route myapp-edge -o yaml | grep tls
```

---

## 🧠 Exam Strategy

- Practice **creating and deleting routes** using both the CLI and the web console.  
- Be comfortable identifying which **route type** to use in a given scenario.  
- Learn to **validate route status** using:
  ```bash
  oc describe route <route-name>
  ```
- Always **label namespaces and pods consistently** when writing NetworkPolicies.

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
