---
title: "Rinnovare la Certificazione Google Cloud Professional Cloud Architect Senza Esame"
date: 2026-08-07
draft: false
image: "/images/gcp-pca-cert-renewal-blog-pic.png"
description: "La mia esperienza di rinnovo della certificazione Google Cloud Professional Cloud Architect tramite Continuing Education: Skill Badge Challenge Labs, Terraform, migrazione VM, GKE, Cloud Run e lezioni apprese."
categories: ["Google Cloud", "Certifications"]
tags: ["Google Cloud", "GCP", "Professional Cloud Architect", "Certification", "Terraform", "GKE", "Cloud Run", "Migrate to Virtual Machines"]
author: tharun-vempati
---

La mia certificazione **Google Cloud Professional Cloud Architect (PCA)** era in scadenza a dicembre 2026.

E, ad essere del tutto onesto, non vedevo l'ora di posticipare quel momento.

Non perché non ami Google Cloud, ma perché rinnovare una certificazione professionale di solito significa rientrare nella logorante **modalità preparazione esame**.

C'è una differenza sostanziale tra conoscere una tecnologia nell'operatività quotidiana e prepararsi specificamente per un esame a risposta multipla:
Per un esame devi abituarti ad analizzare scenari ipotetici, scovare indizi minimi nel testo delle domande, eliminare i distrattori, gestire il cronometro e riconfigurare la mente sul formato d'esame.

Inoltre, avevo sostenuto il mio esame PCA originale con **proctoring online da remoto**, e solo il pensiero di ripetere quell'intera trafila burocratica mi pesava.

Poi mi sono imbattuto in qualcosa di molto interessante.

Google Cloud offre attualmente un'opzione di **rinnovo tramite Continuing Education (Formazione Continua)** per certificazioni selezionate.

E la Professional Cloud Architect è tra queste.

La parte migliore?

👉 **Nessun esame teorico di certificazione**

👉 **Nessun costo d'esame aggiuntivo**

👉 **Completamento interamente basato su laboratori pratici (Skill Badge Challenge Labs)**

Invece di sostenere nuovamente il test di due ore, puoi rinnovare la certificazione completando specifiche attività pratiche su **Google Cloud Skills Boost**.

Ti viene concesso un arco temporale prestabilito prima della scadenza della certificazione per completare i requisiti. Se li completi con successo, la certificazione viene rinnovata per **altri due anni**, esattamente come se avessi superato di nuovo l'esame ufficiale.

Ho deciso di provarci.

E la scorsa settimana la mia certificazione **Google Cloud Professional Cloud Architect è stata rinnovata ufficialmente fino al 2028**.

Ecco come funziona il programma, cosa è richiesto concretamente, come sono strutturati i Challenge Lab e cosa ho imparato durante il percorso.

---

## Quindi, Cosa Bisogna Fare?

Il processo si articola principalmente in due fasi:

### 1. Assicurarsi che l'Email della Certificazione sia Sincronizzata

Il tuo account **Google Cloud Skills Boost** deve essere collegato allo stesso indirizzo email a cui è associato il tuo record di certificazione (solitamente il profilo certificato Webassessor / Google Cloud Certified).

È fondamentale che questo collegamento sia attivo affinché Google possa verificare automaticamente il completamento dei laboratori e applicare l'estensione di validità.

### 2. Completare le Attività di Apprendimento Richieste

Nel mio caso, il percorso di rinnovo richiedeva il completamento di due **Challenge Lab** specifici:

1. **Implement a Landing Zone and Observability in Google Cloud**
2. **Migrate Virtual Machines to Google Cloud**

Ed è qui che l'esperienza si fa interessante: non si tratta di normali laboratori guidati passo-passo.

---

## Laboratorio Standard vs Challenge Lab

Se hai già utilizzato Google Cloud Skills Boost (o Qwiklabs), conosci la struttura tipica:
Un laboratorio normale ti fornisce istruzioni dettagliate.
- Clicca qui
- Incolla questo comando
- Apri questa pagina della console
- Seleziona questa opzione

Se segui le istruzioni con attenzione, è quasi impossibile sbagliare.

**Un Challenge Lab è completamente diverso.**

In un Challenge Lab ricevi solo:
- Una descrizione dello scenario aziendale
- Un insieme di requisiti architetturali e nomi di risorse precisi
- Una serie di vincoli tecnici
- Un cronometro che scorre inesorabile
- E un pulsante: **Check My Progress**

