import { useState } from "react";
import Club_Crest from "../../../components/club_crest/Club_Crest";
import { formatDateShort } from "../../../utils/time";

// Vetëm-lexim: ndeshjet/rezultatet vijnë automatikisht nga FSHF (shih
// scripts/fshf-sync.cjs), jo më nga klubi dorazi. Aldi vendosi eksplicitisht
// që klubet të mos kenë mundësi ta shtojnë/modifikojnë vetë kalendarin —
// FSHF është burimi i vetëm i së vërtetës që të mos ketë rezultate të
// gabuara/vetë-raportuara.
function Matches({ matches, clubName, clubPhotoURL }) {
  const [tab, setTab] = useState("upcoming");

  const matchList = Object.entries(matches || {})
    .map(([id, m]) => ({ id, ...m }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const upcomingMatches = matchList.filter((m) => m.status !== "played");
  const playedMatches = [...matchList.filter((m) => m.status === "played")].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  const visibleMatches = tab === "upcoming" ? upcomingMatches : playedMatches;

  return (
    <>
      <div className="club-header">
        <div>
          <h1>Ndeshjet</h1>
          <p>Kalendari i ndeshjeve të klubit, sinkronizuar automatikisht nga FSHF.</p>
        </div>
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
        <p className="club-empty">
          {tab === "upcoming"
            ? "Nuk ka ndeshje të ardhshme të njoftuara ende nga FSHF."
            : "Ende s'ka ndeshje të luajtura të sinkronizuara."}
        </p>
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
            </div>
          );
        })
      )}
    </>
  );
}

export default Matches;
