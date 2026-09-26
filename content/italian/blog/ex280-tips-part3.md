---
title: "EX280 – Suggerimenti e Trucchi per l'Amministratore OpenShift (Parte 3): Storage (Storage Classes, PV, PVC, ConfigMap e Secret)"
meta_title: "Suggerimenti OpenShift EX280 – Storage Classes, PV, PVC, ConfigMap e Secret"
date: 2025-11-09
image: "/images/post7-dp-tips3.png"
description: "Continua la mini-serie EX280 OpenShift Administrator Tips & Tricks con un approfondimento su Storage Class, Persistent Volume, PVC, ConfigMap e Secret."
categories: ["Certifications", "DevOps", "Red Hat", "OpenShift", "Administrator"]
tags: ["Red Hat", "OpenShift", "EX280", "Tips", "Storage", "PV", "PVC", "ConfigMaps", "Secrets"]
author: tharun-vempati
series: "EX280 – Suggerimenti e Trucchi per l'Amministratore OpenShift"
series_order: 3
draft: false
---

Benvenuti alla terza parte della mia mini-serie **EX280 – Suggerimenti e Trucchi per l'Amministratore OpenShift**!  
In questo articolo ci concentreremo sulla **Gestione dello Storage** — una delle aree più pratiche e testate con maggiore frequenza nell'esame EX280. Imparerai come gestire **Persistent Volume (PV)**, **Persistent Volume Claim (PVC)**, **Storage Class**, oltre a strumenti di configurazione essenziali come **ConfigMap** e **Secret**.

---

## 🧱 Comprendere lo Storage in OpenShift

Lo storage in OpenShift è il pilastro fondamentale per l'esecuzione di carichi di lavoro stateful. Nell'esame ti verrà spesso chiesto di collegare, configurare o gestire volumi persistenti per i pod applicativi.

Concetti chiave da padroneggiare:

- **Persistent Volume (PV):** La porzione effettiva di storage allocata nel cluster a livello di infrastruttura.
- **Persistent Volume Claim (PVC):** La richiesta effettuata da un utente o un'applicazione per reclamare un PV.
- **StorageClass:** Definisce le modalità di provisioning dinamico dello storage.
- **ConfigMap e Secret:** Consentono di iniettare dati di configurazione e informazioni sensibili nei container in modo sicuro e disaccoppiato.

---

🗂️ Nota Fondamentale: PersistentVolume vs PersistentVolumeClaim

Prima di ogni altra cosa, tieni a mente questa distinzione cruciale:
- **PersistentVolume (PV)** → Risorsa di livello Cluster (NON appartiene a un namespace specifico)
- **PersistentVolumeClaim (PVC)** → Risorsa con ambito Namespace

Questa differenza genera frequenti errori sotto la pressione dell'esame. Quando crei un PV, non specificare un namespace. Quando crei o monti una PVC, assicurati di trovarti nel progetto corretto.

## 🗂️ Creare Persistent Volume e Claim

Nell'esame potresti incontrare una consegna del tipo:  
> “Crea un Persistent Volume e un Persistent Volume Claim che possano essere montati da un deployment applicativo.”

