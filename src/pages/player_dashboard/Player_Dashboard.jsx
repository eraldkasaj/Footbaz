import "./Player_Dashboard.css";
import { useEffect, useState } from "react";
import { auth, db } from "../../firebase/firebase";
import { ref, get, push, set, remove } from "firebase/database";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import {
  formatBirthdate,
  getPlayerAge,
} from "../../utils/age";
import {
  LuFootprints,
  LuLogOut,
  LuPencil,
  LuPlay,
  LuPlus,
  LuSettings,
  LuShield,
  LuTrash2,
  LuX,
} from "react-icons/lu";

const statItems = [
  ["matches", "Ndeshje"],
  ["goals", "Gola"],
  ["assists", "Asist"],
  ["yellowCards", "Kartona të verdhë"],
  ["redCards", "Kartona të kuq"],
];

const detailedStatItems = [...statItems, ["minutes", "Minuta të luajtura"]];

// Official Albanian league/competition tiers (FSHF), used as the fixed set of
// choices for the "Kampionati" field so players pick from a real list
// instead of typing free text.
const LEAGUE_OPTIONS = [
  "Abissnet Superiore",
  "Abissnet Superiore U-21",
  "U-19 Abissnet Superiore",
  "U-17 Abissnet Superiore",
  "U-16 Abissnet Superiore",
  "U-15 Abissnet Superiore",
  "U-14 Abissnet Superiore",
  "U-13 Abissnet Superiore",
  "Superiore Vajza",
  "Kategoria e Parë",
  "Kategoria e Parë U-19",
  "Kategoria e Parë U-17",
  "Kategoria e Parë U-15",
  "Kategoria e Parë U-14",
  "Kategoria e Parë U-13",
  "Kategoria e Dytë A",
  "Kategoria e Dytë B",
  "Kategoria e Tretë",
  "Fustal League",
  "5x5",
  "Kupa e Shqipërisë",
];

// Every individual position the pitch can highlight. Keys are the canonical
// codes used both by the CSS classes (lowercased) and by getPositionName.
const PITCH_POSITIONS = [
  "GK",
  "CB",
  "LB",
  "RB",
  "LWB",
  "RWB",
  "CDM",
  "CM",
  "CAM",
  "LM",
  "RM",
  "LW",
  "RW",
  "CF",
  "ST",
];

// Aliases so odd/legacy values stored in Firebase (or synonyms like "DF",
// "MID", "GOALKEEPER") still resolve to one of the exact codes above instead
// of falling back to a generic zone. Add more aliases here as needed — the
// pitch and getPositionName both read from the same PITCH_POSITIONS list, so
// nothing else needs to change.
const POSITION_ALIASES = {
  GOALKEEPER: "GK",
  PORTIER: "GK",
  DF: "CB",
  DEF: "CB",
  DEFENDER: "CB",
  DM: "CDM",
  MID: "CM",
  MIDFIELDER: "CM",
  AM: "CAM",
  FW: "ST",
  FORWARD: "ST",
  STRIKER: "ST",
};

// Resolves any stored position value to one of the exact codes in
// PITCH_POSITIONS (GK, LB, CB, RB, LWB, RWB, CDM, CM, CAM, LM, RM, LW, RW,
// CF, ST). Falls back to "ST" only when the value is missing or unrecognized.
const getPitchPosition = (position) => {
  const normalizedPosition = position?.trim().toUpperCase();

  if (!normalizedPosition) return "ST";

  if (PITCH_POSITIONS.includes(normalizedPosition)) return normalizedPosition;

  return POSITION_ALIASES[normalizedPosition] || "ST";
};

