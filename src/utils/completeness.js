// Vlerëson sa i plotë është profili i lojtarit — foto ka peshë më të madhe.
// Përdoret për të renditur "Lojtarët në Fokus" (Lojtaret_Ne_Fokus.jsx) sipas
// sa tërheqës është profili, jo si përqindje e sakte e plotësimit.
export function getCompletenessScore(player) {
  const profile = player.profile || {};

  const hasPhoto = Boolean(profile.photoURL);
  const hasVideo = Boolean(player.videos && Object.keys(player.videos).length > 0);

  const fields = [
    profile.position,
    profile.height,
    profile.weight,
    profile.nationality,
    profile.birthdate,
    profile.bio,
    profile.age,
    profile.dominantFoot,
  ];

  const filledCount = fields.filter(
    (value) => value !== undefined && value !== null && value !== ""
  ).length;

  let score = filledCount;

  if (hasPhoto) score += 5; // foto është faktori më i rëndësishëm vizual
  if (hasVideo) score += 2;

  return score;
}

// Fushat që numërohen te % e plotësimit të profilit, të shfaqura te Player
// Dashboard (nxitja për plotësim profili) — çdo fushë vlen njësoj (10%).
const PROFILE_COMPLETION_FIELDS = [
  "photoURL",
  "club",
  "league",
  "birthdate",
  "position",
  "height",
  "weight",
  "dominantFoot",
  "video", // rast i veçantë, kontrollohet më poshtë
  "bio",
];

// Kthen një numër të plotë 0–100 — sa % e profilit të lojtarit është
// plotësuar, sipas listës fikse të fushave më lart. Përdoret vetëm te
// dashboard-i privat i lojtarit (jo te profili publik).
export function getProfileCompletionPercent(player) {
  const profile = player?.profile || {};

  const hasVideo = Boolean(
    (player?.videos && Object.keys(player.videos).length > 0) || profile.videoURL
  );

  // Klubi/kampionati mund të jenë vendosur drejt te profili (dropdown-i i ri)
  // OSE vetëm si zë karriere pa datë mbarimi (rast i vjetër, ose lojtari e ka
  // shtuar te Karriera). E njëjta logjikë fallback si kudo tjetër te app-i
  // (Player_Card.jsx, Player_Profile_Card.jsx) — përndryshe llogaritja del më
  // e ulët nga sa është realisht, edhe pse ekranit i shfaqet klubi saktë.
  const careerEntries = Object.values(player?.career || {});
  const currentCareerEntry =
    careerEntries.find((entry) => !entry.endYear) || careerEntries[careerEntries.length - 1];

  const isFieldFilled = (field) => {
    if (field === "video") return hasVideo;
    if (field === "birthdate") return Boolean(profile.birthdate || profile.dateOfBirth);
    if (field === "club") return Boolean(profile.club || currentCareerEntry?.club);
    if (field === "league") return Boolean(profile.league || currentCareerEntry?.league);
    return Boolean(profile[field]);
  };

  const filledCount = PROFILE_COMPLETION_FIELDS.filter(isFieldFilled).length;

  return Math.round((filledCount / PROFILE_COMPLETION_FIELDS.length) * 100);
}

// A e ka lojtari statusin "Verified"? Kërkon 80%+ plotësim TË PLUS foto
// profili reale — pa foto, badge-i s'ka kuptim edhe nëse gjithçka tjetër
// është plotësuar, prandaj kjo s'mjafton vetëm me peshën e saj te 10 fushat.
export function isProfileVerified(player) {
  const hasPhoto = Boolean(player?.profile?.photoURL);
  return hasPhoto && getProfileCompletionPercent(player) >= 80;
}
