---
title: "TLS per Ingegneri DevOps (Parte 1): Chiavi, CSR, CA e la Catena di Fiducia Spiegate Semplici"
meta_title: "TLS per DevOps (Parte 1): Chiavi, CSR, CA e Catena di Trust"
description: "Padroneggia i fondamenti di TLS moderno per DevOps e Kubernetes: il modello a cartolina di Internet, lucchetti di Alice e Bob, pipeline da chiave a certificato, 5 falsi miti e lab OpenSSL."
date: 2026-08-14
image: "/images/tls-part1-foundations.jpg"
categories: ["Security", "DevOps", "Architecture", "TLS"]
tags: ["TLS", "SSL", "Cryptography", "Certificates", "OpenSSL", "DevOps", "Security"]
author: tharun-vempati
series: "TLS & mTLS Architecture for DevOps Engineers"
series_order: 1
series_image: "/images/series-images/tls-series-poster.jpg"
series_description: "Padroneggia l'architettura TLS e mTLS moderna per DevOps e Kubernetes: generazione chiavi, CSR, catene di fiducia PKI, handshake 1-RTT vs 0-RTT, cipher suite, Java Keystore e ripristino da incidenti di produzione."
featured: false
draft: false
---

Quando inserisci una password, invii i dati di una carta di credito o distribuisci una route di ingress in produzione, come fai a sapere che qualcuno non stia intercettando silenziosamente ogni singolo byte trasmesso?

Guarda in alto nella barra del browser: proprio accanto all'URL compare l'icona di un lucchetto. Cliccandoci sopra, il browser mostra un messaggio rassicurante: *"La connessione è protetta"*.

Facciamo affidamento su quel piccolo lucchetto decine di volte al giorno. Ma cosa succede davvero dietro le quinte? Perché una rete aperta come Internet è per sua natura così vulnerabile all'intercettazione, e in che modo il browser certifica che stai comunicando con il server legittimo e non con un impostore?

Benvenuto nella **Parte 1 della nostra Guida Approfondita in 3 Parti sull'Architettura TLS e mTLS per Ingegneri DevOps**:

---

## 1. Perché Esiste TLS: La Rete come una Cartolina Postale

Immagina di spedire una lettera con il servizio postale tradizionale. Se scrivi il messaggio su un foglio, lo sigilli in una busta opaca e lo imbuchi, solo il destinatario con il suo tagliacarte potrà leggerlo.

Ma prima dell'avvento della crittografia diffusa, inviare dati su Internet (tramite HTTP in chiaro, FTP o Telnet non cifrato) era esattamente come **inviare una cartolina postale non sigillata**.

```
    [Il Tuo Browser] ───( Pacchetto HTTP in chiaro )───▶ [Router Wi-Fi] ───▶ [ISP / Transit] ───▶ [Server]
                               ▲                                  ▲
                               │ Intercettazione                  │ Sniffing cavi / BGP hijack
                        [Attaccante su Wi-Fi]              [Attore malevolo / Proxy]
```

Ogni router, switch, proxy e provider di telecomunicazioni tra il tuo laptop e il server di destinazione poteva leggere chiaramente il testo: password, cookie di sessione, token API e dati personali.

### Le Tre Sfide Fondamentali di Sicurezza

Per trasformare una cartolina esposta in una cassaforte blindata, qualsiasi protocollo di sicurezza di rete moderno deve risolvere contemporaneamente tre problemi cardine:

1. **Riservatezza (Confidentiality):** Nessuna terza parte deve poter decifrare i dati in transito.
2. **Integrità (Integrity):** Nessuno deve poter manomettere o alterare i dati senza che le parti se ne accorgano istantaneamente.
3. **Autenticazione (Authentication):** Devi avere la certezza matematica di parlare con il server autentico e non con un intermediario ostile (MitM — Man-in-the-Middle).

**TLS (Transport Layer Security)** — il successore standardizzato del vecchio protocollo SSL (Secure Sockets Layer) — è il protocollo crittografico a livello di trasporto progettato per garantire queste tre proprietà.

---

## 2. Crittografia a Chiave Pubblica: La Storia di Alice, Bob e il Lucchetto

Nel mondo della crittografia tradizionale (simmetrica), Alice e Bob condividono una singola chiave segreta comune. Se Alice chiude a chiave un forziere, Bob può aprirlo solo se possiede la medesima chiave fisica.

