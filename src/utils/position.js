// Emrat shqip të pozicioneve, sipas kodeve të përdorura te Player_Dashboard
// (GK, CB, LB, ... ST). Përdoret kudo ku duhet të shfaqet emri i plotë i
// pozicionit të një lojtari (jo vetëm kodi).
const POSITION_NAMES = {
  GK: "Portier",
  CB: "Qendër Mbrojtës",
  LB: "Mbrojtës i Majtë",
  RB: "Mbrojtës i Djathtë",
  LWB: "Wing Back i Majtë",
  RWB: "Wing Back i Djathtë",
  CDM: "Mesfushor Defensiv",
  CM: "Mesfushor Qendre",
  CAM: "Mesfushor Ofensiv",
  LM: "Mesfushor i Majtë",
  RM: "Mesfushor i Djathtë",
  LW: "Sulmues Krahu i Majtë",
  RW: "Sulmues Krahu i Djathtë",
  CF: "Qendër Sulmues",
  ST: "Sulmues",
};

export function getPositionName(position) {
  const normalized = position?.trim().toUpperCase();
  return POSITION_NAMES[normalized] || "—";
}

// Renditja taktike, portier -> mbrojtje -> mesfushë -> sulm — përdoret te
// skuadra e klubit (dhe te dropdown-i i pozicioneve tek Lojtarët) që lojtarët
// të dalin sipas linjës së lojës, jo sipas radhës së shtimit.
export const POSITION_ORDER = [
  "GK",
  "CB", "LB", "RB", "LWB", "RWB",
  "CDM", "CM", "CAM",
  "LM", "RM",
  "LW", "RW",
  "CF", "ST",
];

export function comparePositions(a, b) {
  const indexA = POSITION_ORDER.indexOf(a?.trim().toUpperCase());
  const indexB = POSITION_ORDER.indexOf(b?.trim().toUpperCase());

  if (indexA === -1 && indexB === -1) return 0;
  if (indexA === -1) return 1;
  if (indexB === -1) return -1;

  return indexA - indexB;
}

// 4 grupe taktike — portier, mbrojtje, mesfushë, sulm — për ngjyrosjen e
// skuadrës (p.sh. te tabela e klubit).
const POSITION_GROUPS = {
  GK: "gk",
  CB: "def", LB: "def", RB: "def", LWB: "def", RWB: "def",
  CDM: "mid", CM: "mid", CAM: "mid", LM: "mid", RM: "mid",
  LW: "fwd", RW: "fwd", CF: "fwd", ST: "fwd",
};

export function getPositionGroup(position) {
  const normalized = position?.trim().toUpperCase();
  return POSITION_GROUPS[normalized] || null;
}