Nessun comando da copiare e incollare. Nessuna guida passo-passo. Nessuno screenshot che ti indichi dove cliccare.

Devi sapere esattamente come implementare la soluzione in autonomia.

Se un requisito richiede di distribuire risorse tramite Terraform, devi scrivere o configurare il codice Terraform. Se richiede di migrare una macchina virtuale, containerizzarla ed esporla su GKE o Cloud Run, devi completare l'intera pipeline e assicurarti che l'endpoint risponda correttamente.

Ed è proprio questo l'aspetto che ho apprezzato di più:
**Dimostri le tue competenze applicandole direttamente sulla console e sulla CLI di Google Cloud, non rispondendo a quesiti a crocette.**

Analizziamo i due Challenge Lab nel dettaglio.

---

## Challenge 1: Implement a Landing Zone and Observability

Il primo challenge lab era incentrato sui fondamenti dell'architettura enterprise:
- Configurazione di una **Landing Zone**
- Struttura delle cartelle e gerarchia delle risorse
- Configurazione della rete VPC e regole firewall
- Monitoraggio, logging e creazione di metriche basate sui log
- Dashboard di Cloud Monitoring e criteri di avviso (Alerting Policies)

### La Mia Esperienza
La maggior parte delle attività di questo laboratorio prevedeva l'uso di **Terraform**.

Invece di creare le risorse a mano cliccando sulla console web di Google Cloud, lo scenario forniva repository con configurazioni Terraform parziali da completare, correggere e distribuire.

Questo riflette fedelmente il modo in cui lavoriamo quotidianamente: nessuno configura landing zone di produzione cliccando a mano nella console. L'approccio **Infrastructure as Code (IaC)** è lo standard de facto.

### Suggerimento: Conoscere le Basi di Terraform
Non è necessario essere uno sviluppatore core di provider Terraform, ma devi avere familiarità con:
- Comprendere la struttura dei moduli Terraform
- Navigare tra file `main.tf`, `variables.tf` e `outputs.tf`
- Eseguire con disinvoltura `terraform init`, `terraform plan` e `terraform apply`
- Diagnosticare e correggere errori comuni di sintassi o parametri mancanti

### Un Altro Piccolo Consiglio su Terraform
Prima di lanciare `terraform apply`, prenditi sempre un minuto per eseguire:

```bash
terraform fmt
terraform validate
```

Questo semplice passaggio intercetta errori banali prima che il piano di esecuzione fallisca a metà, facendoti risparmiare minuti preziosi sul timer del laboratorio.

---

## Challenge 2: Migrate Virtual Machines to Google Cloud

Se il primo challenge era orientato all'infrastruttura e all'osservabilità, il secondo era incentrato sulla modernizzazione dei carichi di lavoro:
**Migrate to Virtual Machines** e modernizzazione applicativa.

Il laboratorio si articolava in tre compiti principali:
- **Task 1:** Migrare una VM legacy on-premise su Google Compute Engine.
- **Task 2:** Containerizzare il carico di lavoro della VM ed eseguirlo su un cluster **Google Kubernetes Engine (GKE)**.
- **Task 3:** Distribuire il container risultante come servizio scalabile su **Cloud Run**.

Questo è un laboratorio denso, dove il tempo a disposizione può diventare un fattore critico.

### Task 1: Migrare la VM Legacy
In questo task utilizzi gli strumenti di migrazione di Google Cloud per replicare una macchina virtuale da un ambiente simulato verso Compute Engine.

La parte più complessa qui non è tecnica, ma psicologica: **abbi pazienza.**  
La replica del disco e la sincronizzazione iniziale richiedono diversi minuti. Non interrompere il processo e non riavviare i job se non vedi progressi immediati: lascia che la migrazione completi la fase di cutover.

### Task 2: Containerizzare la VM e Distribuire su GKE
È qui che la mia prima sessione ha rischiato di fallire.

L'attività prevede l'uso degli strumenti di modernizzazione per estrarre il carico di lavoro dalla VM migrata, produrre un'immagine container, archiviarla in Artifact Registry e distribuirla tramite manifest Kubernetes su GKE.

### Dove è Fallito il Mio Primo Tentativo
Nel primo tentativo, il mio controllo progressi continuava a fallire su un dettaglio apparentemente invisibile:
Avevo configurato il cluster GKE, containerizzato l'applicazione e distribuito il deployment. I pod erano nello stato `Running` e il servizio rispondeva.

