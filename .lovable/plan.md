## Obiettivo

Tre correzioni in `src/routes/app.piano.tsx`, senza toccare logica clinica (`rules.ts`).

## 1. Rimuovere card separata "Sei seguito da uno specialista"

- Eliminare il blocco `{diagnosed.length > 0 && <Card eyebrow="Sei seguito da uno specialista" ...>}` (righe ~195–209).
- Reintegrare gli screening con diagnosi DENTRO la card "Programmi del SSN", nel loro ordine naturale.
  - Costruire una lista unificata per il render della Card SSN che includa: `ssnAll` + un eventuale `diagnosed` per ciascuno screening con diagnosi che non è già presente in `ssnAll` (per evitare duplicati quando lo stesso organo ricade sia in `plan` che in `diagnosi_oncologica`).
  - Se uno screening ha diagnosi (presente in `profile.diagnosi_oncologica`), passare `diagnosisBadge` a `ScreeningRow` e non passare `screening`/`onSetUltimoTest`: così la pill data non viene calcolata né renderizzata e al suo posto resta il toggle ambra `DiagnosisToggle` ("Seguito da specialista").
  - Il badge ambra è già implementato con `width: fit-content`, `whiteSpace: nowrap`, è un vero toggle (`useState`) con chevron + stetoscopio: lasciato invariato. Verificare solo che resti SEMPRE visibile (non sparire mai) — è l'unico marker che distingue lo screening "in follow-up" da uno screening "da fare".
- Aggiornare il contatore `totaleControlli`: il `diagnosed.length` è già nel totale; verificare che, dopo l'unione in SSN, non venga contato due volte (se uno screening fosse sia in `plan` che in `diagnosed`).

## 2. Compattare blocco "Aggiunte da te" (visite linkate inline)

In `ScreeningRow` (righe ~419–432):
- Ridurre `marginTop` del wrapper da `10` → `6`.
- Ridurre il `marginBottom` dell'eyebrow "AGGIUNTE DA TE:" da `6` → `4`.
- Ridurre il `gap` della lista visite da `8` → `6`.
- Ridurre il `padding` di ogni riga visita da `"8px 2px"` → `"4px 2px"`.

Mantenere la barra verde a sinistra (`borderLeft: 3px solid teal-500`) e `paddingLeft: 12`.

## 3. Far comparire la card finale "Le tue visite" (scollegate)

La sezione esiste già (righe ~240–254) ma è dentro `{ready && (...)}`. Verifica + fix:

- Spostare il render della sezione `standaloneVisits` FUORI dal blocco `{ready && (...)}`, così è indipendente dal completamento del questionario. Resta comunque condizionato a `standaloneVisits.length > 0`.
- Verificare che il filtro `visits.filter((v) => !v.screening_id)` raccolga effettivamente le visite "a sé". In `/visita.tsx` riga 137 il salvataggio fa `screening_id: collegata === "si" ? screeningId : null` → corretto, nessuna patch lato form necessaria.
- Confermare che `VisitsProvider` carica da `sessionStorage` al mount (sì, già fa `useState(() => load())`), quindi al ritorno da `/visita` la visita appare.
- Stile invariato: fondo `var(--teal-100)` (#E1F5EE), radius 18, padding interno, righe in card bianca con `VisitInlineRow`.
- Lasciare invariato il `padding-bottom: 200px` del contenitore scroll per non far coprire l'ultima riga dal FAB.

## File toccati

- `src/routes/app.piano.tsx` (unico file).

Nessuna modifica a `rules.ts`, `visits.tsx`, o al form `/visita`.

## Verifica

- Build TS.
- Playwright a 390px:
  1. Profilo donna 50+: verificare che gli screening con diagnosi appaiano nella card SSN con badge ambra (no pill data) accanto agli altri screening con pill.
  2. Aggiungere visita "a sé" da `/visita` → tornare al piano → verificare che compaia la card "Le tue visite" in fondo.
  3. Aggiungere visita collegata → verificare blocco "AGGIUNTE DA TE" più compatto sotto lo screening.
