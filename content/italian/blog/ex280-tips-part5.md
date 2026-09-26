---
title: "EX280 – Suggerimenti e Trucchi per l'Amministratore OpenShift (Parte 5): Developer Self Service"
meta_title: "Suggerimenti OpenShift EX280 – Developer Self Service"
date: 2025-11-09
image: "/images/post9-dp-tips5.png"
description: "Conclusione della mini-serie EX280 OpenShift Administrator Tips & Tricks con quote risorse, limit range e template di progetto personalizzati."
categories: ["Certifications", "DevOps", "Red Hat", "OpenShift", "Administrator"]
tags: ["Red Hat", "OpenShift", "EX280", "Tips", "SelfService", "Quotas", "Templates"]
author: tharun-vempati
series: "EX280 – Suggerimenti e Trucchi per l'Amministratore OpenShift"
series_order: 5
draft: false
---

Benvenuti alla quinta e ultima parte della mia mini-serie **EX280 – Suggerimenti e Trucchi per l'Amministratore OpenShift**!

In questo articolo esploreremo il **Developer Self-Service**: una delle capacità più potenti di OpenShift per standardizzare i progetti e concedere autonomia controllata ai team di sviluppo, sgravando gli amministratori da compiti ripetitivi. Per l'esame EX280, padroneggiare queste configurazioni ti consentirà di automatizzare l'onboarding di nuovi progetti in modo rapido e privo di errori.

---

## ✅ Su Cosa Focalizzarsi

L'esame richiede di comprendere e configurare con precisione tre aree principali:

---

### ◼ Quote Risorse (ResourceQuotas)

Le quote di risorse consentono di limitare il consumo complessivo di CPU, memoria e oggetti che un progetto o namespace può allocare.

Devi essere in grado di:
- Creare oggetti ResourceQuota
- Definire limiti complessivi per CPU e Memoria (`requests` e `limits`)
- Applicarli a specifici namespace

Esempio:

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

Applicazione:

```bash
oc apply -f compute-quota.yaml -n demo-app
```

---

### ◼ Limit Ranges (LimitRanges)

I LimitRange impongono valori predefiniti, minimi e massimi di consumo per singolo container o pod all'interno del progetto.

Esempio di manifest:

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

Applicazione:

```bash
oc apply -f limit-range.yaml -n demo-app
```

---

### ◼ Template di Progetto Personalizzati (Project Templates)

I template di progetto consentono di definire risorse predefinite, quote, limit range e ruoli RBAC che vengono iniettati automaticamente ogni volta che viene creato un nuovo progetto nel cluster.

🛠️ Flusso Completo: Creare e Applicare un Project Template in OpenShift

Questo è un classico esercizio avanzato dell'EX280: generare il template di bootstrap, personalizzarlo e istruire OpenShift a utilizzarlo come modello globale.

✅ Passo 1: Generare il Template di Base

Genera il template di bootstrap predefinito esportandolo in formato YAML:
```bash
oc adm create-bootstrap-project-template -o yaml > template.yaml
```

Questo file contiene l'intera struttura di base:
- Oggetti RBAC
- ServiceAccount predefiniti
- RoleBinding
- Oggetto Project

✅ Passo 2: Modificare il Template

Apri `template.yaml` e inserisci le risorse richieste dal task (come `LimitRange` o `ResourceQuota`) all'interno dell'elenco `objects:`.

Ad esempio, per includere un LimitRange esistente:
```bash
oc get limitrange limit-range -o yaml >> template.yaml
```
- Pulisci i metadati generati automaticamente (`uid`, `resourceVersion`, `creationTimestamp`).
- Assicurati che l'indentazione YAML sia corretta sotto la voce `objects:`.
- Sostituisci il nome e il namespace hardcoded con `${PROJECT_NAME}` affinché OpenShift popoli dinamicamente i valori per ciascun nuovo progetto creato.

✅ Passo 3: Creare (o Aggiornare) il Template nel Cluster

Applica il template nel namespace di configurazione globale del cluster (`openshift-config`):

```bash
oc create -f template.yaml -n openshift-config
```

Se il template esiste già:
```bash
oc replace -f template.yaml -n openshift-config
```

✅ Passo 4: Configurare il Cluster per Utilizzare il Nuovo Template

Modifica la risorsa di configurazione globale dei progetti:

```bash
oc edit project.config.openshift.io/cluster
```

Aggiungi la direttiva `projectRequestTemplate`:

```yaml
apiVersion: config.openshift.io/v1
kind: Project
metadata:
  name: cluster
spec:
  projectRequestTemplate:
    name: <nome_del_template>
```

Sostituisci `<nome_del_template>` con il nome specificato nei metadati del tuo template.

✅ Verifica del Funzionamento

Una volta completata questa impostazione:
Qualsiasi nuovo progetto creato tramite:
```bash
oc new-project test-progetto
```
o tramite la Console Web erediterà automaticamente le quote, i limit range e i binding definiti nel template.

---

## ⚡ Suggerimenti Strategici per l'Esame

### ✅ Suggerimento 1: Verifica Rapida dalla Console Web
La console web offre una visione chiara e sintetica delle quote residue e dei limit range associati a ciascun progetto.

### ✅ Suggerimento 2: Usa la Dry-Run per Validare i Template YAML
I template di progetto sono potenti ma sensibili agli errori di sintassi. Convalida sempre il file prima dell'applicazione effettiva:
```bash
oc create -f template.yaml --dry-run=client
```

---

## 🧠 Conclusioni

Le funzionalità di Developer Self-Service non sono complesse se affrontate con metodo e attenzione ai dettagli. Padroneggiando quote, limit range e template di progetto sarai in grado di superare con successo questa sezione dell'esame EX280.

Si conclude qui la nostra mini-serie in 5 parti. Buono studio e in bocca al lupo per la tua certificazione Red Hat OpenShift Administrator! 🔥
