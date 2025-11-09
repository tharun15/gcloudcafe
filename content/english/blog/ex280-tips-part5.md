---
title: "EX280 – OpenShift Administrator Tips & Tricks (Part 5): Developer Self Service"
meta_title: "OpenShift EX280 Tips – Developer Self Service"
date: 2025-11-9
image: "/images/post9-dp-tips5.png"
description: "Kickstarting the EX280 – OpenShift Administrator Tips & Tricks mini-series with a deep dive into Developer Self Service."
categories: ["Certifications", "DevOps", "Red Hat", "OpenShift", "Administrator"]
tags: ["Red Hat", "OpenShift", "EX280", "Tips", "HTPasswd", "Authentication"]
author: tharun-vempati
draft: true
---

Welcome to the fifth part of my **EX280 – OpenShift Administrator Tips & Tricks** mini-series!

In this article, we'll explore **Developer Self-Service**—one of the most dynamic and admin-enabling capabilities in OpenShift. It’s designed to reduce operational overhead and improve developer productivity by giving developers controlled autonomy. For the EX280 exam, mastering these features helps you quickly configure projects in a standardized manner.

---

## ✅ What You Need to Focus On

The exam expects you to understand and configure the following:

### ◼ Project Templates
Project templates allow you to enforce default resources, quotas, limit ranges, and initial objects whenever a new project is created.

You might be asked to:

- Locate an existing template
- Modify a template
- Apply a template to create projects

Example:

```bash
oc get templates -n openshift-config
oc new-project demo-app --template=my-template
```

---

### ◼ Quotas

Resource quotas allow you to control the total amount of resources a project can consume.

You should know how to:

- Create quota objects
- Add CPU/Memory limits
- Apply to specific namespaces

Example:

```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: compute-quota
spec:
  hard:
    requests.cpu: "2"
    limits.cpu: "4"
    requests.memory: 1Gi
    limits.memory: 2Gi
```

Apply it:

```bash
oc apply -f compute-quota.yaml -n demo-app
```

---

### ◼ Limit Ranges

Limit ranges enforce default and maximum resource allocations per container or pod.

You should be comfortable writing:

```yaml
apiVersion: v1
kind: LimitRange
metadata:
  name: limit-range
spec:
  limits:
    - type: Container
      default:
        cpu: "200m"
        memory: "256Mi"
      defaultRequest:
        cpu: "100m"
        memory: "128Mi"
```

Apply it:

```bash
oc apply -f limit-range.yaml -n demo-app
```

---

## ⚡ Exam Strategy Tips

### ✅ Tip 1: Use the Web Console quickly

The console gives visual clarity on resource quotas and limit ranges.

Just don’t spend too much time browsing—stick to task execution.

---

### ✅ Tip 2: Practice JSON patching

Some configurations require **patching** instead of rewriting full objects:

```bash
oc patch project demo-app --patch '{"metadata": {"annotations": {"openshift.io/requester": "admin"}}}'
```

---

### ✅ Tip 3: Project templates are tricky—double check!

Project templates are powerful but easy to break.

**Validate your YAML** before applying:

```bash
oc create -f template.yaml --dry-run=client
```

---

## 🧠 Final Thoughts

Developer Self-Service topics are not difficult, but they require a methodical approach and attention to detail.

If you can:

- Define quotas
- Set limits
- Apply templates
- Validate project configurations

…you’ll clear this portion of the exam efficiently.

This concludes **Part 5** of the series. You're now equipped to handle Developer Self-Service confidently in the EX280 exam environment.🔥
