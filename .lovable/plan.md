## Diagnosi

Ho verificato in locale (dev sandbox):

- `src/routes/completato.tsx` esiste e `createFileRoute("/completato")` è corretto
- È registrato in `src/routeTree.gen.ts` (riga 167-170)
- `curl http://localhost:8080/completato` → **HTTP 200** con il contenuto "Tutto fatto!" renderizzato in SSR
- Stesso esito per `/app/piano` → HTTP 200

**Quindi in preview/dev la rotta funziona.** Il 404 che vedi proviene dal sito **pubblicato** (`check-my-health-guide.lovable.app`), che è ancora la build precedente: in quella build la rotta `/completato` non esisteva ancora, quindi torna 404.

Le modifiche al frontend (nuove rotte, componenti, stili) **non vanno live in automatico**: serve un republish dalla dialog Publish.

## Piano

Nessuna modifica al codice. Due passi, in ordine:

1. **Hard refresh della preview** (Cmd/Ctrl+Shift+R) per scaricare lo stato corrente del dev server e scartare eventuali bundle vecchi in cache. Verifica che il flusso `questionario → /completato → /piano → "Aggiungi al mio piano" → /app/piano` funzioni end-to-end nella preview.

2. **Republish** dal pulsante Publish (in alto a destra) → "Update". Dopo l'update, `check-my-health-guide.lovable.app/completato` smetterà di dare 404.

## Se dopo il republish il 404 persiste

Allora il problema non è la pubblicazione ma un errore di hydration runtime (i log console mostrano un warning `AwaitInner` e `Expected to find a match below the root match in SPA mode`). In quel caso indagherei:

- se `ProfileProvider` o `useProfile` lanciano qualcosa in SSR
- se la build di produzione perde la registrazione di `/completato` (controllo `dist/.../routeTree`)

Ma prima conviene fare republish — è la causa molto più probabile dato che in dev tutto risponde 200.
