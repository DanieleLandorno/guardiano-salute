## Obiettivo
Ridisegnare la presentazione del piano (`/app/piano`), del form visita e di alcune copy del questionario, senza toccare la logica clinica in `src/lib/checkit/rules.ts`.

## 1. Helper di pianificazione (nuovo file)
Creo `src/lib/checkit/schedule.ts` con sole funzioni aritmetiche/di presentazione:
- `addMonths(yyyymm: string, months: number): Date` — somma cadenza_mesi a `ultimo_test_data` (YYYY-MM, giorno 1).
- `addMonthsFromIsoDate(iso: string, months: number): Date` — per visite (data ISO + frequenza in mesi/anni).
- `pillState(d: Date): "futura" | "passata"` — confronto con `new Date()`.
- `pillLabels(d: Date): { mese: string; anno: string }` — `MAG` / `2027` in italiano, uppercase 3 lettere.
Nessuna modifica a `rules.ts`.

## 2. `src/routes/app.piano.tsx`
Lettura: la versione attuale già renderizza screening + sezione "Le tue visite" + diagnosed/callout. Refactor della presentazione:

### Riga screening — layout colonne fisse
Struttura riga: `[contenuto flex:1][slot matita 40px][slot pill 56px]`. Slot sempre riservati anche vuoti, così matite/pill restano incolonnate.

### Pill scadenza (screening ufficiali)
Per ogni `MatchedScreening` calcolo prossima data se:
- esiste `profile.ultimo_test_data[screening.id]` (o equivalente campo profilo),
- `azione` NON è in `{delega_medico, richiedi_colonscopia, fare_test, primo_invito_futuro}`,
- screening non è "diagnosed".

Pill: box arrotondato (radius 10, ~52×52), mese 3 lettere uppercase sopra (12px bold), anno sotto (13px). Colori:
- futura → bg `#E1F5EE`, fg `#0F6E56`
- passata → bg `#FBF1DD`, fg `#97681A`

### Mancano dati
Se mancano `ultimo_test_data`/`data_da_completare = true` su uno screening eleggibile a pill:
- niente pill,
- sotto il titolo mostro card alert tappabile "Completa le informazioni mancanti" (stile ambra). Al tap apre un mini-prompt inline (oppure piccolo modal nello stesso file) per inserire mese/anno dell'ultimo test, aggiornando lo store profilo (uso il setter già esposto da `ProfileProvider`; se serve aggiungo un setter `setUltimoTest(screeningId, "YYYY-MM")` nel profilo store).

### Screening con diagnosi
Includo questi screening nella lista (oggi alcuni filtrati). Riga:
- niente pill (slot vuoto),
- niente matita (slot vuoto),
- sotto al titolo badge tappabile "Sei seguito da uno specialista" (chip ambra `#FBF1DD/#97681A`, icona stetoscopio + chevron). Toggle locale per espandere/collassare la nota ambra (box con barra sinistra `#D9A93E`): "Avendo una diagnosi in corso, non rientri nello screening preventivo: il percorso lo definisce il tuo specialista." Badge sempre visibile.

### Visite collegate inline
Per ogni screening, recupero `visits.filter(v => v.screening_id === screening.id)`. Se almeno una:
- sotto la riga screening, blocco con bordo sinistro verde `#1D9E75` (width 3), intestazione `AGGIUNTE DA TE:` (11px, letter-spacing, teal scuro),
- per ogni visita riga: `[nome + frequenza ("Ogni N mesi/anni")][matita][pill]`, stesse colonne degli screening.
- pill calcolata da `visit.data + frequenza_n*(u==="anni"?12:1)`.
- matita = navigate `/visita?id=<id>`.

### Sezione "Le tue visite" in fondo
Solo visite senza `screening_id`. Se vuota → sezione non renderizzata. Stesso stile riga con colonne allineate.

## 3. `src/routes/visita.tsx`
- Sposto "Nome personalizzato" come primo campo (prima di tipologia).
- Nel selettore screening (quando "Sì"): popolo con TUTTI gli screening del piano corrente (`plan.byTier[1..3]`) + `diagnosed`. Uso `<select>` nativo con `<optgroup label="...">`:
  - "Programmi del SSN" → tier 1
  - "Linee guida nazionali" → tier 2
  - "Buone pratiche" → tier 3
  - "Sei seguito da uno specialista" → diagnosed
- Nessun'altra modifica al salvataggio.

## 4. `src/components/checkit/Questionario.tsx`
Copy-only sulle domande "quale test" per cervice (Pap/HPV-DNA) e colon-retto (SOF/Colonscopia): titolo → "Quale hai fatto come ultimo test?" (o equivalente coerente col tono). Nessuna modifica di logica/salvataggio.

## 5. Eventuale piccola estensione store profilo
Se non già presente, aggiungo a `ProfileProvider` un setter per scrivere `ultimo_test_data[screeningId]` (mantiene la struttura attuale). Nessuna modifica a `rules.ts`. Verifico prima di toccare.

## Verifica
Build automatica + Playwright: questionario → completato → `/app/piano` → tap "+" → `/visita` con nome personalizzato come primo campo + select con optgroup → salva → ritorno piano con visita inline sotto screening e pill colorata. Screenshot per confermare allineamento colonne.

## Note tecniche
- Nessuna modifica a `src/lib/checkit/rules.ts`.
- Calcolo prossima data: aritmetica pura in `schedule.ts`.
- Colori e font esistenti dal design system (`public/ds/tokens/*`).