Eppure, il pulsante **Check My Progress** restituiva errore.

Rileggendo con cura maniacale le istruzioni, ho scoperto l'inghippo:
Il testo richiedeva che il cluster GKE o il namespace avesse un'etichetta specifica e che il Service esponesse una determinata porta denominata esattamente come da specifica. Una minima divergenza nel nome del container impediva allo script di grading automatico di convalidare il punto.

> **Regola d'oro per i Challenge Lab:** Leggi ogni singolo requisito alla lettera. I validatori automatici cercano stringhe e nomi esatti. Anche se l'applicazione funziona, un nome risorsa difforme causa il fallimento della verifica.

### Secondo Tentativo
Ho avviato una seconda sessione del laboratorio, corretto la denominazione dei manifest Kubernetes fin dall'inizio e il controllo ha registrato 100/100 con largo anticipo.

### Task 3: Distribuire il Container su Cloud Run
Una volta creata l'immagine container in Artifact Registry, l'ultimo task consiste nel distribuirla come servizio serverless su **Cloud Run** con traffico pubblico abilitato e parametri di concorrenza configurati.

Rispetto alla migrazione della VM, questo passaggio è velocissimo:
```bash
gcloud run deploy app-service   --image=LOCATION-docker.pkg.dev/PROJECT/REPO/IMAGE:TAG   --platform=managed   --allow-unauthenticated   --region=REGION
```

Verifica l'URL generato da Cloud Run nel browser e premi l'ultimo *Check My Progress*.

---

## Cosa è Successo Dopo Aver Completato Entrambi i Lab?

Non appena ho completato il secondo Challenge Lab raggiungendo il 100% del punteggio:

1. **Badge su Skills Boost:** I due badge di completamento sono apparsi immediatamente sul mio profilo pubblico Google Cloud Skills Boost.
2. **Sincronizzazione Automatica:** Non è stato necessario aprire ticket di supporto o inviare moduli manuali.
3. **Email di Conferma:** Nel giro di un paio di giorni lavorativi ho ricevuto l'email ufficiale da Google Cloud Certified che confermava il completamento dei requisiti di Continuing Education.
4. **Aggiornamento CertMetrics / Accredible:** La data di scadenza della mia certificazione **Professional Cloud Architect** è stata aggiornata ufficialmente fino al **2028**.

---

## Rinnovo Tradizionale con Esame vs Continuing Education

| Aspetto | Esame di Certificazione Tradizionale | Rinnovo con Continuing Education |
|---|---|---|
| **Formato** | 50–60 domande a risposta multipla | Laboratori pratici hands-on (Challenge Labs) |
| **Costo** | $200 USD (o voucher di sconto) | **Gratuito** (incluso con Skills Boost) |
| **Ambiente** | Test center fisico o proctoring remoto rigoroso | Il tuo browser, con accesso reale alla console GCP |
| **Competenze Valutate** | Teoria, memoria, interpretazione di scenari | Implementazione reale, CLI, Terraform, Troubleshooting |
| **Validità Rinnovo** | 2 anni | 2 anni |

---

## I Vantaggi che Ho Riscontrato

1. **Pratica Reale al Posto dei Quiz:** Invece di memorizzare elenchi di feature, usi Terraform, debugghi pod su Kubernetes e migri macchine reali.
2. **Nessuna Ansia da Proctoring:** Nessuna preoccupazione per la fotocamera esterna, il movimento degli occhi o la connessione che cade durante il test.
3. **Aggiornamento sulle Tecnologie Più Recenti:** I laboratori riflettono gli strumenti attuali di Google Cloud, come Artifact Registry, Cloud Run e i moduli moderni di Migrate to Virtual Machines.

---

## Riflessioni Finali

Se la tua certificazione **Google Cloud Professional Cloud Architect** è in scadenza, controlla la tua casella di posta per verificare se hai ricevuto l'invito al programma di **Continuing Education**.

È un'iniziativa eccellente da parte di Google Cloud: valorizza le competenze operative reali degli ingegneri del cloud e premia la formazione pratica continua.

Per me è stata un'esperienza di rinnovo molto più gratificante rispetto alla ripetizione dell'esame teorico — e ora la certificazione è al sicuro fino al 2028! ☁️🎓