Ma su Internet sorge un paradosso insormontabile: **come fanno due computer che non si sono mai visti prima a scambiarsi una chiave segreta senza che qualcuno in ascolto sul canale la intercetti?**

Negli anni '70, i crittografi Whitfield Diffie, Martin Hellman e Ralph Merkle hanno risolto questo dilemma inventando la **Crittografia Asimmetrica (a Chiave Pubblica)**.

Visualizziamo il meccanismo con un'analogia intuitiva:

```mermaid
sequenceDiagram
    autonumber
    actor Alice as Alice (Client)
    actor Bob as Bob (Server)

    Note over Bob: Genera una coppia di chiavi:<br/>1. Lucchetto aperto (Chiave Pubblica)<br/>2. Chiave fisica (Chiave Privata)
    Bob-->>Alice: Invia il lucchetto aperto (Chiave Pubblica) su rete pubblica
    Note over Alice: Alice scrive il segreto,<br/>lo mette nella scatola e chiude il lucchetto di Bob!
    Alice-->>Bob: Spedisce la scatola chiusa a chiave
    Note over Bob: Solo Bob possiede la chiave fisica privata!<br/>Bob apre la scatola e legge il segreto.
```

1. **Bob acquista un milione di lucchetti identici e aperti**, conservando per sé l'unica chiave fisica capace di aprirli.
2. Bob distribuisce liberamente questi lucchetti aperti a chiunque nel mondo (questa è la **Chiave Pubblica**).
3. Alice vuole inviare un messaggio confidenziale a Bob: prende uno dei lucchetti di Bob, inserisce la lettera in una cassetta di sicurezza e **fa scattare il lucchetto**.
4. Una volta fatto scattare il lucchetto, persino Alice non può più riaprire la scatola!
5. Alice spedisce la cassetta blindata attraverso una rete pubblica non fidata. Se un attaccante intercetta la scatola, non può fare nulla.
6. Solo Bob, custode della **Chiave Privata**, può girare la toppa e accedere al contenuto.

---

## 3. I 3 Compiti Crittografici: Autenticazione vs Scambio Chiavi vs Cifratura

Spesso gli ingegneri confondono il ruolo delle chiavi asimmetriche (RSA / ECC) pensando che vengano usate per cifrare l'intera sessione di streaming o le chiamate API REST. **Non è così!**

La crittografia asimmetrica richiede un carico computazionale enorme rispetto alla cifratura simmetrica. Pertanto, TLS suddivide il lavoro in tre responsabilità distinte:

| Funzione | Famiglia di Algoritmi | Obiettivo Tecnico | Esempio Pratico |
| :--- | :--- | :--- | :--- |
| **1. Autenticazione** | Firme Digitali (RSA, ECDSA, Ed25519) | Dimostrare l'identità del server ed evitare spoofing | Certificato X.509 firmato da una CA |
| **2. Scambio Chiavi** | Diffie-Hellman Ephemeral (ECDHE, DHE) | Negoziare una chiave segreta temporanea e sicura | Generazione sicura del segreto di sessione condiviso |
| **3. Cifratura Dati** | Cifrari Simmetrici a Blocchi/Flusso (AES-GCM, ChaCha20-Poly1305) | Cifrare il traffico dell'applicazione a velocità di linea (Gbps) | Crittografia AEAD di tutti i payload HTTP/2 o HTTP/3 |

### 🗺️ Diagramma di Flusso del Modello Mentale TLS

```mermaid
flowchart TD
    Start([Connessione TCP Stabilita]) --> Step1[Fase 1: Scambio Chiavi ECDHE & Autenticazione X.509]
    Step1 --> VerifyCert{Certificato Valido & Emesso da CA Fidata?}
    VerifyCert -- No --> Alert[Errore TLS: Certificato Non Valido / Errore PKIX]
    VerifyCert -- Sì --> DeriveKeys[Derivazione Chiave Simmetrica Simmetrica Simmetrica di Sessione]
    DeriveKeys --> BulkCrypto[Fase 2: Canale Sicuro AES-GCM / ChaCha20]
    BulkCrypto --> DataStream([Streaming Dati Applicativi HTTP Cifrati ad Alta Velocità])
```

---