Esempio di manifest:

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
```

Due campi qui sono assolutamente critici:
- `spec.nfs.path`
- `spec.nfs.server`

Se uno dei due è errato, la tua PVC rimarrà nello stato `Pending` all'infinito, consumando tempo prezioso.

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

Dopo aver applicato entrambi i manifest, verifica lo stato del binding:

```bash
oc get pv,pvc
```

🔍 Dove trovare le informazioni su percorso NFS e server?

Il primo istinto è eseguire:
```bash
oc describe storageclass nfs-storage
```

In alcune versioni di OpenShift, vedrai le informazioni sul server/percorso NFS direttamente nel campo dei parametri. Ma sui cluster più recenti (e specialmente negli ambienti dell'esame EX280), queste informazioni non sono sempre mostrate esplicitamente da CLI.

Questo fa parte della valutazione: testa la tua capacità di individuare i dettagli di configurazione attraverso metodi alternativi.

Ecco i metodi affidabili:

✅ **Suggerimento Pro:** Assicurati sempre che la **dimensione dello storage** e le **modalità di accesso (access modes)** coincidano tra PV e PVC — sono il motivo più comune per cui una claim non si aggancia (`Unbound`).

✅ Metodo 1: Console Web OpenShift → Storage → Storage Classes

Naviga su:
`Storage → Storage Classes → nfs-storage`

Esamina la sezione Description o Parameters. In molti ambienti, troverai:
```bash
server: <IP>
path: <nfs-export>
```
Questo è solitamente il modo più rapido per confermare i parametri corretti.

✅ Metodo 2: Ispezionare PersistentVolume preesistenti

Se le informazioni sono ambigue, controlla i PV già presenti nel cluster:
```bash
oc get pv
oc describe pv <nome-pv>
```

Spesso le variabili d'ambiente o le annotazioni mostreranno la configurazione NFS corretta. Ad esempio:
```bash
NFS_SERVER=172.17.0.2
NFS_PATH=/exports/data
```

✅ Metodo 3: Navigare nella Console Web → Persistent Volumes

All'interno della console, gli oggetti PV esistenti possono mostrare annotazioni ed esportazioni NFS non visibili immediatamente dalla riga di comando.

🧠 La Grande Lezione: Cerca Sempre Vie Alternative

Una caratteristica distintiva dell'esame EX280 (e della maggior parte delle certificazioni pratiche Red Hat) è che non esiste un solo modo per reperire le informazioni richieste.

Se un comando non mostra ciò che ti aspetti, non farti prendere dal panico:
- Esplora la Console Web
- Ispeziona risorse correlate già attive nel cluster
- Usa `oc describe` sugli oggetti collegati
- Controlla mappe di configurazione o template esistenti

Questo approccio mentale riduce drasticamente il rischio di bloccarsi.

---

## ⚙️ Utilizzo di ConfigMap e Secret

La gestione della configurazione è un'altra competenza chiave dell'EX280. Ti verrà richiesto di iniettare parametri applicativi o credenziali all'interno dei pod.

### Creare una ConfigMap

```bash
oc create configmap app-config --from-literal=APP_MODE=production
```

Montala in un pod come variabile d'ambiente o file:

```yaml
envFrom:
- configMapRef:
    name: app-config
```

### Creare un Secret

```bash
oc create secret generic db-secret --from-literal=DB_USER=admin --from-literal=DB_PASS=redhat123
```

Montalo in modo sicuro nel tuo deployment:

```yaml
envFrom:
- secretRef:
    name: db-secret
```

✅ **Suggerimento Pro:** I Secret in Kubernetes/OpenShift sono codificati in base64, non cifrati a riposo per impostazione predefinita — limita sempre chi può leggerli tramite policy RBAC.

📌 Suggerimento Pro: Usa l'Help della CLI per Esempi Immediati

Quando sei nel vivo dell'esame e non ricordi la sintassi precisa, ricorda che l'help della CLI `oc` offre esempi pratici e funzionanti:

```bash
oc create secret generic --help
oc create configmap --help
```

Troverai template pronti all'uso direttamente nell'output del terminale.

Allo stesso modo, usa `explain` per navigare i campi YAML complessi:
```bash
oc explain pod.spec.containers.envFrom
```

---

## 📦 Collegare lo Storage a un Deployment

Infine, collega la tua PVC al deployment applicativo:

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

Verifica il corretto funzionamento del volume scrivendo dati all'interno del container ed effettuando il riavvio del pod per testare la persistenza effettiva.

---

## 🧠 Strategia per l'Esame

- Esercitati a creare **coppie PV/PVC** finché non sarai in grado di farlo a memoria.  
- Comprendi a fondo la **relazione tra PV, PVC e StorageClass**.  
- Verifica sempre lo stato `Bound` dello storage prima di passare all'esercizio successivo.  
- Ricorda: **ConfigMap** per parametri applicativi in chiaro, **Secret** per credenziali e chiavi.

Se riesci a completare un task di storage completo (PV, PVC, mount e verifica) in **meno di 15 minuti**, sei in ottima forma per l'esame.

---

### Prossimamente…
Nella **Parte 4** esploreremo **Deployments e Reliability**: scalare le applicazioni, gestire le probe di salute e massimizzare l'uptime.

Rimani sintonizzato e continua a esercitarti! 🚀
