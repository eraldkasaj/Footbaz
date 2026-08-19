import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Navbar from "../../components/navbar/Navbar";
import Club_Crest from "../../components/club_crest/Club_Crest";
import "./League_Clubs.css";
import { db } from "../../firebase/firebase";
import { ref, get } from "firebase/database";
import {
  LuArrowLeft,
  LuShield,
  LuChevronRight,
  LuUsers,
  LuShieldHalf,
  LuCalendarDays,
  LuArrowUpDown,
  LuArrowUp,
  LuArrowDown,
} from "react-icons/lu";
import { getPlayerAge } from "../../utils/age";
import { getNationalityFlag } from "../../utils/nationality";
import { formatDateShort } from "../../utils/time";
import { getSquadPlayers, computeSquadStats } from "../../utils/squad";
import { computeStandings } from "../../utils/standings";

function League_Clubs() {
  const { league: leagueParam } = useParams();
  const league = decodeURIComponent(leagueParam);

  const [clubs, setClubs] = useState([]);
  const [playerCount, setPlayerCount] = useState(0);
  const [averageAge, setAverageAge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [sortBy, setSortBy] = useState(null);
  const [sortDir, setSortDir] = useState("desc");

  const toggleSort = (column) => {
    if (sortBy === column) {
      setSortDir((prev) => (prev === "desc" ? "asc" : "desc"));
    } else {
      setSortBy(column);
      setSortDir("desc");
    }
  };

  useEffect(() => {
    const getLeagueData = async () => {
      const [clubsSnapshot, playersSnapshot] = await Promise.all([
        get(ref(db, "clubs")),
        get(ref(db, "players")),
      ]);

      const playersById = playersSnapshot.exists() ? playersSnapshot.val() : {};

      if (clubsSnapshot.exists()) {
        const data = clubsSnapshot.val();

        const clubsArray = Object.keys(data)
          .map((uid) => ({ uid, ...data[uid] }))
          .filter((club) => club.profile?.league === league)
          .map((club) => {
            const squadPlayers = getSquadPlayers(club, playersById);
            const { squadSize, avgAge, foreigners } = computeSquadStats(squadPlayers);

            return {
              ...club,
              squadPlayers,
              squadSize,
              avgAge,
              foreigners,
            };
          });

        setClubs(clubsArray);

        // Statistikat lart (Lojtarë, Mosha mesatare) llogariten nga i njëjti
        // burim si kolona "Skuadra" — lojtarë realë të lidhur me rosterin e
        // një klubi të këtij kampionati — që të mos bien ndesh me tabelën
        // poshtë (p.sh. të tregojnë lojtarë kur çdo klub ka "—" te Skuadra).
        const allSquadPlayers = clubsArray.flatMap((club) => club.squadPlayers);

        setPlayerCount(allSquadPlayers.length);

        const allAges = allSquadPlayers
          .map((player) => getPlayerAge(player.profile))
          .filter((value) => value !== null);

        setAverageAge(
          allAges.length > 0 ? allAges.reduce((sum, value) => sum + value, 0) / allAges.length : null
        );
      }

      setLoading(false);
    };

    getLeagueData();
  }, [league]);

  const sortableFields = {
    squad: (club) => club.squadSize || 0,
    age: (club) => (club.avgAge !== null ? club.avgAge : -1),
    foreigners: (club) => (club.squadSize ? club.foreigners : -1),
  };

  const sortedClubs = useMemo(() => {
    if (!sortBy) return clubs;

    const getValue = sortableFields[sortBy];
    const direction = sortDir === "asc" ? 1 : -1;

    return [...clubs].sort((a, b) => (getValue(a) - getValue(b)) * direction);
  }, [clubs, sortBy, sortDir]);

  const renderSortIcon = (column) => {
    if (sortBy !== column) return <LuArrowUpDown className="league-clubs-sort-icon" />;
    return sortDir === "asc" ? (
      <LuArrowUp className="league-clubs-sort-icon active" />
    ) : (
      <LuArrowDown className="league-clubs-sort-icon active" />
    );
  };

  // Tabela e klasifikimit, njësoj si te Statistikat e Club Dashboard.
  const standings = useMemo(() => computeStandings(clubs), [clubs]);

  // Golashënuesit — nga statistikat e vetë-raportuara të lojtarëve
  // (players/{uid}/statistics/goals, plotësuar te faqja "Statistikat" e
  // lojtarit), vetëm për lojtarët në rosterin e klubeve të këtij kampionati.
  const topScorers = useMemo(() => {
    return clubs
      .flatMap((club) =>
        club.squadPlayers.map((player) => ({
          uid: player.uid,
          name: [player.profile?.name, player.profile?.surname].filter(Boolean).join(" ") || "Lojtar",
          nationality: player.profile?.nationality,
          photoURL: player.profile?.photoURL,
          clubName: club.profile?.name || "Klub",
          goals: Number(player.statistics?.goals) || 0,
        }))
      )
      .filter((player) => player.goals > 0)
      .sort((a, b) => b.goals - a.goals)
      .slice(0, 10);
  }, [clubs]);

  // Ndeshjet e kampionatit — kombinon ndeshjet e vetë-raportuara nga çdo klub
  // (clubs/{uid}/matches), të luajtura dhe të ardhshme, renditur sipas datës.
  // Meqë kundërshtari ruhet si tekst i lirë (jo referencë te një klub tjetër),
  // e njëjta ndeshje mund të shfaqet dy herë nëse të dy klubet e regjistrojnë
  // veçmas (p.sh. që të dyja të kenë statistika te Tabela) — i dedupojmë këtu
  // për shfaqje, duke mbajtur vetëm rastin e parë për çdo (datë + dy ekipet).
  const allLeagueMatches = useMemo(() => {
    const combined = clubs
      .flatMap((club) =>
        Object.values(club.matches || {}).map((match) => ({
          ...match,
          clubName: club.profile?.name || "Klub",
          clubPhotoURL: club.profile?.photoURL,
        }))
      )
      .filter((match) => match.date)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    const seen = new Set();
    return combined.filter((match) => {
      const home = match.isHome ? match.clubName : match.opponent;
      const away = match.isHome ? match.opponent : match.clubName;
      const key = [match.date, [home, away].sort().join("|")].join("::");

      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [clubs]);

  const leagueMatches = useMemo(() => allLeagueMatches.slice(0, 8), [allLeagueMatches]);

  return (
    <>
      <Navbar />

      <section className="league-clubs-page">
        <div className="league-clubs-header">
          <div className="league-clubs-header-left">
            <Link to="/clubs" className="league-clubs-back">
              <LuArrowLeft /> Kampionatet
            </Link>

            <h1>{league}</h1>

            {!loading && (
              <div className="league-clubs-stats">
                <div className="league-clubs-stat">
                  <LuShieldHalf />
                  <div>
                    <strong>{clubs.length}</strong>
                    <span>Ekipe</span>
                  </div>
                </div>

                <div className="league-clubs-stat">
                  <LuUsers />
                  <div>
                    <strong>{playerCount}</strong>
                    <span>Lojtarë</span>
                  </div>
                </div>

                <div className="league-clubs-stat">
                  <LuCalendarDays />
                  <div>
                    <strong>{averageAge !== null ? averageAge.toFixed(1) : "—"}</strong>
                    <span>Mosha mesatare</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {!loading && (
            <div className="league-clubs-header-right">
              <div className="league-clubs-matches-panel">
                <h2>Ndeshjet</h2>

                {leagueMatches.length === 0 ? (
                  <p className="league-clubs-matches-empty">Ende s'ka ndeshje të regjistruara.</p>
                ) : (
                  <div className="league-clubs-matches-list">
                    <div className="league-clubs-match-header-row">
                      <span className="league-clubs-match-date"></span>
                      <span className="league-clubs-match-teams league-clubs-match-teams-header">
                        <span>Ekipi Vendas</span>
                        <span></span>
                        <span>Ekipi Mysafir</span>
                      </span>
                    </div>

                    {leagueMatches.map((match, index) => {
                      const homeTeam = match.isHome ? match.clubName : match.opponent;
                      const awayTeam = match.isHome ? match.opponent : match.clubName;
                      const played = match.status === "played";
                      const result = played
                        ? match.isHome
                          ? `${match.ourScore} - ${match.opponentScore}`
                          : `${match.opponentScore} - ${match.ourScore}`
                        : match.time || "—";

                      return (
                        <div className="league-clubs-match-row" key={index}>
                          <span className="league-clubs-match-date">{formatDateShort(match.date)}</span>
                          <span className="league-clubs-match-teams">
                            <span>{homeTeam}</span>
                            <span className={played ? "league-clubs-match-result" : "league-clubs-match-time"}>
                              {result}
                            </span>
                            <span>{awayTeam}</span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {loading && <p className="league-clubs-empty">Duke ngarkuar klubet...</p>}

        {!loading && clubs.length === 0 && (
          <p className="league-clubs-empty">
            Ende s'ka klube të regjistruara në këtë kampionat.
          </p>
        )}

        {!loading && clubs.length > 0 && (
          <div className="league-clubs-table-wrap">
            <div className="league-clubs-tabs">
              <button
                type="button"
                className={activeTab === "overview" ? "league-clubs-tab active" : "league-clubs-tab"}
                onClick={() => setActiveTab("overview")}
              >
                Përmbledhje
              </button>
              <button
                type="button"
                className={activeTab === "table" ? "league-clubs-tab active" : "league-clubs-tab"}
                onClick={() => setActiveTab("table")}
              >
                Tabela
              </button>
              <button
                type="button"
                className={activeTab === "scorers" ? "league-clubs-tab active" : "league-clubs-tab"}
                onClick={() => setActiveTab("scorers")}
              >
                Golashënuesit
              </button>
              <button
                type="button"
                className={activeTab === "matches" ? "league-clubs-tab active" : "league-clubs-tab"}
                onClick={() => setActiveTab("matches")}
              >
                Ndeshjet
              </button>
            </div>

            {activeTab === "overview" && (
              <div className="league-clubs-table-scroll">
              <table className="league-clubs-table league-clubs-table--overview">
                <thead>
                  <tr>
                    <th className="league-clubs-rank">#</th>
                    <th className="league-clubs-club">Klub</th>
                    <th className="league-clubs-numeric league-clubs-sortable" onClick={() => toggleSort("squad")}>
                      Skuadra {renderSortIcon("squad")}
                    </th>
                    <th className="league-clubs-numeric league-clubs-sortable" onClick={() => toggleSort("age")}>
                      Mosha mes. {renderSortIcon("age")}
                    </th>
                    <th className="league-clubs-numeric league-clubs-sortable" onClick={() => toggleSort("foreigners")}>
                      Të huaj {renderSortIcon("foreigners")}
                    </th>
                    <th>Qyteti</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {sortedClubs.map((club, index) => {
                    const profile = club.profile || {};
                    const location = [profile.city, profile.country]
                      .filter(Boolean)
                      .join(", ");

                    return (
                      <tr key={club.uid}>
                        <td className="league-clubs-rank">{index + 1}</td>
                        <td className="league-clubs-club">
                          <Link to={`/clubs/${club.uid}`} className="league-clubs-club-link">
                            <span className="league-clubs-logo">
                              {profile.photoURL ? (
                                <img src={profile.photoURL} alt={profile.name} />
                              ) : (
                                <Club_Crest name={profile.name} seed={club.uid} />
                              )}
                            </span>
                            <span>{profile.name || "Klub"}</span>
                          </Link>
                        </td>
                        <td className="league-clubs-numeric">{club.squadSize || "—"}</td>
                        <td className="league-clubs-numeric">
                          {club.avgAge !== null ? club.avgAge.toFixed(1) : "—"}
                        </td>
                        <td className="league-clubs-numeric">{club.squadSize ? club.foreigners : "—"}</td>
                        <td className="league-clubs-city">{location || "—"}</td>
                        <td className="league-clubs-action">
                          <Link to={`/clubs/${club.uid}`}>
                            <LuChevronRight />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>
            )}

            {activeTab === "table" && (
              <div className="league-clubs-table-scroll">
              <table className="league-clubs-table league-clubs-table--standings">
                <thead>
                  <tr>
                    <th className="league-clubs-rank">#</th>
                    <th className="league-clubs-club">Klub</th>
                    <th className="league-clubs-numeric">Nr</th>
                    <th className="league-clubs-numeric">F</th>
                    <th className="league-clubs-numeric">B</th>
                    <th className="league-clubs-numeric">H</th>
                    <th className="league-clubs-numeric">Gola</th>
                    <th className="league-clubs-numeric">+/-</th>
                    <th className="league-clubs-numeric">Pikë</th>
                    <th className="league-clubs-form-header">Forma</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((club, index) => {
                    const profile = club.profile || {};

                    return (
                      <tr key={club.uid}>
                        <td className="league-clubs-rank">{index + 1}</td>
                        <td className="league-clubs-club">
                          <Link to={`/clubs/${club.uid}`} className="league-clubs-club-link">
                            <span className="league-clubs-logo">
                              {profile.photoURL ? (
                                <img src={profile.photoURL} alt={profile.name} />
                              ) : (
                                <Club_Crest name={profile.name} seed={club.uid} />
                              )}
                            </span>
                            <span>{profile.name || "Klub"}</span>
                          </Link>
                        </td>
                        <td className="league-clubs-numeric">{club.played}</td>
                        <td className="league-clubs-numeric">{club.wins}</td>
                        <td className="league-clubs-numeric">{club.draws}</td>
                        <td className="league-clubs-numeric">{club.losses}</td>
                        <td className="league-clubs-numeric">{club.goalsFor}:{club.goalsAgainst}</td>
                        <td className="league-clubs-numeric">{club.goalDiff}</td>
                        <td className="league-clubs-numeric league-clubs-points">{club.points}</td>
                        <td className="league-clubs-form">
                          {club.form.length === 0 ? (
                            "—"
                          ) : (
                            <div className="league-clubs-form-badges">
                              {club.form.map((result, formIndex) => (
                                <span
                                  key={formIndex}
                                  className={`league-clubs-form-badge league-clubs-form-badge--${result}`}
                                >
                                  {result}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>
            )}

            {activeTab === "scorers" && (
              topScorers.length === 0 ? (
                <p className="league-clubs-empty">Ende s'ka gola të regjistruar në këtë kampionat.</p>
              ) : (
                <div className="league-clubs-table-scroll">
                <table className="league-clubs-table league-clubs-table--scorers">
                  <thead>
                    <tr>
                      <th className="league-clubs-rank">#</th>
                      <th className="league-clubs-club">Lojtari</th>
                      <th>Klubi</th>
                      <th className="league-clubs-numeric">Gola</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topScorers.map((player, index) => (
                      <tr key={player.uid}>
                        <td className="league-clubs-rank">{index + 1}</td>
                        <td className="league-clubs-club">
                          <Link to={`/players/${player.uid}`} className="league-clubs-club-link">
                            <span className="league-clubs-logo">
                              {player.photoURL ? (
                                <img src={player.photoURL} alt={player.name} />
                              ) : (
                                <LuShield />
                              )}
                            </span>
                            <span>
                              {getNationalityFlag(player.nationality)} {player.name}
                            </span>
                          </Link>
                        </td>
                        <td className="league-clubs-city">{player.clubName}</td>
                        <td className="league-clubs-numeric league-clubs-points">{player.goals}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              )
            )}

            {activeTab === "matches" && (
              allLeagueMatches.length === 0 ? (
                <p className="league-clubs-empty">Ende s'ka ndeshje të regjistruara në këtë kampionat.</p>
              ) : (
                <div className="league-clubs-table-scroll">
                <table className="league-clubs-table league-clubs-table--matches">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Ora</th>
                      <th>Ekipi Vendas</th>
                      <th className="league-clubs-numeric">Rezultati</th>
                      <th>Ekipi Mysafir</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allLeagueMatches.map((match, index) => {
                      const homeTeam = match.isHome ? match.clubName : match.opponent;
                      const awayTeam = match.isHome ? match.opponent : match.clubName;
                      const played = match.status === "played";
                      const result = played
                        ? match.isHome
                          ? `${match.ourScore} - ${match.opponentScore}`
                          : `${match.opponentScore} - ${match.ourScore}`
                        : match.time || "—";

                      return (
                        <tr key={index}>
                          <td>{formatDateShort(match.date)}</td>
                          <td>{match.time || "—"}</td>
                          <td>{homeTeam}</td>
                          <td className={played ? "league-clubs-numeric league-clubs-match-result" : "league-clubs-numeric league-clubs-match-time"}>
                            {result}
                          </td>
                          <td>{awayTeam}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                </div>
              )
            )}
          </div>
        )}
      </section>
    </>
  );
}

export default League_Clubs;