## 4. 🚨 5 Falsi Miti Critici su TLS da Sfatare per Ingegneri DevOps

### Falso Mito 1: "La chiave pubblica del certificato cifra tutti i dati scambiati tra client e server"
> **Realtà:** La chiave pubblica serve esclusivamente per autenticare l'identità del server (e storicamente in RSA per cifrare il pre-master secret, deprecato in TLS 1.3). Tutti i dati applicativi vengono cifrati con chiavi simmetriche AES o ChaCha20 negoziate dinamicamente via ECDHE.

### Falso Mito 2: "Il lucchetto del browser garantisce che il sito web sia sicuro e privo di malware"
> **Realtà:** Il lucchetto certifica esclusivamente che la connessione verso il dominio indicato è cifrata e che il certificato è valido. Un sito di phishing può richiedere legittimamente un certificato Let's Encrypt valido in 30 secondi e mostrare il lucchetto verde o grigio senza alcuna garanzia sul contenuto!

### Falso Mito 3: "La crittografia TLS protegge i dati salvati a riposo (at-rest) sul server"
> **Realtà:** TLS protegge solo i dati **in transito (in-flight)** sul cavo. Nel momento in cui il reverse proxy (es. Nginx o Ingress Controller) decifra il frame TLS, il payload ritorna in chiaro nella memoria dell'host o sul backend se non è abilitato mTLS.

### Falso Mito 4: "Posso concatenare i certificati della catena in qualsiasi ordine nel file PEM"
> **Realtà:** L'ordine all'interno del bundle PEM è tassativo per RFC: deve iniziare con il **certificato foglia (Leaf/Server)**, seguito nell'ordine esatto da ciascun **certificato intermedio (Intermediate CA)** fino alla root. Un ordine errato o l'assenza degli intermedi provoca errori di connessione su client rigidi (Java JVM, Go, curl).

### Falso Mito 5: "Se genero una chiave RSA a 4096 bit, ottengo una sicurezza dieci volte superiore rispetto a ECDSA P-256"
> **Realtà:** Una chiave ellittica ECDSA (secp256r1) a 256 bit offre circa 128 bit di sicurezza crittografica equivalente a una chiave RSA a 3072 bit, ma con firme molto più veloci, handshake più leggeri e overhead di banda ridotto sui pacchetti TCP.

---

## 5. Il Problema dell'Impostore e i CSR (Certificate Signing Requests)

Torniamo all'analogia del lucchetto: cosa impedisce a un malintenzionato di nome Eve di piazzare il **proprio** lucchetto aperto tra Alice e Bob, dicendo ad Alice: *"Ciao, sono Bob! Usa questo lucchetto"*?

Questo è il classico attacco **Man-in-the-Middle (MitM)**. Per impedirlo, Bob non può limitarsi a distribuire una chiave grezza: ha bisogno di un documento notarile che leghi indissolubilmente la sua chiave pubblica alla sua identità reale (`gcloudcafe.com`).

Questo documento è il **Certificato Digitale X.509**, e il processo per ottenerlo inizia con un **CSR (Certificate Signing Request)**.

```mermaid
flowchart LR
    A[Generazione Chiave Privata<br/>private.key] --> B[Creazione Richiesta CSR<br/>request.csr]
    B --> C[Invio alla Certificate Authority<br/>Let's Encrypt / DigiCert / Vault]
    C --> D[CA convalida il dominio<br/>e firma il certificato finale]
    D --> E[Certificato X.509 Rilasciato<br/>certificate.crt]
```

### Tabella Comparativa Rapida

| Elemento | Estensione Comune | Contenuto | Esposizione |
| :--- | :--- | :--- | :--- |
| **Chiave Privata** | `.key`, `.pem` | Segreto matematico crittografico | **Segretissimo.** Non deve mai lasciare il server o il KMS |
| **CSR** | `.csr`, `.pem` | Chiave pubblica + Dominio (SAN) + Firma del richiedente | Pubblico / Inviato alla CA per emissione |
| **Certificato** | `.crt`, `.cer`, `.pem` | Chiave pubblica + Metadati + Firma digitale della CA | Pubblico. Inviato a ogni client durante l'handshake |

---

## 6. Certificati Digitali: L'Identità Vidimata da un Notaio

Un certificato digitale è l'equivalente crittografico di un passaporto biometrico rilasciato da uno stato sovrano.

