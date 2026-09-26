---
title: "La Guida Definitiva ai Comandi Rapidi di kubectl CLI: Supera il Tuo Esame CKA"
meta_title: "kubectl CLI Speed Cheat Sheet | Guida per Esami CKA e CKAD"
description: "Scorciatoie di terminale, comandi imperativi, trucchi per Ingress, Gateway API e JSONPath per massimizzare la velocità nel tuo esame CKA."
date: 2026-08-14
image: "/images/kubectl-speed-cheat-sheet.jpg"
categories: ["Kubernetes", "Certifications", "DevOps", "CKA"]
tags: ["kubectl", "CKA", "CKAD", "Kubernetes", "CLI", "CheatSheet", "DevOps"]
author: tharun-vempati
draft: false
---

Negli esami pratici basati sulle prestazioni come il **Certified Kubernetes Administrator (CKA)** e il **CKAD**, il principale collo di bottiglia non è la conoscenza teorica: **è la gestione del tempo**.

Scrivere manifest YAML da zero o sfogliare la documentazione ufficiale alla ricerca della sintassi durante la prova è il modo più rapido per perdere minuti preziosi.

I candidati con i punteggi più alti fanno affidamento sulla memoria muscolare, sui generatori di comandi imperativi, sul cambio rapido di namespace e su comandi one-liner collaudati per il troubleshooting.

Ecco un **Cheat Sheet pratico e senza fronzoli per la CLI di `kubectl`** da utilizzare durante la preparazione e nelle operazioni quotidiane sui cluster.

---

## 1. Configurazione Rapida della Shell

All'avvio della sessione di terminale, configura immediatamente queste scorciatoie essenziali:

```bash
# 1. Alias principale per kubectl
alias k=kubectl

# 2. Generatore rapido di manifest YAML
export do="--dry-run=client -o yaml"
```

> **Suggerimento:** Negli ambienti d'esame della Linux Foundation, il completamento automatico bash per `kubectl` è già abilitato per impostazione predefinita. L'alias `k` e la variabile `$do` ti daranno una velocità immediata.

---

## 2. Cambio Rapido di Namespace e Contesto

Evita di digitare `-n <namespace>` alla fine di ogni singolo comando. Se una domanda richiede molteplici operazioni nello stesso namespace, imposta subito il contesto corrente:

```bash
# Imposta il namespace predefinito per il contesto attivo
k config set-context --current --namespace=finance

# Verifica il contesto corrente e il namespace attivo
k config get-contexts
k config current-context
```

---

## 3. Generatori YAML Imperativi (Mai Scrivere YAML da Zero)

Genera sempre un manifest di base con `$do` (`--dry-run=client -o yaml`) e reindirizzalo su file o invialo in pipe a `kubectl apply`.

### 3.1. Pod
```bash
# Pod Nginx base
k run nginx-pod --image=nginx $do > pod.yaml

# Pod con comando e argomenti personalizzati
k run busybox-pod --image=busybox --restart=Never $do -- /bin/sh -c "sleep 3600" > pod.yaml

# Pod con label e porta del container esposta
k run web --image=httpd:alpine --port=80 --labels="tier=frontend,app=web" $do > web-pod.yaml
```

### 3.2. Deployment e Scalabilità
```bash
# Crea un Deployment con 3 repliche
k create deployment web-deploy --image=nginx:1.25 --replicas=3 $do > deploy.yaml

# Scala il deployment al volo
k scale deployment web-deploy --replicas=5

# Aggiorna l'immagine e controlla la cronologia del rollout
k set image deployment/web-deploy nginx=nginx:1.26
k rollout status deployment/web-deploy
k rollout undo deployment/web-deploy
```

### 3.3. Esposizione dei Service (ClusterIP, NodePort, LoadBalancer)
```bash
# Esponi un Deployment come ClusterIP (Porta 80 -> TargetPort 8080)
k expose deployment web-deploy --port=80 --target-port=8080 --name=web-service

# Esponi come NodePort esportando il manifest YAML
k expose deployment web-deploy --type=NodePort --port=80 --target-port=80 --name=web-np $do > svc-nodeport.yaml

# Creazione diretta del Service
k create service clusterip backend-svc --tcp=8080:8080 $do > svc.yaml
```

---

## 4. Ingress e Gateway API

### 4.1. Creazione Imperativa di Ingress
```bash
# Ingress base con regole di routing per host e percorso
k create ingress web-ingress   --rule="app.example.com/api*=backend-svc:8080"   --rule="app.example.com/*=web-service:80"   $do > ingress.yaml

# Ingress con backend predefinito
k create ingress simple-ingress   --default-backend=fallback-svc:8080   $do > ingress-default.yaml
```

### 4.2. Template YAML per Ingress (Host + TLS + Annotazioni)
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: secure-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  ingressClassName: nginx
  tls:
  - hosts:
      - secure.example.com
    secretName: tls-secret
  rules:
  - host: secure.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: web-service
            port:
              number: 80
