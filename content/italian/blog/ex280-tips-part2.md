---
title: "EX280 – Suggerimenti e Trucchi per l'Amministratore OpenShift (Parte 2): Network Policies e Edge Routes"
meta_title: "Suggerimenti OpenShift EX280 – Network Policies e Edge Routes"
date: 2025-11-09
image: "/images/post6-dp-tips2.png"
description: "Continua la mini-serie EX280 OpenShift Administrator Tips & Tricks con un approfondimento su Network Policies e Edge Routes."
categories: ["Certifications", "DevOps", "Red Hat", "OpenShift", "Administrator"]
tags: ["Red Hat", "OpenShift", "EX280", "Tips", "NetworkPolicy", "EdgeRoutes", "Security"]
author: tharun-vempati
series: "EX280 – Suggerimenti e Trucchi per l'Amministratore OpenShift"
series_order: 2
draft: false
---

Benvenuti alla seconda parte della mia mini-serie **EX280 – Suggerimenti e Trucchi per l'Amministratore OpenShift**!  
In questo articolo esploreremo le **Network Policies** e le **Edge Routes**: due obiettivi d'esame fondamentali che spesso disorientano i candidati alla prima prova. Padroneggiarli non solo aumenta sensibilmente le tue probabilità di successo nell'EX280, ma getta basi solide per operare come amministratore OpenShift orientato alla sicurezza.

---

## 🧩 Perché le Network Policies Sono Fondamentali

Le Network Policies in OpenShift (e Kubernetes) definiscono le modalità di comunicazione tra i pod e con il mondo esterno.  
Per impostazione predefinita, i pod possono comunicare liberamente con qualsiasi altro pod all'interno dello stesso cluster — uno scenario inaccettabile per gli standard di sicurezza in ambienti di produzione.  

**Il tuo obiettivo nell'esame:**  
Devi essere in grado di creare, testare e applicare una **NetworkPolicy** che limiti il traffico tra specifici namespace o gruppi di pod selezionati.

---

### Esempio: Limitare il Traffico tra Namespace

Ecco un classico task in stile esame che potresti incontrare:

> “Consenti esclusivamente ai pod con etichetta `app=frontend` nel namespace `dev` di comunicare con i pod etichettati `app=backend` nel namespace `prod`.”

Puoi ottenere questo risultato applicando il seguente manifest:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-frontend-to-backend
  namespace: prod
spec:
  podSelector:
    matchLabels:
      app: backend
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          kubernetes.io/metadata.name: dev
      podSelector:
        matchLabels:
          app: frontend
  policyTypes:
  - Ingress
