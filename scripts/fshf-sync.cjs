// Sinkronizon automatikisht ndeshjet/rezultatet nga faqja zyrtare e FSHF-së
// (fshf.org) te klubet tona të regjistruara — kjo ZËVENDËSON plotësisht
// futjen manuale të ndeshjeve nga klubi (Aldi vendosi që klubet të mos kenë
// më mundësi ta bëjnë vetë këtë te Matches.jsx).
//
// SI FUNKSIONON:
// FSHF ka një API të brendshme (JSON) që fuqizon widget-et e tyre të
// rezultateve, e mbrojtur nga një "nonce" (token) i shkurtër që gjendet
// direkt te HTML-ja e faqes së çdo kampionati (jo diçka që kërkon
// autentikim/session — verifikuar). Për çdo kampionat:
//   1. Marrim faqen https://fshf.org/competition/{slug}/ (HTML e thjeshtë).
//   2. Nxjerrim me regex nonce-in ("nonce":"...") dhe ID-në e kampionatit
//      ("competition":"..."), të dyja të ngulitura te <script> inline.
//   3. Thërrasim /wp-json/fshf-livescore/v1/past dhe /upcoming me atë ID+nonce.
//   4. Për çdo ndeshje, kontrollojmë nëse ekipi shtëpiak/mysafir përputhet me
//      emrin e një klubi tonë të regjistruar TE E NJËJTA LIGË (jo çdo klub
//      me atë emër — shmang përzierjen mes kategorive/moshave, njësoj si te
//      dallimi Apolonia U17 vs U19).
//   5. Shkruajmë/përditësojmë clubs/{clubId}/matches/fshf-{fshfMatchId}.
//
// I sigurt për t'u rixhiruar (idempotent) — përdor Admin SDK, kështu anashkalon
// rregullat e sigurisë (si scriptet e tjera admin, p.sh. delete-user.cjs).
//
// PËRDORIMI:
//   node scripts/fshf-sync.cjs
//
// Xhirohet automatikisht 1 herë në ditë nga .github/workflows/fshf-sync.yml.

const admin = require("firebase-admin");
const serviceAccount = require("../serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://footbaz-default-rtdb.europe-west1.firebasedatabase.app",
});

const db = admin.database();

// Kampionatet tona (të njëjtat vlera si te src/data/leagues.js) të lidhura me
// "slug"-un e faqes përkatëse te fshf.org. Disa kategori (mosha më të vogla
// te "Kategoria e Dytë", ose klube jashtë Shqipërisë) nuk kanë faqe kombëtare
// te FSHF — thjesht anashkalohen këtu, s'ka problem.
const LEAGUE_TO_FSHF_SLUG = {
  "U-19 Abissnet Superiore": "u-19-abissnet-superiore",
  "U-17 Abissnet Superiore": "u-17-abissnet-superiore",
  "U-16 Abissnet Superiore": "u-16-abissnet-superiore",
  "U-15 Abissnet Superiore": "u-15-abissnet-superiore",
  "U-14 Abissnet Superiore": "u-14-abissnet-superiore",
  "U-13 Abissnet Superiore": "u-13-abissnet-superiore",
  "Superiore Vajza": "superiore-vajza",
  "Kategoria e Parë U-19": "kat-e-pare-u-19",
  "Kategoria e Parë U-17": "kat-e-pare-u-17-2",
  "Kategoria e Parë U-15": "kat-e-pare-u-15",
  "Kategoria e Parë U-14": "kat-e-pare-u-14",
  "Kategoria e Parë U-13": "kat-e-pare-u-13",
};

// E njëjta logjikë si src/utils/normalizeName.js — riprodhuar këtu sepse ky
// script është CommonJS dhe s'importon direkt nga src/ (si te scriptet e
// tjera admin, që janë të vetë-përmbajtura).
function normalizeName(value) {
  return (value || "")
    .trim()
    .toLowerCase()
    .replace(/ë/g, "e")
    .replace(/ç/g, "c");
}

// fshf.org (WordPress + WAF) kthen 403 për kërkesa pa headers "browser-like" —
// verifikuar kur script-i xhirohej nga GitHub Actions (funksiononte lokalisht,
// ku fetch-i i Node/browser-it dërgon gjithsesi headers të ngjashëm nga OS-i).
const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "sq-AL,sq;q=0.9,en;q=0.8",
};

async function fetchCompetitionMeta(slug) {
  const res = await fetch(`https://fshf.org/competition/${slug}/`, { headers: BROWSER_HEADERS });
  if (!res.ok) throw new Error(`HTTP ${res.status} te faqja e kampionatit`);

  const html = await res.text();
  const nonceMatch = html.match(/"nonce":"([a-f0-9]+)"/);
  const idMatch = html.match(/"competition":"(\d+)"/);

  if (!nonceMatch || !idMatch) {
    throw new Error("S'u gjet nonce/ID te faqja — struktura e FSHF mund të ketë ndryshuar");
  }

  return { nonce: nonceMatch[1], competitionId: idMatch[1] };
}