Contiene:
- **Il Soggetto (Subject):** A chi appartiene il certificato (il nome a dominio `gcloudcafe.com`).
- **Subject Alternative Names (SAN):** L'elenco moderno e obbligatorio di tutti i domini validi (`*.gcloudcafe.com`, `api.gcloudcafe.com`).
- **La Chiave Pubblica:** La componente matematica con cui verificare l'identità del server.
- **L'Emittente (Issuer):** Chi ha firmato il certificato (es. *Let's Encrypt Authority X3*).
- **Date di Validità:** Intervallo temporale (*Not Before* e *Not After*).
- **Firma Digitale della CA:** Il digest crittografico calcolato e firmato con la chiave privata dell'autorità di certificazione.

### Lunghezza della Chiave vs Dimensione del File su Disco

Un equivoco frequente tra gli sviluppatori è confondere la dimensione del file `.key` o `.crt` su disco con la lunghezza crittografica della chiave:

- Una chiave RSA da 2048 bit si riferisce alla lunghezza del modulo aritmetico (2048 bit binari).
- Salvata in formato PEM (codifica Base64 con header `-----BEGIN PRIVATE KEY-----`), occupa circa 1,7 KB su disco.
- Al contrario, una chiave ellittica **ECDSA P-256** ha una dimensione su disco di soli ~240 byte pur offrendo la medesima robustezza di un RSA a 3072 bit!

---

## 7. Autorità di Certificazione: CA Pubbliche vs PKI Private

Come fa il tuo computer a fidarsi della firma digitale apposta su un certificato?

Nel sistema operativo o nel browser è presente un archivio di fiducia locale chiamato **Root CA Trust Store**:
- In Linux: `/etc/ssl/certs/ca-certificates.crt`
- In Windows: Windows Certificate Store (`certmgr.msc`)
- In macOS: Keychain Access (Portachiavi di sistema)
- Nella JVM Java: `$JAVA_HOME/lib/security/cacerts`
- Nei container Docker minimali (Alpine): pacchetto `ca-certificates`

Esistono due categorie architetturali principali di Certificate Authority:

1. **CA Pubbliche (Web PKI):**
   - Regolate dal consorzio CA/Browser Forum.
   - Esempi: Let's Encrypt, DigiCert, Sectigo, Google Trust Services.
   - I loro certificati radice sono preinstallati di default in miliardi di dispositivi nel mondo.

2. **CA Private / Interne (Enterprise PKI):**
   - Create all'interno di un'azienda o cluster Kubernetes (es. HashiCorp Vault, cert-manager, Smallstep, AD CS).
   - Utilizzate per il traffico microservizio-microservizio, backend e database.
   - **Requisito critico:** Il certificato Root CA privato deve essere distribuito e inserito esplicitamente nel TrustStore di ogni nodo o container.

---

## 8. La Catena di Fiducia: Root CA vs Intermediate CA

Una domanda comune: *Perché la Root CA non firma direttamente il certificato del mio sito web?*

Se una Root CA dovesse firmare direttamente milioni di certificati al secondo via API, la sua chiave privata dovrebbe risiedere online su server esposti a Internet. In caso di violazione della chiave privata di una Root CA, **l'intera fiducia globale su Internet crollerebbe istantaneamente**, e revocare un certificato radice hardcoded nei dispositivi richiede mesi o anni!

Per questa ragione, l'architettura PKI impiega una struttura a più livelli:

```
[ Root CA ] (Mantenuta rigorosamente OFFLINE in una camera di sicurezza blindata HSM)
     │
     ▼ firma una tantum
[ Intermediate CA 1 ] (Server online protetti per emissioni controllate)
     │
     ▼ firma automatizzata via ACME / API
[ Certificato Foglia del Server ] (*.gcloudcafe.com)
```

1. La **Root CA** viene accesa solo per firmare una o due **Intermediate CA**, poi la sua chiave viene sconnessa dalla rete e sigillata in un modulo crittografico HSM offline.
2. Le **Intermediate CA** emettono i certificati finali (chiamati *Leaf Certificate* o certificati server).
3. Quando un browser si connette, il server invia sia il certificato foglia sia i certificati intermedi, permettendo al client di ricostruire la catena fino alla Root fidata nel suo archivio locale.

---

