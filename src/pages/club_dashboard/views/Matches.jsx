import { useState } from "react";
import { ref, push, set, update, remove } from "firebase/database";
import { db } from "../../../firebase/firebase";
import { LuPlus, LuX, LuTrash2, LuTrophy } from "react-icons/lu";
import Club_Crest from "../../../components/club_crest/Club_Crest";
import { formatDateShort } from "../../../utils/time";

function Matches({ clubUid, matches, setMatches, clubName, clubPhotoURL }) {
  const [tab, setTab] = useState("upcoming");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ opponent: "", date: "", time: "", location: "", isHome: true });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [resultMatchId, setResultMatchId] = useState(null);
  const [resultForm, setResultForm] = useState({ ourScore: "", opponentScore: "" });

  const matchList = Object.entries(matches || {})
    .map(([id, m]) => ({ id, ...m }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const upcomingMatches = matchList.filter((m) => m.status !== "played");
  const playedMatches = [...matchList.filter((m) => m.status === "played")].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  const visibleMatches = tab === "upcoming" ? upcomingMatches : playedMatches;

  const openModal = () => {
    setForm({ opponent: "", date: "", time: "", location: "", isHome: true });
    setError("");
    setShowModal(true);
  };

  const addMatch = async (e) => {
    e.preventDefault();

    if (!form.opponent.trim() || !form.date) {
      setError("Plotëso të paktën kundërshtarin dhe datën.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const matchRef = push(ref(db, `clubs/${clubUid}/matches`));
      const entry = {
        opponent: form.opponent.trim(),
        date: form.date,
        time: form.time,
        location: form.location.trim(),
        isHome: form.isHome,
        status: "upcoming",
        createdAt: Date.now(),
      };

      await set(matchRef, entry);
      setMatches((prev) => ({ ...prev, [matchRef.key]: entry }));
      setShowModal(false);
    } catch (saveError) {
      setError(saveError.message || "Ndeshja nuk u shtua dot.");
    } finally {
      setSaving(false);
    }
  };

  const deleteMatch = async (id) => {
    if (!window.confirm("Ta fshish këtë ndeshje?")) return;

    try {
      await remove(ref(db, `clubs/${clubUid}/matches/${id}`));
      setMatches((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch (error) {
      console.log(error.message);
    }
  };

  const openResultModal = (matchId) => {
    setResultForm({ ourScore: "", opponentScore: "" });
    setResultMatchId(matchId);
  };

  const saveResult = async (e) => {
    e.preventDefault();

    const ourScore = Number(resultForm.ourScore);
    const opponentScore = Number(resultForm.opponentScore);

    if (Number.isNaN(ourScore) || Number.isNaN(opponentScore)) return;

    try {
      await update(ref(db, `clubs/${clubUid}/matches/${resultMatchId}`), {
        status: "played",
        ourScore,
        opponentScore,
      });

      setMatches((prev) => ({
        ...prev,
        [resultMatchId]: { ...prev[resultMatchId], status: "played", ourScore, opponentScore },
      }));

      setResultMatchId(null);
    } catch (error) {
      console.log(error.message);
    }
  };

  return (
    <>
      <div className="club-header">
        <div>
          <h1>Ndeshjet</h1>
          <p>Kalendari i ndeshjeve të klubit.</p>
        </div>

        <button type="button" className="club-btn-primary" onClick={openModal}>
          <LuPlus /> Shto Ndeshje
        </button>
      </div>

      <div className="club-match-tabs">
        <button type="button" className={tab === "upcoming" ? "is-active" : ""} onClick={() => setTab("upcoming")}>
          Të Ardhshme
        </button>
        <button type="button" className={tab === "played" ? "is-active" : ""} onClick={() => setTab("played")}>
          Të Luajtura
        </button>
      </div>

      {visibleMatches.length === 0 ? (
        <p className="club-empty">Nuk ka ndeshje në këtë kategori.</p>
      ) : (
        visibleMatches.map((m) => {
          const homeTeam = m.isHome ? { name: clubName, logo: clubPhotoURL } : { name: m.opponent, logo: null };
          const awayTeam = m.isHome ? { name: m.opponent, logo: null } : { name: clubName, logo: clubPhotoURL };

          return (
            <div className="club-match-card" key={m.id}>
              <div className="club-match-date-badge">
                <strong>{formatDateShort(m.date).split(" ")[0]}</strong>
                <span>{formatDateShort(m.date).split(" ")[1]}</span>
              </div>

              <div className="club-match-teams">
                <div className="club-match-team">
                  <div className="club-match-team-mark">
                    {homeTeam.logo ? <img src={homeTeam.logo} alt={homeTeam.name} style={{ width: "100%", height: "100%", borderRadius: 10, objectFit: "cover" }} /> : <Club_Crest name={homeTeam.name} />}
                  </div>
                  <span>{homeTeam.name}</span>
                </div>

                {m.status === "played" ? (
                  <span className="club-match-score">
                    {m.isHome ? `${m.ourScore} - ${m.opponentScore}` : `${m.opponentScore} - ${m.ourScore}`}
                  </span>
                ) : (
                  <span className="club-match-vs">VS</span>
                )}

                <div className="club-match-team">
                  <div className="club-match-team-mark">
                    {awayTeam.logo ? <img src={awayTeam.logo} alt={awayTeam.name} style={{ width: "100%", height: "100%", borderRadius: 10, objectFit: "cover" }} /> : <Club_Crest name={awayTeam.name} />}
                  </div>
                  <span>{awayTeam.name}</span>
                </div>
              </div>

              <div className="club-match-meta">
                {m.time ? `${m.time} · ` : ""}
                {m.location || "Vendi nuk është vendosur"}
              </div>

              <div className="club-match-actions">
                {m.status !== "played" && (
                  <button type="button" className="club-icon-btn" title="Shëno rezultatin" onClick={() => openResultModal(m.id)}>
                    <LuTrophy />
                  </button>
                )}
                <button type="button" className="club-icon-btn danger" onClick={() => deleteMatch(m.id)}>
                  <LuTrash2 />
                </button>
              </div>
            </div>
          );
        })
      )}

      {showModal && (
        <div className="club-modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="club-modal" onClick={(e) => e.stopPropagation()}>
            <div className="club-modal-header">
              <h3>Shto Ndeshje</h3>
              <button type="button" onClick={() => setShowModal(false)} aria-label="Mbyll">
                <LuX />
              </button>
            </div>

            {error && <p className="club-form-error">{error}</p>}

            <form onSubmit={addMatch}>
              <div className="club-form-group">
                <label>Kundërshtari</label>
                <input
                  value={form.opponent}
                  onChange={(e) => setForm((p) => ({ ...p, opponent: e.target.value }))}
                  placeholder="p.sh. RIVAL FC"
                />
              </div>

              <div className="club-form-row">
                <div className="club-form-group">
                  <label>Data</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                  />
                </div>

                <div className="club-form-group">
                  <label>Ora</label>
                  <input
                    type="time"
                    value={form.time}
                    onChange={(e) => setForm((p) => ({ ...p, time: e.target.value }))}
                  />
                </div>
              </div>

              <div className="club-form-group">
                <label>Vendi</label>
                <input
                  value={form.location}
                  onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                  placeholder="p.sh. Stadiumi i Qytetit"
                />
              </div>

              <label className="club-form-checkbox">
                <input
                  type="checkbox"
                  checked={form.isHome}
                  onChange={(e) => setForm((p) => ({ ...p, isHome: e.target.checked }))}
                />
                Ndeshje në shtëpi
              </label>

              <div className="club-form-actions">
                <button type="button" className="club-form-cancel" onClick={() => setShowModal(false)}>
                  Anulo
                </button>
                <button type="submit" className="club-btn-primary" disabled={saving}>
                  {saving ? "Duke ruajtur..." : "Shto Ndeshjen"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {resultMatchId && (
        <div className="club-modal-backdrop" onClick={() => setResultMatchId(null)}>
          <div className="club-modal" onClick={(e) => e.stopPropagation()}>
            <div className="club-modal-header">
              <h3>Shëno Rezultatin</h3>
              <button type="button" onClick={() => setResultMatchId(null)} aria-label="Mbyll">
                <LuX />
              </button>
            </div>

            <form onSubmit={saveResult}>
              <div className="club-form-row">
                <div className="club-form-group">
                  <label>Golat tona</label>
                  <input
                    type="number"
                    min="0"
                    value={resultForm.ourScore}
                    onChange={(e) => setResultForm((p) => ({ ...p, ourScore: e.target.value }))}
                  />
                </div>

                <div className="club-form-group">
                  <label>Golat kundërshtare</label>
                  <input
                    type="number"
                    min="0"
                    value={resultForm.opponentScore}
                    onChange={(e) => setResultForm((p) => ({ ...p, opponentScore: e.target.value }))}
                  />
                </div>
              </div>

              <div className="club-form-actions">
                <button type="button" className="club-form-cancel" onClick={() => setResultMatchId(null)}>
                  Anulo
                </button>
                <button type="submit" className="club-btn-primary">
                  Ruaj Rezultatin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default Matches;
