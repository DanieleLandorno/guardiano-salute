## Problema
Il pulsante "Accetto il trattamento…" su `/privacy` non risponde perché il bundle client di TanStack Start non riesce a caricarsi:

```
PAGEERROR: Failed to fetch dynamically imported module: virtual:tanstack-start-client-entry
[vite] Pre-transform error: Failed to load url /src/routes/piano.tsx
  in /dev-server/src/routeTree.gen.ts. Does the file exist?
```

Nello scorso turno ho eliminato `src/routes/piano.tsx` e riscritto a mano `src/routeTree.gen.ts`, ma il plugin Vite di TanStack Router ha ri-iniettato il riferimento alla vecchia route, e Vite continua a richiedere il file inesistente. Risultato: React non idrata, nessun handler `onClick` viene agganciato → tutti i bottoni risultano "morti", non solo il consenso.

## Fix
1. Riavviare il dev server Vite per forzare il plugin di TanStack Router a rigenerare `src/routeTree.gen.ts` dai file effettivamente presenti in `src/routes/` (senza `piano.tsx`).
2. Verificare che `routeTree.gen.ts` non contenga più import di `./routes/piano`.
3. Riaprire `/privacy` con Playwright, cliccare "Accetto il trattamento…", confermare che il bottone "Continua" diventa abilitato (stato `c1` aggiornato → idratazione OK).
4. Smoke test del flusso completo già richiesto: `/privacy` → `/come-funziona` → `/questionario` → `/completato` → `/app/piano` (200 + interazioni).

## Nessuna modifica di codice applicativo
Il codice di `privacy.tsx`, `Consent`, `PhoneFrame` è corretto: il problema è puramente uno stato sporco del dev server dopo la cancellazione del file. Non tocco UI, store, né altre route.