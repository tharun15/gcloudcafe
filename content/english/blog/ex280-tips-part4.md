---
title: "EX280 – OpenShift Administrator Tips & Tricks (Part 4): Deployments and Reliability"
meta_title: "OpenShift EX280 Tips – Deployments and Reliability"
date: 2025-11-9
image: "/images/post8-dp-tips4.png"
description: "Kickstarting the EX280 – OpenShift Administrator Tips & Tricks mini-series with a deep dive into Deployments and Reliability."
categories: ["Certifications", "DevOps", "Red Hat", "OpenShift", "Administrator"]
tags: ["Red Hat", "OpenShift", "EX280", "Tips", "HTPasswd", "Authentication"]
author: tharun-vempati
draft: true
---

Welcome to the fourth part of my **EX280 – OpenShift Administrator Tips & Tricks** mini-series!  
This time, we’re focusing on the heart of application management in OpenShift: **Deployments and Reliability**. These topics map directly into exam tasks and reflect real-world production responsibilities every OpenShift administrator must master.

---

## 🚀 Deployments: The Engine of Application Delivery

Deployments manage how your containerized application runs, updates, and scales.  
Your EX280 exam expectations include:

- Creating and modifying deployments
- Updating images and strategies
- Managing rollouts and rollbacks
- Scaling applications (manually and automatically)

Let’s look at key operations:

### Update a Deployment Image

```bash
oc set image deployment/myapp myapp=registry.redhat.io/ubi8/httpd-24
```

### Check rollout status

```bash
oc rollout status deployment/myapp
```

### Rollback to a previous version

```bash
oc rollout undo deployment/myapp
```

✅ **Pro Tip:** Always verify labels and selectors — mismatches lead to unexpected scaling behavior.

---

## 📈 Scaling Applications

Scaling is essential for performance and resilience. The exam expects you to know both:

- **Manual scaling**
- **Horizontal Pod Autoscaling (HPA)**

### Manual scaling

```bash
oc scale deployment/myapp --replicas=3
```

### Autoscaling

```bash
oc autoscale deployment/myapp --min=1 --max=5 --cpu-percent=80
```

Then verify:

```bash
oc get hpa
```

✅ **Pro Tip:** The HPA only works when metrics-server or the OpenShift monitoring is correctly configured. In the exam environment, assume it is ready unless stated otherwise.

---

## ❤️‍🔥 Probes: Liveness, Readiness, Startup

These three probes determine your application's ability to run reliably in production.

### Readiness Probe

```yaml
readinessProbe:
  httpGet:
    path: /healthz
    port: 8080
  initialDelaySeconds: 5
  periodSeconds: 10
```

### Liveness Probe

```yaml
livenessProbe:
  httpGet:
    path: /live
    port: 8080
  initialDelaySeconds: 15
  periodSeconds: 20
```

### Startup Probe

```yaml
startupProbe:
  httpGet:
    path: /startup
    port: 8080
  failureThreshold: 30
  periodSeconds: 10
```

✅ **Pro Tip:** Know when to use each probe — this is a direct scoring area in the exam.

---

## 🔐 Security Context Constraints (SCC)

You may be required to run a deployment with specific privileges or use custom service accounts.

### Create a service account

```bash
oc create sa custom-sa
```

### Assign SCC

```bash
oc adm policy add-scc-to-user anyuid -z custom-sa
```

Then update the deployment:

```yaml
serviceAccountName: custom-sa
```

✅ **Exam Tip:** SCC misconfiguration commonly breaks pods — check `oc describe pod` for clues.

---

## 🧠 Exam Strategy

Here’s how to approach reliability tasks efficiently:

- Practice writing probe definitions repeatedly
- Understand when to use HPA vs manual scaling
- Master `oc rollout` commands — especially `status`, `undo`, and `history`
- Validate your deployment states using:
  ```bash
  oc describe deployment <name>
  ```
- Use the web console only for visual confirmation — rely on the CLI for precision

If you can configure probes, scale deployments, and fix rollout issues in under **15 minutes**, you're exam-ready.

---

### Coming Up Next…

In **Part 5**, we’ll wrap up the series with **Developer Self-Service** — quotas, limits, templates, and empowering users to work efficiently in OpenShift.

Practice smart, automate when possible, and continue operating like a production-grade OpenShift admin. 🚀
  