```

✅ **Suggerimento Pro:**  
Verifica sempre con estrema attenzione le tue **labels** e i tuoi **namespace** — l'80% dei problemi con le NetworkPolicy deriva da selettori errati.

---

## 🌐 Comprendere le Route Edge, Passthrough e Re-encrypt

Le Route in OpenShift espongono le tue applicazioni all'esterno del cluster.  
L'esame EX280 si concentra principalmente sulla capacità di **creare route sicure** e comprendere i **diversi tipi di terminazione TLS**.

### Le Tre Tipologie di Route da Conoscere

| Tipo | Descrizione | Terminazione TLS |
|------|--------------|----------------|
| **Edge** | Il TLS termina sul router. Il router (Ingress Controller) decifra il traffico prima di inoltrarlo al pod di backend, che riceve traffico HTTP non crittografato. | ✅ Sì |
| **Passthrough** | Il TLS termina direttamente sul pod, garantendo la crittografia end-to-end senza decifrazione intermedia sul router. | 🚫 No |
| **Re-encrypt** | Il TLS termina sul router con un certificato esterno, viene decifrato, e poi re-crittografato con un certificato differente prima di raggiungere il pod. | ✅ Sì (doppia) |

---

## 🔐 Edge Routes — La Sottile Sfida da Sysadmin nell'Esame

Creare una route con terminazione edge in OpenShift è immediato quando tutti i file sono pronti. Durante l'esame EX280, tuttavia, gli scenari sono strutturati appositamente per verificare la tua prontezza nel troubleshooting tipico di un sistemista Linux.

Spesso le istruzioni recitano:

> “Usa lo script fornito `create-certs.sh` per generare i certificati richiesti per una route edge.”

Sembra banale, vero?  
Ma ecco la trappola:

- Il nome dello script viene fornito ✅  
- **Il percorso completo del file NON viene specificato** ❌  

Questo è intenzionale. Mette alla prova la tua abilità nel localizzare file nel filesystem Linux — una competenza quotidiana essenziale per chi amministra OpenShift in produzione.

---

## 🕵️ Cercare lo Script per i Certificati

Lo script può risiedere in qualunque punto del filesystem della workstation. Cercare manualmente cartella per cartella è inefficiente e fa perdere minuti preziosi.

Qui entrano in gioco le tue competenze da **sysadmin Linux**.

Usa il comando `find`:

```bash
find / -type f -name "create-certs.sh" 2>/dev/null
```

Se durante la tensione dell'esame ricordi solo una parte del nome:

```bash
find / -type f | grep cert
```

✅ L'aggiunta di `2>/dev/null` sopprime gli errori di permessi negati mantenendo l'output pulito e leggibile.

Una volta individuato lo script:
📁 Copialo nella tua home directory:
```bash
cd /path/to/script
cp create-certs.sh ~/
cd ~/
```

Assicurati che abbia i permessi di esecuzione:
```bash
chmod +x create-certs.sh
```

Ed eseguilo:
```bash
./create-certs.sh
```

Lo script generalmente genera:
- `tls.crt`
- `tls.key`
- talvolta `ca.crt`

Questi file sono indispensabili per la configurazione della route edge.

🚀 Creare la Route Edge con i Certificati
Una volta posizionati i certificati nella tua directory di lavoro, esegui:

```bash
oc create route edge secure-app   --service=myapp   --cert=tls.crt   --key=tls.key
```

Se lo script genera anche il certificato della CA e viene richiesto esplicitamente dal task:
```bash
--ca-cert=ca.crt
```

Assicurati di referenziare il nome corretto del Service.

✅ **Suggerimento Pro:**  
Puoi verificare la configurazione TLS della route creata con:
```bash
oc get route secure-app -o yaml | grep -A 5 tls
```

🧠 Perché Questo Procedimento è Importante

Questo flusso d'esame valuta ben più della mera sintassi OpenShift:
- Navigare nel filesystem Linux
- Utilizzare efficacemente `find` e `grep`
- Comprendere i permessi Unix (`chmod`)
- Eseguire script Bash
- Generare e applicare certificati TLS

Sono esattamente le competenze pratiche richieste quotidianamente in azienda — e l'esame richiede di eseguirle con sicurezza e rapidità.

---

## 🧠 Strategia per l'Esame

- Esercitati a **creare ed eliminare route** sia da CLI che dalla console web.  
- Impara a identificare immediatamente quale **tipo di route** utilizzare in base allo scenario descritto.  
- Ispeziona lo stato e gli endpoint della route con:
  ```bash
  oc describe route <nome-route>
  ```
- Mantieni sempre **coerenti le label di namespace e pod** quando scrivi NetworkPolicy.
- Esercitati a trovare file e script sotto pressione con `find` e `grep`.

Se riesci a configurare una route Edge sicura e applicare una NetworkPolicy valida in **meno di 10 minuti**, sei sulla buona strada per ottenere un punteggio eccellente in questa sezione.

---

## ⏱️ Il Mio Consiglio

Dedica almeno **30 minuti** al ripasso della sintassi delle NetworkPolicy prima dell'esame.  
Esercitati nei laboratori Red Hat DO280: sono ideali per consolidare questi concetti.  

Più comprendi a fondo *il motivo* per cui una policy ammette o blocca il traffico, più sarai sereno durante la prova.

---

### Prossimamente…
Nella **Parte 3** affronteremo una delle aree più pratiche dell'esame: **Storage, ConfigMap e Secret** — il cuore delle applicazioni con stato e configurabili su OpenShift.

Continua a seguirci 🚀  
E come sempre: prova, rompi e ricostruisci: è il modo migliore per dominare OpenShift.