```

### 4.3. Gateway API (Routing Moderno in Kubernetes)
```yaml
# 1. Definizione del Gateway
apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: prod-gateway
spec:
  gatewayClassName: eg-gateway-class
  listeners:
  - name: http
    protocol: HTTP
    port: 80
---
# 2. Definizione di HTTPRoute
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: api-route
spec:
  parentRefs:
  - name: prod-gateway
  rules:
  - matches:
    - path:
        type: PathPrefix
        value: /api
    backendRefs:
    - name: backend-svc
      port: 8080
```

---

## 5. ConfigMap, Secret e Variabili d'Ambiente

```bash
# ConfigMap da valori letterali
k create configmap app-config --from-literal=DB_HOST=10.0.0.5 --from-literal=DB_PORT=5432

# ConfigMap da un file di configurazione esistente
k create configmap nginx-conf --from-file=nginx.conf

# Secret da password letterale o file .env
k create secret generic db-secret --from-literal=password=SuperSecret123
k create secret generic app-secret --from-env-file=.env

# Inietta ConfigMap o Secret direttamente nelle variabili d'ambiente di un Deployment
k set env deployment/web-deploy --from=configmap/app-config
k set env deployment/web-deploy --from=secret/db-secret
```

---

## 6. Storage: PersistentVolume e PersistentVolumeClaim

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: data-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 2Gi
  storageClassName: standard
```

Montaggio all'interno di un Pod:
```yaml
spec:
  volumes:
  - name: storage-vol
    persistentVolumeClaim:
      claimName: data-pvc
  containers:
  - name: app
    image: nginx
    volumeMounts:
    - name: storage-vol
      mountPath: /var/data
```

---

## 7. Sicurezza, RBAC e ServiceAccount

```bash
# 1. Crea un ServiceAccount
k create serviceaccount app-sa

# 2. Crea un Ruolo con permessi specifici su determinate risorse
k create role pod-reader --verb=get,list,watch --resource=pods,pods/log

# 3. Associa il Ruolo al ServiceAccount nel namespace
k create rolebinding read-pods-binding --role=pod-reader --serviceaccount=default:app-sa

# 4. Permessi a livello di intero cluster (ClusterRole e ClusterRoleBinding)
k create clusterrole node-viewer --verb=get,list --resource=nodes
k create clusterrolebinding view-nodes-binding --clusterrole=node-viewer --serviceaccount=default:app-sa

# 5. Verifica dei permessi (Posso eseguire questa azione?)
k auth can-i create deployments --as=system:serviceaccount:default:app-sa
k auth can-i delete pods -n production
```

---

## 8. NetworkPolicy: Isolamento Rapido

Regola di Ingress Default Deny per blindare un namespace:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-ingress
spec:
  podSelector: {}
  policyTypes:
  - Ingress
```

Consenti il traffico solo da specifici pod di frontend sulla porta 80:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-frontend-to-backend
spec:
  podSelector:
    matchLabels:
      app: backend
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: frontend
    ports:
    - protocol: TCP
      port: 80
```

---

## 9. Troubleshooting, JSONPath e Diagnostica Avanzata

### 9.1. Query JSONPath ad Alta Efficienza
```bash
# Estrai gli IP interni di tutti i Worker Node
k get nodes -o jsonpath='{.items[*].status.addresses[?(@.type=="InternalIP")].address}'

# Mostra i nomi dei Pod e i rispettivi Nodi di esecuzione in colonne dedicate
k get pods -o custom-columns=POD:.metadata.name,NODE:.spec.nodeName,STATUS:.status.phase

# Decodifica il valore di un Secret senza passaggi manuali con base64
k get secret db-secret -o jsonpath='{.data.password}' | base64 -d
```

### 9.2. Debugging in Tempo Reale e Container di Diagnostica
```bash
# Avvia un container temporaneo di debug nella rete del cluster
k run net-debug --rm -i --tty --image=curlimages/curl -- /bin/sh

# Segui i log in streaming con timestamp e limite di righe
k logs -f deployment/web-deploy --tail=50 --timestamps

# Visualizza l'utilizzo delle risorse nei nodi e nei pod
k top nodes
k top pods -A --sort-by=cpu
k top pods -A --sort-by=memory

# Ispeziona gli eventi ordinati per data di creazione recente
k get events -A --sort-by='.metadata.creationTimestamp'
```

---

## Checklist Rapida per il Giorno dell'Esame

1. Configura subito `alias k=kubectl` e `export do="--dry-run=client -o yaml"`.
2. Imposta il namespace di contesto (`k config set-context --current --namespace=...`) se una domanda comprende passaggi multipli.
3. Genera sempre manifest con `$do > file.yaml` invece di copiare blocchi massicci dalla documentazione.
4. Verifica sempre i risultati finali con `k get <risorsa>` o testando gli endpoint con container effimeri.

Padroneggia questi one-liner durante le tue sessioni di laboratorio e completerai i compiti dell'esame CKA con ampio margine di tempo! 🎯