## 9. ⚠️ Sezione Critica: L'Ordine dei Certificati nella Catena è Importante?

La risposta breve è: **Sì, è assolutamente fondamentale!**

Secondo lo standard RFC 5246 e RFC 8446, il server TLS deve presentare la propria catena di certificati nel seguente ordine esatto all'interno del file bundle (es. `fullchain.pem`):

```
1. [Certificato del Server / Foglia] (es. www.gcloudcafe.com)
2. [Certificato Intermediate CA 1]   (es. R3 / E1 emesso da Let's Encrypt)
3. [Certificato Intermediate CA 2]   (opzionale, se presente una gerarchia a 3 livelli)
```

> [!WARNING]
> Non includere la Root CA nel bundle del server! La Root CA deve essere già presente nel TrustStore del client. Inviare la Root CA aumenta inutilmente i byte dell'handshake e su alcuni stack obsoleti può innescare fallimenti di validazione PKIX.

### Perché Catene Incomplete o Disordinate Provocano Disservizi in Produzione

Hai mai notato una pagina web che funziona perfettamente sul tuo browser desktop Chrome, ma fallisce miseramente con un errore `x509: certificate signed by unknown authority` su uno script Python, un microservizio Go o un job Java Kubernetes?

Questo accade perché i browser desktop implementano una funzionalità di tolleranza ai guasti chiamata **AIA Fetching (Authority Information Access)**: se il server dimentica di inviare l'Intermediate CA, il browser scarica silenziosamente il certificato mancante tramite HTTP.

I client backend ad alte prestazioni (cURL, microservizi Go, JVM, SDK AWS) **non eseguono mai l'AIA fetching per ragioni di latenza e sicurezza**. Se il tuo reverse proxy non fornisce l'intera catena ordinata, la chiamata API fallirà all'istante!

---

## 10. Cos'è un Certificato Self-Signed?

Un certificato **self-signed (auto-firmato)** è un certificato la cui firma crittografica è calcolata utilizzando la propria chiave privata associata, anziché quella di una Certificate Authority fidata.

### Generare un Certificato Auto-Firmato in 1 Comando

```bash
openssl req -x509 -newkey rsa:2048 -nodes -keyout localhost.key   -out localhost.crt -days 365   -subj "/CN=localhost"   -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"
```

### Certificato Foglia Auto-Firmato vs Root CA Auto-Firmata (La Differenza Chiave)

Perché creare una Root CA privata in azienda è una buona pratica, mentre distribuire singoli certificati server auto-firmati crea incubi di manutenzione?

- **Certificato Foglia Auto-Firmato:** Se hai 50 microservizi e ognuno ha il proprio certificato auto-firmato, dovrai inserire e aggiornare 50 certificati distinti nel truststore di ogni client. Quando scadono, dovrai riconfigurare ogni client.
- **Root CA Auto-Firmata:** Crei **una singola Root CA**, la installi una volta nei tuoi nodi o container, e poi emetti 50 o 500 certificati foglia firmati da essa. Tutti i client si fideranno istantaneamente di qualsiasi nuovo certificato emesso senza alcuna modifica di configurazione!

---

## 11. Anatomia di un Certificato X.509

Esaminiamo la struttura logica di un certificato X.509 decodificato tramite OpenSSL:

```
Certificate:
    Data:
        Version: 3 (0x2)
        Serial Number: 04:3a:72:b8:91:fc...
        Signature Algorithm: sha256WithRSAEncryption
        Issuer: C = US, O = Let's Encrypt, CN = R3
        Validity
            Not Before: Aug 14 00:00:00 2026 GMT
            Not After : Nov 12 23:59:59 2026 GMT
        Subject: CN = gcloudcafe.com
        Subject Public Key Info:
            Public Key Algorithm: id-ecPublicKey
                Public-Key: (256 bit)
        X509v3 extensions:
            X509v3 Key Usage: critical
                Digital Signature
            X509v3 Extended Key Usage: 
                TLS Web Server Authentication, TLS Web Client Authentication
            X509v3 Basic Constraints: critical
                CA:FALSE
            X509v3 Subject Alternative Name: 
                DNS:gcloudcafe.com, DNS:www.gcloudcafe.com
    Signature: ...
```

