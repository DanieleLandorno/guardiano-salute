Bug: in `StepDataNascita` (Questionario.tsx), quando l'utente digita un giorno/mese a due cifre (es. "01", "02"), il componente mostra "00".

**Causa**: `onBlurPad` cattura il valore di stato nel closure. Dopo che `onChangeDM` imposta il valore a due cifre e sposta automaticamente il focus al campo successivo, il `blur` del campo precedente scatta con il vecchio valore (una sola cifra) e lo paddinga a `0X`, sovrascrivendo la stringa corretta.

**Fix**:
1. Modificare `onBlurPad` per leggere il valore live dal DOM (`e.currentTarget.value`) invece di usare il parametro `val` catturato nel closure.
2. Aggiornare i `onBlur` dei campi giorno e mese per passare l'evento.
3. Mantenere il padding corretto per le singole cifre quando l'utente esce manualmente (es. "3" → "03").

File: `src/components/checkit/Questionario.tsx` (componente `StepDataNascita`, righe ~229-231 e relative chiamate nei due input).