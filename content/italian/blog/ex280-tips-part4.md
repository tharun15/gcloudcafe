---
title: "EX280 – Suggerimenti e Trucchi per l'Amministratore OpenShift (Parte 4): Deployment e Affidabilità"
meta_title: "Suggerimenti OpenShift EX280 – Deployment e Affidabilità"
date: 2025-11-09
image: "/images/post8-dp-tips4.png"
description: "Continua la mini-serie EX280 OpenShift Administrator Tips & Tricks con un approfondimento su Deployment, Scaling, Rollout e Probe di salute."
categories: ["Certifications", "DevOps", "Red Hat", "OpenShift", "Administrator"]
tags: ["Red Hat", "OpenShift", "EX280", "Tips", "Deployments", "Reliability", "Probes"]
author: tharun-vempati
series: "EX280 – Suggerimenti e Trucchi per l'Amministratore OpenShift"
series_order: 4
draft: false
---

Benvenuti alla quarta parte della mia mini-serie **EX280 – Suggerimenti e Trucchi per l'Amministratore OpenShift**!  
Questa volta ci concentreremo sul cuore della gestione applicativa in OpenShift: **Deployment e Affidabilità**. Questi argomenti si traducono direttamente in compiti d'esame e rispecchiano le responsabilità operative reali che ogni amministratore OpenShift deve padroneggiare in produzione.

---

## 🚀 Deployment: Il Motore del Rilascio Applicativo

I Deployment gestiscono le modalità con cui la tua applicazione containerizzata viene eseguita, aggiornata e scalata.  
Le aspettative nell'esame EX280 includono:

- Creare e modificare deployment
- Aggiornare immagini e strategie di rilascio
- Gestire rollout e rollback
- Scalare le applicazioni (sia manualmente sia automaticamente)

Vediamo le operazioni cardine:

### Aggiornare l'Immagine di un Deployment

```bash
oc set image deployment/myapp myapp=registry.redhat.io/ubi8/httpd-24
```

### Controllare lo Stato del Rollout

```bash
oc rollout status deployment/myapp
```

### Eseguire il Rollback a una Versione Precedente

```bash
oc rollout undo deployment/myapp
```

✅ **Suggerimento Pro:** Verifica sempre label e selettori — discrepanze tra pod template e selector causano comportamenti anomali durante il rollout.

---

## 📈 Scalabilità delle Applicazioni

La scalabilità è fondamentale per prestazioni e resilienza. L'esame richiede la padronanza di:

- **Scalabilità manuale**
- **Horizontal Pod Autoscaler (HPA)**

### Scalabilità manuale

```bash
oc scale deployment/myapp --replicas=3
```

### Autoscaling con HPA

```bash
oc autoscale deployment/myapp --min=1 --max=5 --cpu-percent=80
```

Verifica dell'HPA:

```bash
oc get hpa
```

✅ **Suggerimento Pro:** L'HPA richiede che le metriche del cluster (metrics-server / monitoring) siano operative. Negli ambienti d'esame è preconfigurato salvo diversa indicazione.

---

## ❤️‍🔥 Probe: Liveness, Readiness e Startup

Queste tre probe determinano l'affidabilità e l'alta disponibilità della tua applicazione in ambiente produttivo.

| Tipo di Probe | Scopo | Effetto sul Pod | Riavvia il Container? |
|---|---|---|---|
| **readinessProbe** | Determina se il pod è pronto a ricevere traffico | Rimuove temporaneamente il pod dagli endpoint del Service | ❌ No |
| **livenessProbe** | Rileva se il container è bloccato o non responsivo | Riavvia il container se la verifica fallisce | ✅ Sì |
| **startupProbe** | Utilizzata per carichi ad avvio lento; posticipa i controlli di liveness | Previene riavvii prematuri prima del completamento dell'avvio | ✅ Sì (se fallisce oltre la soglia) |

💡 I pattern YAML sono quasi identici per tutte le probe

Puoi implementare qualsiasi tipo di probe utilizzando tre metodologie:
- `httpGet` (chiamata HTTP su endpoint di salute, es. `/healthz`)
- `tcpSocket` (verifica dell'apertura di una porta TCP)
- `exec` (esecuzione di un comando all'interno del container con controllo dell'exit code)

### Esempio di Readiness Probe

```yaml
readinessProbe:
  httpGet:
    path: /healthz
    port: 8080
  initialDelaySeconds: 5
  periodSeconds: 10
```

### Esempio di Liveness Probe

```yaml
livenessProbe:
  httpGet:
    path: /live
    port: 8080
  initialDelaySeconds: 15
  periodSeconds: 20
```

### Esempio di Startup Probe

```yaml
startupProbe:
  httpGet:
    path: /startup
    port: 8080
  failureThreshold: 30
  periodSeconds: 10
```

---

## 🔐 Security Context Constraints (SCC)

Spesso è richiesto che i container vengano eseguiti con privilegi specifici o con un ServiceAccount dedicato.

### Creare un ServiceAccount

```bash
oc create sa custom-sa
```

### Assegnare un SCC al ServiceAccount

```bash
oc adm policy add-scc-to-user anyuid -z custom-sa
```

Quindi associa il ServiceAccount al deployment:

```yaml
spec:
  template:
    spec:
      serviceAccountName: custom-sa
```

✅ **Suggerimento per l'Esame:** Errori di permessi o configurazioni SCC errate impediscono l'avvio dei pod: ispeziona sempre con `oc describe pod <nome-pod>` in caso di `CrashLoopBackOff` o `CreateContainerConfigError`.

---

## 🧠 Strategia per l'Esame

- Esercitati a scrivere definizioni di probe in formato YAML rapidamente
- Riconosci immediatamente quando ricorrere all'HPA o allo scale manuale
- Padroneggia i comandi `oc rollout` (`status`, `undo`, `history`)
- Valida sempre lo stato finale dei pod con `oc get pods -w`

Se riesci a configurare probe, scalare carichi e risolvere blocchi di rollout in **meno di 15 minuti**, sei pronto per l'esame.

---

### Prossimamente…
Nella **Parte 5** concluderemo la mini-serie con il **Developer Self-Service**: quote, limiti, template di progetto e governo dell'autonomia per i team di sviluppo.
