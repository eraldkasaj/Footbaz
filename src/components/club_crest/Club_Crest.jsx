import "./Club_Crest.css";

// Curated kit-color pairs so generated crests always keep good contrast.
const PALETTE = [
  ["#d32f2f", "#ffffff"],
  ["#1565c0", "#ffffff"],
  ["#1b1b1b", "#ffffff"],
  ["#2e7d32", "#ffffff"],
  ["#f9a825", "#1b1b1b"],
  ["#6a1b9a", "#ffffff"],
  ["#00695c", "#ffffff"],
  ["#c62828", "#1565c0"],
  ["#e65100", "#1b1b1b"],
  ["#4527a0", "#f9a825"],
];

const RED = "#d32f2f";
const BLUE = "#1565c0";
const WHITE = "#ffffff";
const BLACK = "#1b1b1b";
const YELLOW = "#f9a825";
const GREEN = "#2e7d32";
const SKY_BLUE = "#29b6f6";

// Real kit colors for known clubs, matched against the normalized club name.
const CLUB_COLOR_OVERRIDES = [
  { match: "dinamo", colors: [BLUE, WHITE] },
  { match: "elbasani", colors: [YELLOW, BLUE] },
  { match: "partizani", colors: [RED, YELLOW] },
  { match: "vllaznia", colors: [RED, BLUE] },
  { match: "skenderbeu", colors: [RED, WHITE] },
  { match: "laci", colors: [WHITE, BLACK] },
  { match: "bylis", colors: [RED, WHITE] },
  { match: "apolonia", colors: [GREEN, WHITE] },
  { match: "vora", colors: [WHITE, BLUE] },
  { match: "teuta", colors: [BLUE, WHITE] },
  { match: "lushnja", colors: [RED, GREEN] },
  { match: "tomorri", colors: [WHITE, GREEN] },
  { match: "flamurtari", colors: [RED, BLACK] },
  { match: "triumf", colors: [BLACK, YELLOW] },
  { match: "triumph", colors: [BLACK, YELLOW] },
  { match: "besa", colors: [YELLOW, BLACK] },
  { match: "riniael", colors: [RED, WHITE] },
  { match: "kinostudio", colors: [BLUE, GREEN] },
  { match: "tirana", colors: [WHITE, BLUE] },
  { match: "egnatia", colors: [GREEN, BLACK] },
  { match: "pogradeci", colors: [YELLOW, BLUE] },
  { match: "luftetari", colors: [BLUE, BLACK] },
  { match: "shkendija", colors: [SKY_BLUE, RED] },
  { match: "butrinti", colors: [YELLOW, BLUE] },
];

const SHIELD_PATH = "M50 2 L94 16 V56 C94 88 74 106 50 114 C26 106 6 88 6 56 V16 Z";

function normalize(str) {
  return str
    .toLowerCase()
    .replace(/ë/g, "e")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]/g, "");
}

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function resolveColors(label, key) {
  const normalized = normalize(label);
  const override = CLUB_COLOR_OVERRIDES.find((entry) => normalized.includes(entry.match));
  if (override) return override.colors;
  return PALETTE[hashString(key) % PALETTE.length];
}

function Club_Crest({ name = "", seed, size = 32 }) {
  const label = name.trim() || "Klub";
  const key = (seed || label).toString();
  const [primary, secondary] = resolveColors(label, key);
  const initial = label[0]?.toUpperCase() || "?";
  const clipId = `club-crest-clip-${key.replace(/[^a-zA-Z0-9]/g, "")}`;

  return (
    <svg
      className="club-crest"
      width={size}
      height={size}
      viewBox="0 0 100 116"
      role="img"
      aria-label={label}
    >
      <defs>
        <clipPath id={clipId}>
          <path d={SHIELD_PATH} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <rect x="0" y="0" width="50" height="116" fill={primary} />
        <rect x="50" y="0" width="50" height="116" fill={secondary} />
      </g>
      <path d={SHIELD_PATH} fill="none" stroke="rgba(0,0,0,0.25)" strokeWidth="3" />
      <text
        x="50"
        y="68"
        textAnchor="middle"
        fontSize="44"
        fontWeight="800"
        fill="rgba(255,255,255,0.92)"
        stroke="rgba(0,0,0,0.35)"
        strokeWidth="1"
      >
        {initial}
      </text>
    </svg>
  );
}

export default Club_Crest;
