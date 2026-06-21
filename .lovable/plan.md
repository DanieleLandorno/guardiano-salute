## Obiettivo
Correggere il tab "Home" nella bottom navigation di `/app/piano` in modo che porti effettivamente a `/app/home`.

## Problema rilevato
- In `src/routes/app.home.tsx` il componente `NavTab` supporta già la prop `to`, ma il tab Home è in stato `active` e quindi renderizzato come `button` (corretto, siamo già sulla home).
- In `src/routes/app.piano.tsx` invece `NavTab` NON accetta la prop `to`: tutti i tab sono renderizzati come `button` e non c'è nessun `Link`. Il risultato è che cliccando su "Home" dalla pagina piano non succede nulla.

## Piano di intervento
1. **Aggiornare la signature di `NavTab` in `src/routes/app.piano.tsx`** per accettare la prop opzionale `to?: string`.
2. **Modificare il render di `NavTab`**: se `to` è presente e il tab non è `active`, restituire un `<Link to={to}>`; altrimenti restituire il `<button>` esistente.
3. **Passare `to="/app/home"` al primo `<NavTab label="Home" />`** in `BottomNav`, lasciando `Piano` come tab attivo (`active`).
4. **Mantenere invariati** stili, colori e comportamento del tab attivo.
5. Verificare che il typecheck/build passi.

## File coinvolto
- `src/routes/app.piano.tsx`