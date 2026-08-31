// Zgjedh një element nga lista në mënyrë deterministe sipas ditës së sotme —
// e njëjta zgjedhje mbetet gjatë gjithë ditës për të gjithë vizitorët (jo
// random në çdo ngarkim faqeje), dhe të nesërmen kalon te elementi tjetër,
// duke u rrotulluar nëpër gjithë listën. Përdoret nga Video_E_Dites dhe
// Player_E_Dites, që të mos përsëritet e njëjta logjikë datash në dy vende.
export function pickOfTheDay(list) {
  if (!list || list.length === 0) return null;

  const dayIndex = Math.floor(Date.now() / 86400000);
  return list[dayIndex % list.length];
}

export default pickOfTheDay;
