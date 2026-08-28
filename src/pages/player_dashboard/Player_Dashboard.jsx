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
// Kept in a shared file so Edit Profile (current league) and this file's
// career modal (historical league per club) use the exact same list.
import { LEAGUE_OPTIONS } from "../../data/leagues";
import Club_Crest from "../../components/club_crest/Club_Crest";

const statItems = [
  ["matches", "Ndeshje"],
  ["goals", "Gola"],
  ["assists", "Asist"],
  ["yellowCards", "Kartona të verdhë"],
  ["redCards", "Kartona të kuq"],
];

const detailedStatItems = [...statItems, ["minutes", "Minuta të luajtura"]];

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
    // parseInt (not Number) so a malformed value like "2025-2026" still sorts
    // by its leading year (2025) instead of falling back to 0 and sinking to
    // the bottom. Newest club first, oldest last.
    .sort((a, b) => (parseInt(b.startYear, 10) || 0) - (parseInt(a.startYear, 10) || 0));

  // Klubi aktual dhe kampionati vendosen te Edito Profilin (profile.club /
  // profile.league). Për llogaritë e vjetra që e kishin vendosur klubin
  // vetëm duke shtuar një zë karriere pa datë mbarimi (para se të kishte
  // fusha të dedikuara), bie fallback te ai zë — kështu askush s'e humb
  // klubin që kishte vendosur më parë.
  const currentCareerEntry = careerEntries.find((entry) => !entry.endYear);
  const club = profile.club || currentCareerEntry?.club || "";
  const league = profile.league || currentCareerEntry?.league || "Superliga Shqiptare U-19";

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

            <p className="talento-player-club">
              {club ? (
                <><span className="talento-player-club-icon"><Club_Crest name={club} seed={profile.clubId} size={18} /></span> {club}</>
              ) : (
                <><LuShield /> Klubi nuk është vendosur</>
              )}
            </p>
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
              <div className="talento-player-club-mark">{club ? <Club_Crest name={club} seed={profile.clubId} size={34} /> : <LuShield />}</div>
              <div>
                <span>Klubi aktual</span>
                <h2>{club || "Klubi nuk është vendosur"}</h2>
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
                  <div className="talento-player-club-mark"><Club_Crest name={entry.club} seed={entry.clubId} size={34} /></div>
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
                      onChange={(event) => setCareerForm((previous) => ({ ...previous, startYear: event.target.value.replace(/\D/g, "").slice(0, 4) }))}
                      placeholder="2022"
                      inputMode="numeric"
                      maxLength={4}
                    />
                  </label>

                  <label>
                    Deri (viti)
                    <input
                      value={careerForm.endYear}
                      onChange={(event) => setCareerForm((previous) => ({ ...previous, endYear: event.target.value.replace(/\D/g, "").slice(0, 4) }))}
                      placeholder="Lëre bosh nëse je aktual"
                      inputMode="numeric"
                      maxLength={4}
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