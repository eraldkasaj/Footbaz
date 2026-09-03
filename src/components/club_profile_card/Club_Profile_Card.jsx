import { useState } from "react";
import "./Club_Profile_Card.css";
import { Link } from "react-router-dom";
import {
  LuMapPin,
  LuCalendarDays,
  LuListOrdered,
  LuPhone,
  LuUsers,
  LuGlobe,
  LuArrowUpDown,
  LuArrowUp,
  LuArrowDown,
} from "react-icons/lu";
import { getPlayerAge, formatBirthdate } from "../../utils/age";
import { getNationalityFlag } from "../../utils/nationality";
import { getPositionName, comparePositions, getPositionGroup } from "../../utils/position";
import { computeStandings } from "../../utils/standings";
import defaultPlayerAvatar from "../../assets/images/avatar-player.png";
import Club_Crest from "../club_crest/Club_Crest";
import Club_Claim_Form from "../club_claim/Club_Claim_Form";

// Nxjerr grupmoshën nga emri i ligës (p.sh. "U-17 Abissnet Superiore" -> "U17"),
// që emri i klubit të dallojë ekipet e të njëjtit klub nëpër mosha të ndryshme
// (p.sh. "Apolonia U17" te U-17 Abissnet Superiore vs "Apolonia U19" te U-19).
function getClubAgeTag(league) {
  const match = league?.match(/U-?(\d{1,2})/i);
  return match ? `U${match[1]}` : null;
}

