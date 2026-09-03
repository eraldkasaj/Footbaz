import { useEffect, useState } from "react";
import Navbar from "../../components/navbar/Navbar";
import PlayerCard from "../../components/player_card/Player_Card";
import "./Players.css";
import { db } from "../../firebase/firebase";
import { ref, get } from "firebase/database";
import { LuSearch, LuX } from "react-icons/lu";
import { isProfileVerified } from "../../utils/completeness";
import { LEAGUE_OPTIONS } from "../../data/leagues";

// Kampionati aktual i lojtarit vjen nga profili (dropdown-i i ri) ose, për
// llogaritë e vjetra/rastet kur është shtuar te Karriera, nga zëri i fundit
// pa datë mbarimi — e njëjta logjikë fallback si te Player_Card.jsx.
function getPlayerLeague(player) {
  const careerEntries = Object.values(player.career || {});
  const currentCareerEntry =
    careerEntries.find((entry) => !entry.endYear) || careerEntries[careerEntries.length - 1];

  return player.profile?.league || currentCareerEntry?.league || "";
}

const positionOrder = [
  "GK",
  "CB", "LB", "RB",
  "CDM", "CM", "CAM",
  "LM", "RM",
  "LW", "RW",
  "ST", "CF"
];

function Players() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [position, setPosition] = useState("");
  const [league, setLeague] = useState("");
  const [age, setAge] = useState("");
  const [sort, setSort] = useState("");

  useEffect(() => {
    const getPlayers = async () => {
      const playersRef = ref(db, "players");
      const snapshot = await get(playersRef);

      if (snapshot.exists()) {
        const data = snapshot.val();

        const playersArray = Object.keys(data)
          .map((uid) => ({
            uid,
            ...data[uid],
          }))
          // Fsheh profilet e reja që s'kanë verifikuar ende email-in (shih
          // Register.jsx/Login.jsx). "!== false" (jo "=== true") ruan
          // prapa-përputhshmërinë me llogaritë e vjetra, të krijuara para
          // kësaj fushe — ato s'e kanë fare emailVerified, ndaj mbeten të
          // dukshme si më parë, s'zhduken papritmas nga direktoria publike.
          .filter((player) => player.emailVerified !== false && !player.disabled);

        setPlayers(playersArray);
      }

      setLoading(false);
    };

    getPlayers();
  }, []);

  // Opsionet e pozicionit, të renditura taktikisht (portier -> mbrojtje -> mesfushë -> sulm)
  const positionOptions = [...new Set(
    players
      .map((player) => player.profile?.position)
      .filter(Boolean)
  )].sort((a, b) => {
    const indexA = positionOrder.indexOf(a.toUpperCase());
    const indexB = positionOrder.indexOf(b.toUpperCase());

    if (indexA === -1 && indexB === -1) return 0;
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;

    return indexA - indexB;
  });

  // Opsionet e ligës — vetëm kampionatet që kanë realisht lojtarë, në radhën
  // kanonike të LEAGUE_OPTIONS; çdo vlerë tjetër (tekst i lirë, jo nga lista)
  // shtohet në fund të renditur alfabetikisht, që të mos humbasë asnjë lojtar.
  const presentLeagues = new Set(players.map(getPlayerLeague).filter(Boolean));
  const leagueOptions = [
    ...LEAGUE_OPTIONS.filter((option) => presentLeagues.has(option)),
    ...[...presentLeagues].filter((value) => !LEAGUE_OPTIONS.includes(value)).sort(),
  ];

  let filteredPlayers = [...players];

  filteredPlayers = filteredPlayers.filter((player) =>
    (
      (player.profile?.name || "") +
      " " +
      (player.profile?.surname || "")
    )
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  if (position !== "") {
    filteredPlayers = filteredPlayers.filter(
      (player) =>
        (player.profile?.position || "").toLowerCase() === position.toLowerCase()
    );
  }

  if (league !== "") {
    filteredPlayers = filteredPlayers.filter(
      (player) => getPlayerLeague(player) === league
    );
  }

  if (age === "U13") {
    filteredPlayers = filteredPlayers.filter(
      (player) => Number(player.profile?.age) <= 13
    );
  }

  if (age === "U15") {
    filteredPlayers = filteredPlayers.filter(
      (player) => Number(player.profile?.age) >= 14 && Number(player.profile?.age) <= 15
    );
  }

  if (age === "U17") {
    filteredPlayers = filteredPlayers.filter(
      (player) => Number(player.profile?.age) >= 16 && Number(player.profile?.age) <= 17
    );
  }

  if (age === "U19") {
    filteredPlayers = filteredPlayers.filter(
      (player) => Number(player.profile?.age) >= 18 && Number(player.profile?.age) <= 19
    );
  }

  if (age === "U21") {
    filteredPlayers = filteredPlayers.filter(
      (player) => Number(player.profile?.age) >= 20 && Number(player.profile?.age) <= 21
    );
  }

  if (age === "U23") {
    filteredPlayers = filteredPlayers.filter(
      (player) => Number(player.profile?.age) >= 22
    );
  }

  // Pa asnjë renditje të zgjedhur nga useri, lojtarët "Verified" dalin të
  // parët si parazgjedhje — nxit profilet e plota dhe u jep atyre pamje më
  // të mirë tek skautët. E njëjta renditje mund të zgjidhet edhe shprehimisht
  // nga "Rendit sipas" (sort === "verified"), p.sh. për t'u kthyer tek kjo
  // renditje pas zgjedhjes së një tjetre.
  if (sort === "" || sort === "verified") {
    filteredPlayers.sort(
      (a, b) => Number(isProfileVerified(b)) - Number(isProfileVerified(a))
    );
  }

  if (sort === "age-asc") {
    filteredPlayers.sort(
      (a, b) => (Number(a.profile?.age) || 0) - (Number(b.profile?.age) || 0)
    );
  }

  if (sort === "age-desc") {
    filteredPlayers.sort(
      (a, b) => (Number(b.profile?.age) || 0) - (Number(a.profile?.age) || 0)
    );
  }

  if (sort === "newest") {
    filteredPlayers.sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  }

  const hasActiveFilters =
    search !== "" || position !== "" || league !== "" || age !== "" || sort !== "";

  const resetFilters = () => {
    setSearch("");
    setPosition("");
    setLeague("");
    setAge("");
    setSort("");
  };

  return (
    <>
      <Navbar />

      <section className="players-page">
        <div className="players-header">
          <h1>Lojtarët</h1>
          <p>Zbulo talentet e platformës Footbaz.</p>
        </div>

        <div className="players-filter-panel">
          <div className="players-filters">
            <div className="players-search-input">
              <LuSearch />
              <input
                type="text"
                placeholder="Kërko lojtar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  type="button"
                  className="players-search-clear"
                  onClick={() => setSearch("")}
                  aria-label="Pastro kërkimin"
                >
                  <LuX />
                </button>
              )}
            </div>

            <select
              value={position}
              onChange={(e) => setPosition(e.target.value)}
            >
              <option value="">Pozicioni</option>

              {positionOptions.map((pos) => (
                <option key={pos} value={pos}>
                  {pos.toUpperCase()}
                </option>
              ))}
            </select>

            <select
              value={league}
              onChange={(e) => setLeague(e.target.value)}
            >
              <option value="">Kampionati</option>

              {leagueOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>

            <select
              value={age}
              onChange={(e) => setAge(e.target.value)}
            >
              <option value="">Mosha</option>
              <option value="U13">U13</option>
              <option value="U15">U15</option>
              <option value="U17">U17</option>
              <option value="U19">U19</option>
              <option value="U21">U21</option>
              <option value="U23">U23</option>
            </select>

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="">Rendit sipas</option>
              <option value="verified">Verified</option>
              <option value="age-asc">Mosha ↑</option>
              <option value="age-desc">Mosha ↓</option>
              <option value="newest">Më të rejat</option>
            </select>

            {hasActiveFilters && (
              <button
                type="button"
                className="players-reset-btn"
                onClick={resetFilters}
              >
                Pastro filtrat
              </button>
            )}
          </div>
        </div>

        {!loading && (
          <p className="players-count">
            {filteredPlayers.length} {filteredPlayers.length === 1 ? "lojtar u gjet" : "lojtarë u gjetën"}
          </p>
        )}

        {loading && (
          <p className="players-empty">Duke ngarkuar lojtarët...</p>
        )}

        {!loading && filteredPlayers.length === 0 && (
          <p className="players-empty">
            Nuk u gjet asnjë lojtar me këto kritere.
          </p>
        )}

        {!loading && filteredPlayers.length > 0 && (
          <div className="players-grid">
            {filteredPlayers.map((player) => (
              <PlayerCard
                key={player.uid}
                player={player}
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
}

export default Players;