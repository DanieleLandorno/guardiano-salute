## Modifiche al piano

### Obiettivo
Ridurre lo spazio vuoto in fondo alla pagina e migliorare l'allineamento della nota ambra del toggle "Seguito da uno specialista".

### Dettagli implementativi

1. **Padding inferiore scrollabile (app.piano.tsx)**
   - Ridurre il `padding-bottom` del contenitore scrollabile da `200px` a un valore appena sufficiente a ospitare il FAB "+".
   - Il FAB è posizionato a `bottom: 96px` con altezza `60px`, quindi un `padding-bottom` di circa `90px`–`100px` garantisce che l'ultimo contenuto resti visibile senza spazio aggiuntivo.

2. **Allineamento nota ambra al toggle (app.piano.tsx)**
   - La nota espansa del toggle "Seguito da uno specialista" è attualmente a tutta la larghezza della riga.
   - Aggiungere un margine sinistro pari all'offset della colonna testo (icona `36px` + gap `10px` = `46px`) così che il bordo sinistro della nota gialla si allinei al punto dove inizia il testo/toggle.
   - Mantenere il bordo destro a filo con il margine destro della riga, come richiesto.
   - Verificare che il testo della nota e il bordo colorato restino leggibili dopo l'indentazione (eventualmente aggiustare padding interno).

### Verifica
- Build TypeScript senza errori.
- Anteprima mobile: scroll fino in fondo — lo spazio sotto la card verde "Le tue visite" deve contenere solo il FAB con un piccolo respiro.
- Espandere un toggle "Seguito da uno specialista" — la nota ambra deve iniziare dalla colonna del testo e arrivare fino a destra.