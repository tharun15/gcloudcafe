---
title: "EX280 – OpenShift Administrator Tips & Tricks (Part 5): Developer Self Service"
meta_title: "OpenShift EX280 Tips – Developer Self Service"
date: 2025-11-09
image: "/images/post9-dp-tips5.png"
description: "Kickstarting the EX280 – OpenShift Administrator Tips & Tricks mini-series with a deep dive into Developer Self Service."
categories: ["Certifications", "DevOps", "Red Hat", "OpenShift", "Administrator"]
tags: ["Red Hat", "OpenShift", "EX280", "Tips", "HTPasswd", "Authentication"]
author: tharun-vempati
draft: false
---

Welcome to the fifth part of my **EX280 – OpenShift Administrator Tips & Tricks** mini-series!

In this article, we'll explore **Developer Self-Service**—one of the most dynamic and admin-enabling capabilities in OpenShift. It’s designed to reduce operational overhead and improve developer productivity by giving developers controlled autonomy. For the EX280 exam, mastering these features helps you quickly configure projects in a standardized manner.

---

## ✅ What You Need to Focus On

The exam expects you to understand and configure the following:

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


### ◼ Project Templates
Project templates allow you to enforce default resources, quotas, limit ranges, and initial objects whenever a new project is created.

You might be asked to:

- Locate an existing template
- Modify a template
- Apply a template to create projects

Example:

```bash
oc get templates -n openshift-config
```
🛠️ Complete Workflow: Creating and Applying a Project Template in OpenShift

When configuring Developer Self-Service for the EX280 exam, a common task is to generate a project template, customize it, and then configure OpenShift to use that template for all new project requests. Here are the exact commands and sequence that you should know cold.

✅ Step 1: Generate the Base Project Template

Begin by exporting the default bootstrap project template:
```bash
oc adm create-bootstrap-project-template -o yaml > template.yaml
```

This generates a full YAML definition including:

RBAC objects

ServiceAccount

RoleBinding

Project object

(and more)

This template.yaml will be your base for customization.

✅ Step 2: Edit the Generated Template

Now open template.yaml and add or modify the objects you need, such as:

LimitRange

ResourceQuota

Additional labels or annotations

Custom parameters

Example: Lets take an example to include limit range in the project template

```bash
oc get limitrange limit-range >> template.yaml
```

- Open the template.yaml with vi editor in view mode (:v)
- Select the limitrange section at the end of the file and cut it by pressing the key - d and move it directly under Rolebindings section. This is also where you would paste your cleaned-up LimitRange object under objects:
- Remove these fields - uuid, creationTimestamp, resourceVersion
- If you find any indentation issue s withinin the limitrange section fix it by executing 
```bash
2>>
```
- Replace name and namespace of the template by ${PROJECT_NAME} or as per the information given in the task
- Remove any extra lines left over at the end of the yaml



✅ Step 3: Create (or Replace) the Template in OpenShift

Once your edits are complete, apply the template:
```bash
oc create -f template.yaml -n openshift-config
```

If you’re updating an existing template, you may need:
```bash
oc replace -f template.yaml -n openshift-config
```

The namespace must be openshift-config — that’s where OpenShift stores cluster-wide config templates.

✅ Step 4: Configure OpenShift to Use Your Template

Next, configure the cluster to reference your new template for all future project requests.

Edit the cluster-wide project configuration:
```bash
oc edit project.config.openshift.io/cluster
```

This opens the YAML in your default editor.

Add/edit the following section:
```bash
apiVersion: config.openshift.io/v1
kind: Project
metadata:
  name: cluster
spec:
  projectRequestTemplate:
    name: <template_name>
```

Replace <template_name> with the name defined in your template’s metadata.

✅ How This Works

After this configuration:

Any new project created via:
```bash
oc new-project <name>
```

or via the Web Console

…will automatically include every object defined in your project template:

LimitRange

ResourceQuota

RoleBindings

ServiceAccounts

Labels

Annotations



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
