---
title: "Namespaces Are Not Security Boundaries in Kubernetes"
meta_title: "Why Kubernetes Namespaces Are Not Security Boundaries | Cloud Brew"
description: "Creating separate Kubernetes namespaces for dev, staging, and tenant workloads gives teams a false sense of isolation unless paired with NetworkPolicies and RBAC."
date: 2026-11-05T14:00:00-05:00
author: "Tharun Vempati"
topic: "Kubernetes & OpenShift"
topic_slug: "kubernetes"
shot_time: "1 min shot"
takeaway: "A vanilla Kubernetes Namespace is just an organizational folder until you lock it down with default-deny NetworkPolicies, ResourceQuotas, and least-privilege ServiceAccounts."
hashtags:
  - "#Kubernetes"
  - "#OpenShift"
  - "#CloudNative"
  - "#DevSecOps"
  - "#PlatformEngineering"
related_url: "/blog/ex280-tips-part3/"
related_title: "OpenShift & Kubernetes Networking and Security Deep Dive"
draft: false
---

"Don't worry, that service runs in its own namespace."

Every platform engineer has heard this phrase in an architecture review. And in vanilla Kubernetes, it is one of the most dangerous misconceptions in cloud-native security.

By default, **Kubernetes uses a flat pod network**. Unless your CNI enforces network policies, a compromised pod in `namespace-marketing-dev` can open a direct TCP connection to a database or internal API in `namespace-payments-prod` using nothing more than its cluster IP or DNS name.

A Namespace is just an API naming scope—not a firewall.

If you want real tenant or environment boundaries inside a shared cluster, every namespace provisioning template needs three non-negotiable defaults on Day 1:

1. **A default-deny ingress & egress `NetworkPolicy`** that blocks all cross-namespace traffic unless explicitly allow-listed.
2. **`ResourceQuota` and `LimitRange`** so a runaway deployment in one namespace cannot starve node CPU/memory for neighbors.
3. **Dedicated `ServiceAccount` bindings** with `automountServiceAccountToken: false` wherever pods don't talk to the Kubernetes API.

