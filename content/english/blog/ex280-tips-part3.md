---
title: "EX280 – OpenShift Administrator Tips & Tricks (Part 3): Storage (Storage Classes, PV, PVC, ConfigMaps & Secrets)"
meta_title: "OpenShift EX280 Tips – Storage Classes, PV, PVC, ConfigMaps & Secrets"
date: 2025-11-09
image: "/images/post7-dp-tips3.png"
description: "Continuing the EX280 – OpenShift Administrator Tips & Tricks mini-series with a deep dive into Storage Classes, Persistent Volumes, PVCs, ConfigMaps & Secrets."
categories: ["Certifications", "DevOps", "Red Hat", "OpenShift", "Administrator"]
tags: ["Red Hat", "OpenShift", "EX280", "Tips", "Storage", "PV", "PVC", "ConfigMaps", "Secrets"]
author: tharun-vempati
draft: false
---

Welcome to the third part of my **EX280 – OpenShift Administrator Tips & Tricks** mini-series!  
In this post, we’ll focus on **Storage Management** — one of the most practical and frequently tested areas in the EX280 exam. You’ll learn how to handle **Persistent Volumes (PV)**, **Persistent Volume Claims (PVC)**, **Storage Classes**, and configuration tools like **ConfigMaps** and **Secrets**.

---

## 🧱 Understanding Storage in OpenShift

Storage in OpenShift is the foundation for running stateful applications. You’ll often be asked to attach, configure, or manage persistent storage for pods in the exam.

Key concepts to master:

- **Persistent Volume (PV):** The actual piece of storage provisioned in the cluster.
- **Persistent Volume Claim (PVC):** A request made by a user to claim a PV.
- **StorageClass:** Defines how storage is dynamically provisioned.
- **ConfigMap & Secret:** Store configuration data and sensitive information securely.

---

🗂️ Important Note: PersistentVolumes vs PersistentVolumeClaims

Before anything else, remember this critical distinction:
PersistentVolume (PV) → Cluster-scoped resource (NOT namespaced)
PersistentVolumeClaim (PVC) → Namespaced resource

This often trips up candidates under exam pressure. When you create a PV, do not specify a namespace. When you work with PVCs, ensure you're in the correct project.

## 🗂️ Creating Persistent Volumes and Claims

In the exam, you might encounter a task like:  
> “Create a Persistent Volume and a Persistent Volume Claim that can be mounted by a deployment.”

Example manifest:

```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: my-pv
spec:
  capacity:
    storage: 1Gi
  accessModes:
    - ReadWriteOnce
  nfs:
    path: /tmp
    server: 172.17.0.2
  persistentVolumeReclaimPolicy: Retain
---
Two fields here are absolutely critical:
spec.nfs.path
spec.nfs.server

If either one is incorrect, your PVC will remain in a Pending state forever — which kills your exam time.

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: my-pvc
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: nfs-storage
  resources:
    requests:
      storage: 1Gi
```

After applying both, verify the binding status:

```bash
oc get pv,pvc
```

🔍 Where to find NFS path and server information?

The first instinct is to run:
```bash
oc describe storageclass nfs-storage
```

In some versions of OpenShift, you will see the NFS server/path information directly in the parameters field. But on newer clusters (and especially in EX280 environments), this information is not always visible.

This is by design — it tests your ability to locate configuration details using multiple approaches.

Here are the reliable methods:



✅ **Pro Tip:** Always ensure that the **storage size** and **access modes** match between PV and PVC — that’s the most common reason for unbound claims.

✅ Method 1: OpenShift Web Console → Storage → Storage Classes

Navigate to:

Storage → Storage Classes → nfs-storage

Look at the Description or Parameters section.

For many environments, this contains:
```bash
server: <IP>

path: <nfs-export>
```
This is usually the quickest way to confirm the correct details.

✅ Method 2: Inspect Existing PersistentVolumes

If storage information is unclear, check existing PVs:
```bash
oc get pv
oc describe pv <name>
```

Sometimes the environment variables or parameters will reveal the correct NFS configuration. For example:
```bash
NFS_SERVER=172.17.0.2
NFS_PATH=/exports/data
```

This is extremely valuable when clues are missing from the storage class itself.

✅ Method 3: Browse the Console → Persistent Volumes