function Club_Profile_Card({ club, squadPlayers, squadStats, standing }) {
  const profile = club.profile || {};
  const location = [profile.city, profile.country].filter(Boolean).join(", ");
  const ageTag = getClubAgeTag(profile.league);
  const displayName = ageTag ? `${profile.name || "Klub"} ${ageTag}` : profile.name || "Klub";

  const { squadSize = 0, avgAge = null, foreigners = 0 } = squadStats || {};
  const foreignersPct = squadSize > 0 ? Math.round((foreigners / squadSize) * 100) : null;

  const [activeTab, setActiveTab] = useState("overview");
  const [sortBy, setSortBy] = useState(null);
  const [sortDir, setSortDir] = useState("asc");

  const toggleSort = (column) => {
    if (sortBy === column) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortDir("asc");
    }
  };

  const sortableFields = {
    age: (player) => getPlayerAge(player.profile || {}) ?? -1,
    nationality: (player) => (player.profile?.nationality || "").toLowerCase(),
    height: (player) => Number(player.profile?.height) || 0,
    foot: (player) => (player.profile?.dominantFoot || "").toLowerCase(),
  };

  // Pa renditje të zgjedhur, radha e parazgjedhur mbetet taktike: portier ->
  // mbrojtje -> mesfushë -> sulm.
  const sortedSquad = sortBy
    ? [...(squadPlayers || [])].sort((a, b) => {
        const getValue = sortableFields[sortBy];
        const valueA = getValue(a);
        const valueB = getValue(b);
        const direction = sortDir === "asc" ? 1 : -1;

        if (valueA < valueB) return -1 * direction;
        if (valueA > valueB) return 1 * direction;
        return 0;
      })
    : [...(squadPlayers || [])].sort((a, b) =>
        comparePositions(a.profile?.position, b.profile?.position)
      );

  const renderSortIcon = (column) => {
    if (sortBy !== column) return <LuArrowUpDown className="club-squad-sort-icon" />;
    return sortDir === "asc" ? (
      <LuArrowUp className="club-squad-sort-icon active" />
    ) : (
      <LuArrowDown className="club-squad-sort-icon active" />
    );
  };

  // Rekordi i klubit (fitore/barazime/humbje, gola, forma) — e njëjta llogaritje
  // si te tabela e ligës, thjesht për një klub të vetëm.
  const clubRecord = computeStandings([club])[0];

  // Golashënuesit e skuadrës — nga statistikat e vetë-raportuara të lojtarëve.
  const topScorers = (squadPlayers || [])
    .map((player) => ({
      uid: player.uid,
      name: [player.profile?.name, player.profile?.surname].filter(Boolean).join(" ") || "Lojtar",
      photoURL: player.profile?.photoURL,
      matches: Number(player.statistics?.matches) || 0,
      goals: Number(player.statistics?.goals) || 0,
      assists: Number(player.statistics?.assists) || 0,
      yellowCards: Number(player.statistics?.yellowCards) || 0,
      redCards: Number(player.statistics?.redCards) || 0,
    }))
    .filter((player) => player.goals > 0 || player.assists > 0)
    .sort((a, b) => b.goals + b.assists - (a.goals + a.assists));

  return (
    <div className="club-profile-card">
      <div className="club-profile-top">
        <div className="club-profile-logo">
          {profile.photoURL ? (
            <img src={profile.photoURL} alt={profile.name} />
          ) : (
            <Club_Crest name={profile.name} seed={club.uid} />
          )}
        </div>

        <div className="club-profile-info">
          <h1>{displayName}</h1>
          <span className="club-profile-league">
            {profile.league || "Kampionati nuk është vendosur"}
          </span>
          <div className="club-profile-details">
            <div className="club-detail-card">
              <LuUsers />
              <div>
                <span>Madhësia e skuadrës</span>
                <h3>{squadSize || "—"}</h3>
              </div>
            </div>

            <div className="club-detail-card">
              <LuCalendarDays />
              <div>
                <span>Mosha mesatare</span>
                <h3>{avgAge !== null ? avgAge.toFixed(1) : "—"}</h3>
              </div>
            </div>

            <div className="club-detail-card">
              <LuGlobe />
              <div>
                <span>Të huaj</span>
                <h3>{squadSize ? `${foreigners} (${foreignersPct}%)` : "—"}</h3>
              </div>
            </div>

            <div className="club-detail-card">
              <LuMapPin />
              <div>
                <span>Vendndodhja</span>
                <h3>{location || "—"}</h3>
              </div>
            </div>

            {standing && (
              <div className="club-detail-card">
                <LuListOrdered />
                <div>
                  <span>Pozicioni në tabelë</span>
                  <h3>{standing.position ? `#${standing.position}` : "—"}</h3>
                </div>
              </div>
            )}

            {profile.contactPhone && (
              <div className="club-detail-card">
                <LuPhone />
                <div>
                  <span>Telefon</span>
                  <h3>{profile.contactPhone}</h3>
                </div>
              </div>
            )}
          </div>

          {/* Klube të shtuara nga admini (ende pa "ownerUid") mund të
              "kërkohen" nga një përfaqësues real i klubit — klubet e
              vet-regjistruara e kanë ownerUid të vendosur që në krijim. */}
          {!club.ownerUid && (
            <Club_Claim_Form clubId={club.uid} clubName={displayName} />
          )}
        </div>
      </div>

      <div className="club-tabs">
        <button
          type="button"
          className={activeTab === "overview" ? "club-tab active" : "club-tab"}
          onClick={() => setActiveTab("overview")}
        >
          Përmbledhje
        </button>
        <button
          type="button"
          className={activeTab === "squad" ? "club-tab active" : "club-tab"}
          onClick={() => setActiveTab("squad")}
        >
          Skuadra
        </button>
        <button
          type="button"
          className={activeTab === "stats" ? "club-tab active" : "club-tab"}
          onClick={() => setActiveTab("stats")}
        >
          Statistikat
        </button>
      </div>

      {activeTab === "overview" && (
        <div className="club-tab-panel">
          <div className="club-record-grid">
            <div className="club-record-card">
              <h3>{clubRecord.played}</h3>
              <span>Ndeshje</span>
            </div>
            <div className="club-record-card">
              <h3>{clubRecord.wins}</h3>
              <span>Fitore</span>
            </div>
            <div className="club-record-card">
              <h3>{clubRecord.draws}</h3>
              <span>Barazime</span>
            </div>
            <div className="club-record-card">
              <h3>{clubRecord.losses}</h3>
              <span>Humbje</span>
            </div>
          </div>

          <div className="club-overview-row">
            <div className="club-overview-panel">
              <h4>Golat</h4>
              <div className="club-goals-row">
                <div>
                  <strong>{clubRecord.goalsFor}</strong>
                  <span>Të shënuara</span>
                </div>
                <div>
                  <strong>{clubRecord.goalsAgainst}</strong>
                  <span>Të pësuara</span>
                </div>
                <div>
                  <strong>{clubRecord.goalDiff > 0 ? `+${clubRecord.goalDiff}` : clubRecord.goalDiff}</strong>
                  <span>Diferenca</span>
                </div>
              </div>
            </div>

            <div className="club-overview-panel">
              <h4>Forma e fundit</h4>
              {clubRecord.form.length === 0 ? (
                <p className="club-squad-empty">Ende s'ka ndeshje të luajtura.</p>
              ) : (
                <div className="club-form-badges">
                  {clubRecord.form.map((result, index) => (
                    <span key={index} className={`club-form-badge club-form-badge--${result}`}>
                      {result}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "squad" && (
        <div className="club-tab-panel">
          {!squadPlayers || squadPlayers.length === 0 ? (
            <p className="club-squad-empty">Ende s'ka lojtarë të shtuar në skuadër.</p>
          ) : (
            <div className="club-squad-table-scroll">
              <table className="club-squad-table">
                <thead>
                  <tr>
                    <th className="club-squad-rank">#</th>
                    <th>Lojtari</th>
                    <th
                      className="club-squad-center club-squad-sortable"
                      onClick={() => toggleSort("age")}
                    >
                      Datëlindja/Mosha {renderSortIcon("age")}
                    </th>
                    <th
                      className="club-squad-center club-squad-sortable"
                      onClick={() => toggleSort("nationality")}
                    >
                      Komb. {renderSortIcon("nationality")}
                    </th>
                    <th
                      className="club-squad-center club-squad-sortable"
                      onClick={() => toggleSort("height")}
                    >
                      Lartësia {renderSortIcon("height")}
                    </th>
                    <th
                      className="club-squad-center club-squad-sortable"
                      onClick={() => toggleSort("foot")}
                    >
                      Këmba {renderSortIcon("foot")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedSquad.map((player, index) => {
                    const playerProfile = player.profile || {};
                    const fullName =
                      [playerProfile.name, playerProfile.surname].filter(Boolean).join(" ") || "Lojtar";
                    const birthdate = playerProfile.birthdate || playerProfile.dateOfBirth;
                    const age = getPlayerAge(playerProfile);
                    const positionGroup = getPositionGroup(playerProfile.position);
                    const footLabel =
                      playerProfile.dominantFoot === "Right"
                        ? "E djathtë"
                        : playerProfile.dominantFoot === "Left"
                        ? "E majtë"
                        : playerProfile.dominantFoot === "Both"
                        ? "Të dyja"
                        : "—";

                    return (
                      <tr
                        key={player.uid}
                        className={positionGroup ? `club-squad-row--${positionGroup}` : ""}
                      >
                        <td className="club-squad-rank">{index + 1}</td>
                        <td>
                          <Link to={`/players/${player.uid}`} className="club-squad-player-link">
                            <span className="club-squad-photo">
                              <img
                                src={playerProfile.photoURL || defaultPlayerAvatar}
                                alt={fullName}
                              />
                            </span>
                            <span>
                              <strong>{fullName}</strong>
                              <small className={positionGroup ? `club-squad-position--${positionGroup}` : ""}>
                                {getPositionName(playerProfile.position)}
                              </small>
                            </span>
                          </Link>
                        </td>
                        <td className="club-squad-center">
                          {birthdate ? formatBirthdate(birthdate) : "—"}
                          {age !== null ? ` (${age})` : ""}
                        </td>
                        <td className="club-squad-center">
                          {getNationalityFlag(playerProfile.nationality) || "—"}
                        </td>
                        <td className="club-squad-center">
                          {playerProfile.height ? `${playerProfile.height} cm` : "—"}
                        </td>
                        <td className="club-squad-center">{footLabel}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "stats" && (
        <div className="club-tab-panel">
          {topScorers.length === 0 ? (
            <p className="club-squad-empty">Ende s'ka gola apo asistime të regjistruara në këtë skuadër.</p>
          ) : (
            <div className="club-squad-table-scroll">
              <table className="club-squad-table">
                <thead>
                  <tr>
                    <th className="club-squad-rank">#</th>
                    <th>Lojtari</th>
                    <th className="club-squad-center">Ndeshje</th>
                    <th className="club-squad-center">Gola</th>
                    <th className="club-squad-center">Asistime</th>
                    <th className="club-squad-center">Kart. Verdhë</th>
                    <th className="club-squad-center">Kart. Kuq</th>
                  </tr>
                </thead>
                <tbody>
                  {topScorers.map((player, index) => (
                    <tr key={player.uid}>
                      <td className="club-squad-rank">{index + 1}</td>
                      <td>
                        <Link to={`/players/${player.uid}`} className="club-squad-player-link">
                          <span className="club-squad-photo">
                            <img src={player.photoURL || defaultPlayerAvatar} alt={player.name} />
                          </span>
                          <span>
                            <strong>{player.name}</strong>
                          </span>
                        </Link>
                      </td>
                      <td className="club-squad-center">{player.matches}</td>
                      <td className="club-squad-center club-squad-points">{player.goals}</td>
                      <td className="club-squad-center">{player.assists}</td>
                      <td className="club-squad-center club-squad-card--yellow">{player.yellowCards}</td>
                      <td className="club-squad-center club-squad-card--red">{player.redCards}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Club_Profile_Card;