async function fetchMatches(type, competitionId, nonce) {
  const url = `https://fshf.org/wp-json/fshf-livescore/v1/${type}?competition=${competitionId}&utcOffset=2&_wpnonce=${nonce}`;
  const res = await fetch(url, { headers: { ...BROWSER_HEADERS, Accept: "application/json" } });
  if (!res.ok) throw new Error(`HTTP ${res.status} nga API (${type})`);

  const data = await res.json();
  return data.matches || [];
}

function formatDateAlbania(epochMs) {
  // en-CA jep formatin YYYY-MM-DD, i njëjti format që përdor <input type="date">.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Tirane",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(epochMs));
}

function formatTimeAlbania(epochMs) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Tirane",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(epochMs));
}

// Ndërton një hartë "ligë||emërNormalizuar" -> clubId, vetëm për klube aktive
// (jo të çaktivizuara) me emër dhe ligë të vendosura.
async function buildClubIndex() {
  const snapshot = await db.ref("clubs").get();
  const allClubs = snapshot.exists() ? snapshot.val() : {};

  const index = new Map();

  for (const [clubId, club] of Object.entries(allClubs)) {
    if (club.disabled) continue;

    const name = club.profile?.name;
    const league = club.profile?.league;

    if (!name || !league) continue;

    index.set(`${league}||${normalizeName(name)}`, clubId);
  }

  return index;
}

async function writeMatchForClub(clubId, { opponent, date, time, location, isHome, status, ourScore, opponentScore, fshfMatchId }) {
  const matchRef = db.ref(`clubs/${clubId}/matches/fshf-${fshfMatchId}`);
  const existingSnap = await matchRef.get();
  const createdAt = existingSnap.exists() ? existingSnap.val().createdAt : Date.now();

  const entry = {
    opponent,
    date,
    time,
    location,
    isHome,
    status,
    source: "fshf",
    fshfMatchId,
    createdAt,
    syncedAt: Date.now(),
  };

  if (status === "played") {
    entry.ourScore = ourScore;
    entry.opponentScore = opponentScore;
  }

  await matchRef.set(entry);
}

async function syncMatch(league, match, status, clubIndex) {
  const homeName = match.homeTeam?.name;
  const awayName = match.awayTeam?.name;

  if (!homeName || !awayName) return;

  const homeClubId = clubIndex.get(`${league}||${normalizeName(homeName)}`);
  const awayClubId = clubIndex.get(`${league}||${normalizeName(awayName)}`);

  if (!homeClubId && !awayClubId) return; // asnjëri s'është klub yni — anashkalo

  const date = formatDateAlbania(match.dateTimeUTC);
  const time = formatTimeAlbania(match.dateTimeUTC);
  const location = match.facility?.name || "";
  const ourScoreHome = match.homeTeamResult?.current;
  const ourScoreAway = match.awayTeamResult?.current;

  if (homeClubId) {
    await writeMatchForClub(homeClubId, {
      opponent: awayName,
      date,
      time,
      location,
      isHome: true,
      status,
      ourScore: ourScoreHome,
      opponentScore: ourScoreAway,
      fshfMatchId: match.id,
    });
  }

  if (awayClubId) {
    await writeMatchForClub(awayClubId, {
      opponent: homeName,
      date,
      time,
      location,
      isHome: false,
      status,
      ourScore: ourScoreAway,
      opponentScore: ourScoreHome,
      fshfMatchId: match.id,
    });
  }
}

(async () => {
  const clubIndex = await buildClubIndex();

  for (const [league, slug] of Object.entries(LEAGUE_TO_FSHF_SLUG)) {
    try {
      const { nonce, competitionId } = await fetchCompetitionMeta(slug);

      const [pastMatches, upcomingMatches] = await Promise.all([
        fetchMatches("past", competitionId, nonce),
        fetchMatches("upcoming", competitionId, nonce),
      ]);

      for (const match of pastMatches) {
        await syncMatch(league, match, "played", clubIndex);
      }

      for (const match of upcomingMatches) {
        await syncMatch(league, match, "upcoming", clubIndex);
      }

      console.log(`OK: ${league} — ${pastMatches.length} të luajtura, ${upcomingMatches.length} të ardhshme kontrolluar.`);
    } catch (error) {
      console.log(`FAIL: ${league} (${slug}) —`, error.message);
    }
  }

  process.exit(0);
})().catch((error) => {
  console.error("Gabim i papritur:", error);
  process.exit(1);
});
