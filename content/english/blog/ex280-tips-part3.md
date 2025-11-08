---
title: "EX280 – OpenShift Administrator Tips & Tricks (Part 3): Storage (Storage Classes, PV, PVC, ConfigMaps & Secrets)"
meta_title: "OpenShift EX280 Tips – Storage Classes, PV, PVC, ConfigMaps & Secrets"
date: 2025-11-10
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
  hostPath:
    path: /mnt/data
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: my-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 1Gi
```

After applying both, verify the binding status:

```bash
oc get pv,pvc
```

✅ **Pro Tip:** Always ensure that the **storage size** and **access modes** match between PV and PVC — that’s the most common reason for unbound claims.

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