Campi da verificare sempre durante un audit:
1. `Basic Constraints`: Per un certificato server deve essere `CA:FALSE`. Se fosse `CA:TRUE`, quel server potrebbe emettere certificati per conto di altri!
2. `Subject Alternative Name (SAN)`: I browser moderni ignorano del tutto il campo `Common Name (CN)` e convalidano esclusivamente i domini indicati nei SAN.

---

## 12. Laboratorio Pratico OpenSSL: Da Chiave Privata a Certificato Verificato

Mettiamo in pratica la teoria con quattro passaggi essenziali per ogni ingegnere di piattaforma.

### Step 1: Generare una Chiave Privata ECDSA Moderna

Evita vecchi comandi RSA a meno che non vi siano vincoli di compatibilità legacy. Utilizziamo la curva ellittica standard P-256 (secp256r1):

```bash
openssl ecparam -name prime256v1 -genkey -noout -out server.key
```

Per visualizzare i parametri e la componente pubblica:

```bash
openssl ec -in server.key -text -noout
```

### Step 2: Generare un CSR con Subject Alternative Name (SAN)

Creiamo un file di configurazione temporaneo `csr.conf` per includere sia DNS sia IP:

```bash
cat <<EOF > csr.conf
[req]
default_bits = 2048
prompt = no
default_md = sha256
req_extensions = req_ext
distinguished_name = dn

[dn]
C = IT
ST = Lombardia
L = Milano
O = GCloudCafe Lab
CN = api.gcloudcafe.local

[req_ext]
subjectAltName = @alt_names

[alt_names]
DNS.1 = api.gcloudcafe.local
DNS.2 = test.gcloudcafe.local
IP.1 = 127.0.0.1
EOF

openssl req -new -key server.key -out server.csr -config csr.conf
```

### Step 3: Ispezionare i Metadati del CSR

Verifica che il CSR contenga tutti i campi prima di sottometterlo alla CA:

```bash
openssl req -text -noout -verify -in server.csr
```

### Step 4: Verificare la Corrispondenza tra Chiave Privata e Certificato (Digest SHA-256)

Durante un incidente alle 3 di notte, hai a disposizione 5 file `.key` e 5 file `.crt`. Come fai a sapere all'istante quale chiave privata appartiene a quale certificato, senza rischiare disservizi?

Estrai la chiave pubblica da entrambi i file e confronta il loro hash crittografico SHA-256:

```bash
# Calcolo hash chiave pubblica dal Certificato:
openssl x509 -noout -pubkey -in server.crt | openssl sha256

# Calcolo hash chiave pubblica dalla Chiave Privata:
openssl pkey -pubkey -in server.key | openssl sha256
```

Se i due valori esadecimali coincidono perfettamente, **la coppia di chiavi è matematicamente identica e valida per il deployment**.

---

## 📚 Standard Autorevoli e Riferimenti Ufficiali

- [RFC 5280: Internet X.509 Public Key Infrastructure Certificate and CRL Profile](https://datatracker.ietf.org/doc/html/rfc5280)
- [RFC 8446: The Transport Layer Security (TLS) Protocol Version 1.3](https://datatracker.ietf.org/doc/html/rfc8446)
- [Mozilla Server Side TLS Configuration Guide](https://wiki.mozilla.org/Security/Server_Side_TLS)
- [Let's Encrypt Documentation on Certificate Chains](https://letsencrypt.org/certificates/)

---

## Riepilogo e Cosa Troverai nella Parte 2

In questa prima parte abbiamo esplorato le fondamenta matematiche e architetturali di TLS:
- Il passaggio dalla rete a cartolina alla confidenzialità garantita.
- L'interazione tra chiavi pubbliche e private.
- Il ciclo di vita: Chiave Privata ➔ CSR ➔ Intermediate CA ➔ Certificato X.509.
- Perché l'ordine dei certificati nel bundle previene blocchi sui client backend.

👉 **Prossimo Step — [TLS per Ingegneri DevOps (Parte 2): Meccanica dell'Handshake TLS 1.2 vs 1.3, Cipher Suite e Risoluzione Problemi](/it/blog/tls-demystified-part2-handshake-ciphers-and-troubleshooting/)**: analizzeremo pacchetto per pacchetto l'handshake TLS, il passaggio da 2-RTT a 1-RTT e 0-RTT, l'anatomia dei Cipher Suite e i comandi per diagnosticare timeout e fallimenti SNI in produzione!\n