const getPositionName = (position) => {

  const normalizedPosition = position?.trim().toUpperCase();

  const names = {
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

  const name = names[normalizedPosition];

  if (!name) return "—";

  return `${name} (${normalizedPosition})`;

};

function Player_Dashboard() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [activeTab, setActiveTab] = useState("Përmbledhje");

  const [showCareerModal, setShowCareerModal] = useState(false);
  const [careerForm, setCareerForm] = useState({ club: "", league: "", startYear: "", endYear: "" });
  const [careerError, setCareerError] = useState("");
  const [savingCareer, setSavingCareer] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const user = auth.currentUser;

      if (!user) {
        navigate("/login");
        return;
      }

     const snapshot = await get(ref(db, `players/${user.uid}`));

      if (snapshot.exists()) {
        setUserData(snapshot.val());
      }
    };

    getUser();
  }, [navigate]);

  const logout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  const openCareerModal = () => {
    setCareerForm({ club: "", league: "", startYear: "", endYear: "" });
    setCareerError("");
    setShowCareerModal(true);
  };

  const closeCareerModal = () => {
    setShowCareerModal(false);
    setCareerError("");
  };

  const addCareerEntry = async (event) => {
    event.preventDefault();

    const user = auth.currentUser;

    if (!user) return;

    const club = careerForm.club.trim();
    const league = careerForm.league.trim();
    const startYear = careerForm.startYear.trim();
    const endYear = careerForm.endYear.trim();

    if (!club || !startYear) {
      setCareerError("Plotëso të paktën klubin dhe vitin e fillimit.");
      return;
    }

    setSavingCareer(true);
    setCareerError("");

    try {
      const careerRef = ref(db, `players/${user.uid}/career`);
      const newEntryRef = push(careerRef);

      const entry = {
        club,
        league: league || null,
        startYear,
        endYear: endYear || null,
        createdAt: Date.now(),
      };

      await set(newEntryRef, entry);

      setUserData((previous) => ({
        ...previous,
        career: { ...(previous?.career || {}), [newEntryRef.key]: entry },
      }));

      setShowCareerModal(false);
    } catch (saveError) {
      setCareerError(saveError.message || "Klubi nuk u shtua dot.");
    } finally {
      setSavingCareer(false);
    }
  };

  const deleteCareerEntry = async (entryId) => {
    const user = auth.currentUser;

    if (!user) return;

    if (!window.confirm("Ta heq këtë klub nga karriera jote?")) return;

    try {
      await remove(ref(db, `players/${user.uid}/career/${entryId}`));

      setUserData((previous) => {
        const nextCareer = { ...(previous?.career || {}) };
        delete nextCareer[entryId];
        return { ...previous, career: nextCareer };
      });
    } catch {
      // Silently ignore — the entry simply stays visible if the delete failed.
    }
  };

  const profile = userData?.profile ?? {};
  const birthdate = profile.birthdate || profile.dateOfBirth;
  const age = getPlayerAge(profile);
  const stats = userData?.statistics ?? {};
  const fullName =[profile.name, profile.surname].filter(Boolean).join(" ") || "Profili im";
  const pitchPosition = getPitchPosition(profile.position);

  const careerEntries = Object.entries(userData?.career || {})
    .map(([id, entry]) => ({ id, ...entry }))
    .sort((a, b) => (Number(b.startYear) || 0) - (Number(a.startYear) || 0));

  // The "current" club/league now come from the career entry the player
  // marked as ongoing (no endYear) — added once, from the Karriera tab —
  // instead of a separate Klubi/Liga field in Edit Profile. This keeps club
  // info editable from a single place. Older accounts that only have the
  // legacy profile.club/profile.league (no career entries yet) still work
  // via the fallback below.
  const currentCareerEntry = careerEntries.find((entry) => !entry.endYear);
  const club = currentCareerEntry?.club || profile.club || "Klubi nuk është vendosur";
  const league = currentCareerEntry?.league || profile.league || "Superliga Shqiptare U-19";

  const videoEntries = userData?.videos
    ? Object.entries(userData.videos)
        .map(([id, video]) => ({ id, ...video }))
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    : profile.videoURL
    ? [{ id: "legacy", url: profile.videoURL }]
    : [];

  return (
    <main className="talento-player-dashboard">
      <section className="talento-player-panel">
        <div className="talento-player-actions">
          <button type="button" onClick={() => navigate("/player-settings")}>
            <LuSettings /> Cilësimet
          </button>
          <button type="button" onClick={() => navigate("/edit-profile")}>
            <LuPencil /> Edito profilin
          </button>
          <button type="button" className="talento-player-logout" onClick={logout}>
            <LuLogOut /> Dil
          </button>
        </div>

        <header className="talento-player-hero">
          <div className="talento-player-photo">
            {profile.photoURL ? (
              <img src={profile.photoURL} alt={fullName} />
            ) : (
              <span>{fullName.slice(0, 2).toUpperCase()}</span>
            )}
          </div>

          <div className="talento-player-summary">
            <div className="talento-player-name-row">
              <h1>{fullName}</h1>
              <span className="talento-player-verified">Verified</span>
            </div>

            <p className="talento-player-club"><LuShield /> {club}</p>
            <p className="talento-player-league">🇦🇱 {league}</p>

            <div className="talento-player-facts">
              <div>
                <strong>
                  {age ?? "—"}
                  {birthdate ? ` (${formatBirthdate(birthdate)})` : ""}
                </strong>
                <span>Mosha</span>
              </div>
              <div>
                <strong>{profile.height ? `${profile.height} cm` : "—"}</strong>
                <span>Lartësia</span>
              </div>
              <div>
                <strong>{getPositionName(profile.position)}</strong>
                <span>Pozicioni</span>
              </div>
              <div>
                <strong>{profile.nationality || "—"}</strong>
                <span>Kombësia</span>
              </div>
              <div>
               <strong><LuFootprints />{profile.dominantFoot === "Right" ? "E djathtë" : profile.dominantFoot === "Left"? "E majtë": profile.dominantFoot === "Both"? "Të dyja"   : "—"}</strong>
                <span>Këmba e preferuar</span>
              </div>
              <div>
                <strong>{profile.weight ? `${profile.weight} kg` : "—"}</strong>
                <span>Pesha</span>
              </div>
            </div>
          </div>
        </header>

        <nav className="talento-player-tabs" aria-label="Seksionet e profilit">
          {["Përmbledhje", "Statistikat", "Media", "Karriera"].map((tab) => (
            <button
              type="button"
              key={tab}
              className={activeTab === tab ? "is-active" : ""}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </nav>

        {activeTab === "Përmbledhje" && (
          <>
            <section className="talento-player-about">
              <div>
                <h2>Rreth lojtarit</h2>
                <p>
                  {profile.bio || "Lojtar i përkushtuar që punon çdo ditë për të përmirësuar aftësitë e tij. I gatshëm të tregojë talentin e tij para scout-ëve dhe klubeve."}
                </p>
              </div>
              <div className={`talento-player-pitch talento-player-pitch--${pitchPosition.toLowerCase()}`} aria-hidden="true">
                <div className="talento-player-pitch-center" />
                <div className="talento-player-pitch-box talento-player-pitch-box-left" />
                <div className="talento-player-pitch-box talento-player-pitch-box-right" />
                <span />
              </div>
            </section>

            <section className="talento-player-statistics">
              <div className="talento-player-section-heading">
                <h2>Statistikat</h2>
                <span>{stats.season || "Sezoni aktual"}</span>
              </div>
              <div className="talento-player-stat-grid">
                {statItems.map(([key, label]) => (
                  <div key={key}>
                    <span>{label}</span>
                    <strong>{stats[key] || 0}</strong>
                  </div>
                ))}
              </div>
            </section>

            <section className="talento-player-club-card">
              <div className="talento-player-club-mark"><LuShield /></div>
              <div>
                <span>Klubi aktual</span>
                <h2>{club}</h2>
                <p>🇦🇱 {league}</p>
              </div>
            </section>

            <section className="talento-player-highlights">
              <div className="talento-player-section-heading"><h2>Highlights</h2></div>
              {videoEntries.length > 0 ? (
                <div className="talento-player-video-grid">
                  {videoEntries.map((video) => (
                    <div className="talento-player-video-wrap" key={video.id}>
                      <video src={video.url} controls className="talento-player-video" />
                    </div>
                  ))}
                </div>
              ) : (
                <button type="button" className="talento-player-empty-video" onClick={() => navigate("/edit-profile")}>
                  <LuPlay /><span>Ngarko highlight-in tënd të parë</span>
                </button>
              )}
            </section>
          </>
        )}

        {activeTab === "Statistikat" && (
          <section className="talento-player-tab-dashboard">
            <div className="talento-player-section-heading">
              <div><h2>Statistikat e sezonit</h2><span>{stats.season || "Sezoni aktual"}</span></div>
              <button type="button" onClick={() => navigate("/statistics")}><LuPencil /> Përditëso</button>
            </div>
            <div className="talento-player-detailed-stat-grid">
              {detailedStatItems.map(([key, label]) => (
                <div key={key}><span>{label}</span><strong>{stats[key] || 0}</strong></div>
              ))}
            </div>
          </section>
        )}

        {activeTab === "Media" && (
          <section className="talento-player-tab-dashboard">
            <div className="talento-player-section-heading"><h2>Video Highlights</h2></div>
            {videoEntries.length > 0 ? (
              <div className="talento-player-video-grid">
                {videoEntries.map((video) => (
                  <div className="talento-player-video-wrap" key={video.id}>
                    <video src={video.url} controls className="talento-player-video" />
                  </div>
                ))}
              </div>
            ) : (
              <button type="button" className="talento-player-empty-video" onClick={() => navigate("/edit-profile")}>
                <LuPlay /><span>Nuk ka video akoma. Kliko për të ngarkuar videon.</span>
              </button>
            )}
          </section>
        )}

        {activeTab === "Karriera" && (
          <section className="talento-player-tab-dashboard">
            <div className="talento-player-section-heading">
              <h2>Karriera</h2>
              <button type="button" onClick={openCareerModal}>
                <LuPlus /> Shto klub
              </button>
            </div>

            {careerEntries.length === 0 ? (
              <p className="talento-player-career-empty">
                Ende s'ke shtuar klube te karriera jote. Shto klubet ku ke luajtur (duke përfshirë klubin aktual) që të kesh një historik të plotë para scout-ëve.
              </p>
            ) : (
              careerEntries.map((entry) => (
                <div className="talento-player-career-entry" key={entry.id}>
                  <div className="talento-player-club-mark"><LuShield /></div>
                  <div>
                    <span>{entry.endYear ? "Ish klub" : "Klubi aktual"}</span>
                    <h3>{entry.club}</h3>
                    <p>{entry.league ? `🇦🇱 ${entry.league}` : "Kampionati nuk është vendosur"}</p>
                  </div>
                  <time>{entry.startYear} – {entry.endYear || "Aktual"}</time>
                  <button
                    type="button"
                    className="talento-player-career-delete"
                    onClick={() => deleteCareerEntry(entry.id)}
                    aria-label="Fshi këtë klub nga karriera"
                  >
                    <LuTrash2 />
                  </button>
                </div>
              ))
            )}
          </section>
        )}

        {showCareerModal && (
          <div className="talento-career-modal-backdrop" onClick={closeCareerModal}>
            <div className="talento-career-modal" onClick={(event) => event.stopPropagation()}>
              <div className="talento-career-modal-header">
                <h3>Shto klub te karriera</h3>
                <button type="button" onClick={closeCareerModal} aria-label="Mbyll">
                  <LuX />
                </button>
              </div>

              {careerError && <p className="talento-player-message is-error">{careerError}</p>}

              <form onSubmit={addCareerEntry} className="talento-career-form">
                <label>
                  Klubi
                  <input
                    value={careerForm.club}
                    onChange={(event) => setCareerForm((previous) => ({ ...previous, club: event.target.value }))}
                    placeholder="p.sh. Flamurtari FC"
                  />
                </label>

                <label>
                  Kampionati
                  <select
                    value={careerForm.league}
                    onChange={(event) => setCareerForm((previous) => ({ ...previous, league: event.target.value }))}
                  >
                    <option value="">Zgjidh kampionatin</option>
                    {LEAGUE_OPTIONS.map((leagueOption) => (
                      <option key={leagueOption} value={leagueOption}>
                        {leagueOption}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="talento-career-form-row">
                  <label>
                    Nga (viti)
                    <input
                      value={careerForm.startYear}
                      onChange={(event) => setCareerForm((previous) => ({ ...previous, startYear: event.target.value }))}
                      placeholder="2022"
                      inputMode="numeric"
                    />
                  </label>

                  <label>
                    Deri (viti)
                    <input
                      value={careerForm.endYear}
                      onChange={(event) => setCareerForm((previous) => ({ ...previous, endYear: event.target.value }))}
                      placeholder="Lëre bosh nëse je aktual"
                      inputMode="numeric"
                    />
                  </label>
                </div>

                <div className="talento-career-form-actions">
                  <button type="button" className="talento-career-form-cancel" onClick={closeCareerModal}>
                    Anulo
                  </button>
                  <button type="submit" className="talento-career-form-submit" disabled={savingCareer}>
                    {savingCareer ? "Duke ruajtur..." : "Shto klubin"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

export default Player_Dashboard;