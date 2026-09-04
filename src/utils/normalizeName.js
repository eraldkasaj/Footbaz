// Normalizon një emër (klubi, lojtari, etj.) për krahasim — të gjitha me
// shkronja të vogla, hapësira të tepërta të hequra, ë/ç të zëvendësuara me
// e/c. Përdoret kudo ku duhet zbuluar nëse dy emra "janë të njëjtë" pavarësisht
// dallimeve të vogla drejtshkrimore (Register.jsx për paralajmërimin e klubit
// të dyfishtë, Admin.jsx për zbulimin e emrave të dyfishtë të lojtarëve).
export function normalizeName(value) {
  return (value || "")
    .trim()
    .toLowerCase()
    .replace(/ë/g, "e")
    .replace(/ç/g, "c");
}