Within the console, existing PV objects may display environment variables or annotations that hint at the path and server.

This view sometimes shows details that the CLI hides — especially in exam-provided lab clusters.

🧠 The Big Lesson: Always Look for Alternate Paths

One hallmark of the EX280 exam (and most Red Hat performance-based exams) is that there is never only one way to gather required information.

If a command does not show you what you expect, do not panic.

Instead:

Explore the Console UI

Inspect existing objects

Use oc describe on related resources

Look inside template definitions

Check logs or configuration maps if needed

This mindset dramatically reduces the chances of getting stuck.

✅ Exam-Proof Strategy for PV Tasks

Triple-check NFS path and server before creating the PV

Validate PV creation:
```bash
oc get pv my-pv
```

Bind it with a matching PVC:

storageClassName: nfs-storage


Ensure access modes match:

PV AccessMode = PVC AccessMode

Ensure capacity is equal or greater than the PVC request

Confirm the PV binds properly:
```bash
oc get pvc
```

If the PVC is still Pending, troubleshoot using:
```bash
oc describe pvc <name>
```

This output will tell you exactly what’s wrong (path mismatch, server unreachable, access mode mismatch, wrong SC, etc.).

---

## ⚙️ Using ConfigMaps and Secrets

Configuration management is another crucial skill for EX280. You’ll frequently need to inject configuration data or credentials into pods.

### Creating a ConfigMap

```bash
oc create configmap app-config --from-literal=APP_MODE=production
```

Mount it in a pod as an environment variable or a file:

```yaml
envFrom:
- configMapRef:
    name: app-config
```

### Creating a Secret

```bash
oc create secret generic db-secret --from-literal=DB_USER=admin --from-literal=DB_PASS=redhat123
```

Mount it securely in your deployment:

```yaml
envFrom:
- secretRef:
    name: db-secret
```

✅ **Pro Tip:** Secrets are base64-encoded, not encrypted — always limit who can view them using RBAC.

📌 Pro Tip: Use the CLI Help for Quick Examples

When you're in the middle of the exam and can’t recall the exact syntax, remember that the oc CLI help provides extremely useful examples that can save you time and prevent mistakes.

Use:
```bash
oc create secret --help
```

and
```bash
oc create configmap --help
```

You’ll see several practical examples right there in the help output.

Similarly, help pages for using these objects are often extremely useful:
```bash
oc explain configmap
oc explain secret
```

or even:
```bash
oc explain deployment.spec.template.spec.containers.envFrom
```

These commands show the structure, accepted fields, and usage patterns.
This becomes especially handy when you're working with YAML under time pressure.

✅ Tip for the EX280:
Treat the CLI help as your first reference before opening documentation. It is faster and directly relevant to the exact command you need.

---

## 📦 Attaching Storage to a Deployment

Finally, link your PVC to an application deployment:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: storage-demo
spec:
  replicas: 1
  selector:
    matchLabels:
      app: storage-demo
  template:
    metadata:
      labels:
        app: storage-demo
    spec:
      containers:
      - name: storage-container
        image: registry.redhat.io/ubi8/httpd-24
        volumeMounts:
        - mountPath: /var/www/html
          name: storage-volume
      volumes:
      - name: storage-volume
        persistentVolumeClaim:
          claimName: my-pvc
```
✅ **Pro Tip:** Use console to perform this task in much easier way and take it as a home work.

Test that your volume is working properly by writing data inside the pod and ensuring persistence after restarts.

---

## 🧠 Exam Strategy

- Practice creating **PV/PVC pairs** multiple times until you can do it from memory.  
- Understand the **relationship between PV, PVC, and StorageClass** — it’s a recurring pattern.  
- Always verify storage binding status before proceeding.  
- Remember: **ConfigMaps** for app settings, **Secrets** for sensitive data.

If you can complete a full storage configuration task (PV, PVC, mount, and validation) in **under 15 minutes**, you’re in excellent shape for the exam.

---

### Coming Up Next…
In **Part 4**, we’ll look at **Deployments and Reliability** — scaling applications, managing probes, and improving uptime.  
These topics directly reflect how well you can maintain a stable OpenShift environment under real-world conditions.

Stay tuned, and keep practicing — because repetition builds confidence! 🚀
