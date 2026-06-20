## Diagnosi del 404

La route `/completato` esiste e funziona nel preview live (la stai vedendo ora). Il 404 probabilmente compare nel sito **pubblicato**, che non include ancora `/completato` (aggiunta dopo l'ultimo publish). Nessuna correzione di codice necessaria — basta ripubblicare alla fine del lavoro. Sistemiamo intanto il flow completo che oggi finisce nel vuoto dopo "Vedi il mio piano".

## Flow finale (3 step)

```text
questionario → /completato → /piano (anteprima)
   "Vedi il mio piano"        "Aggiungi al mio piano"
                                       ↓
                                  /app/piano  ← schermata in-app
                                  (bottom nav, FAB, Le tue visite)
```

## Cosa cambia

### 1) `/piano` — diventa esplicitamente "anteprima del piano"

- Resta il layout attuale (Programmi SSN, Raccomandati, Buone pratiche).
- CTA in basso rinominato **"Aggiungi alla mia lista" → "Aggiungi al mio piano"**, navigazione a `/app/piano`.
- Rimosso da qui: FAB "+", sezione "Le tue visite", link "Hai una visita collegata". Questi appartengono solo all'in-app.

### 2) Nuova route `/app/piano` — la schermata in-app (image #1)

Layout dall'alto:
- Header: eyebrow teal **PREVENZIONE**, H1 display **Il tuo piano**, sottotitolo "In base alle linee guida ministeriali e regionali".
- Chip teal chiaro **"{N} controlli nel tuo piano"** (N = numero item dal `computePlan`).
- Card bianca **PROGRAMMI DEL SSN** con riga per screening (icona circolare teal chiaro, nome bold, meta `Regione · Ogni X anni`, badge "Su adesione" dove pertinente, callout giallo "Sei già seguito da uno specialista…" per le diagnosi). Sotto, link teal **🔗 Hai una visita collegata · Vedi sotto** quando esiste una visita collegata, che scrolla alla card corrispondente.
- Card bianca **LINEE GUIDA NAZIONALI** (Cardiovascolare, Diabete) con icone circolari.
- Card bianca **BUONE PRATICHE** (Dermatologia, Oculistica, Medico di base).
- Sezione **LE TUE VISITE** su fondo `--teal-100` con le card delle visite utente (riusa `LeTueVisite` + `VisitCard` esistenti).
- **FAB +** teal fisso in basso a destra, sopra la bottom nav, che apre `/visita`.
- **Bottom nav** sticky (Home / Piano attivo / Prenotazioni / Referti) come tab bar in `<PhoneFrame>`. Per ora solo "Piano" è funzionale; le altre tab sono stub interni (no route, mostrano un toast "In arrivo" o non fanno nulla) per non generare altri 404.

Wrap: `ProfileProvider` + `VisitsProvider` + `PhoneFrame`.

### 3) `/visita` — invariata, ma "torna a" cambia

- Il pulsante X e i `navigate` dopo save/cancella puntano a `/app/piano` invece che a `/piano`.

### 4) Ripubblicare

A fine intervento, ripubblicare il sito così il 404 scompare anche sul dominio published.

## Dettagli tecnici

- File nuovo: `src/routes/app.piano.tsx` (con `createFileRoute('/app/piano')`). Il file genera anche `src/routeTree.gen.ts` automaticamente.
- Riuso dei componenti già scritti: `LeTueVisite`, `VisitCard`, helper `computePlan`, store `VisitsProvider`/`useVisits`.
- Bottom nav: componente locale `BottomNav` con 4 voci e icone Lucide (`Home`, `ClipboardCheck`, `Calendar`, `FileText`). Solo "Piano" attiva (teal-700); le altre disabilitate visivamente (ink-400).
- FAB: `position: absolute; right: 20px; bottom: 84px` dentro `PhoneFrame` (che è già `position: relative`).
- Scroll container con `padding-bottom` extra per non nascondere l'ultima card sotto FAB + nav.
- Conteggio chip: `plan.length + diagnosed.length` (i controlli mostrati nel piano).
- Nessuna modifica a `rules.ts` né alla logica di `computePlan`.

## Fuori scope

- Redesign dei campi `/visita` in stile "card per sezione" (image #2) — da fare in un secondo intervento.
- Pagine reali per Home / Prenotazioni / Referti.
