import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/navbar/Navbar";
import "./Clubs.css";
import { db } from "../../firebase/firebase";
import { ref, get } from "firebase/database";
import { LuSearch } from "react-icons/lu";
import { LEAGUE_OPTIONS } from "../../data/leagues";

// Kampionatet e para 8 në LEAGUE_OPTIONS janë familja "Superliga" (Abissnet
// Superiore, të gjitha moshat, + Superiore Vajza) — shfaqen në kolonën e
// majtë. Pjesa tjetër (Kategoria e Parë e poshtë, me moshat e saj, etj.)
// shkon në kolonën e djathtë. "Klube Jashtë Shqipërisë" shtohet
// gjithashtu në kolonën e majtë — nuk është pjesë e piramidës Kategoria e
// Parë/Dytë, kështu që nuk i përket kolonës së djathtë.
const SUPERLIGA_FAMILY = new Set([
  ...LEAGUE_OPTIONS.slice(0, 7),
  "Klube Jashtë Shqipërisë",
]);

function Clubs() {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const getClubs = async () => {
      const clubsRef = ref(db, "clubs");
      const snapshot = await get(clubsRef);

      if (snapshot.exists()) {
        const data = snapshot.val();

        const clubsArray = Object.keys(data).map((uid) => ({
          uid,
          ...data[uid],
        }));

        setClubs(clubsArray);
      }

      setLoading(false);
    };

    getClubs();
  }, []);

  const filteredClubs = clubs.filter((club) =>
    (club.profile?.name || "")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  // Grupon klubet sipas kampionatit (profile.league). Të gjitha kampionatet
  // shfaqen si seksione (edhe pa asnjë klub ende), që të duket struktura e
  // plotë e kampionateve që nga fillimi.
  const leagueGroups = LEAGUE_OPTIONS
    .map((league) => ({
      league,
      clubs: filteredClubs.filter((club) => club.profile?.league === league),
    }))
    .filter((group) => {
      // Gjatë kërkimit, fsheh kampionatet pa asnjë rezultat përputhës.
      if (search.trim()) return group.clubs.length > 0;
      return true;
    });

  const superligaGroups = leagueGroups.filter((group) => SUPERLIGA_FAMILY.has(group.league));
  const otherGroups = leagueGroups.filter((group) => !SUPERLIGA_FAMILY.has(group.league));

  return (
    <>
      <Navbar />

      <section className="clubs-page">
        <div className="clubs-header">
          <span className="clubs-eyebrow">Footbaz</span>
          <h1>Klubet</h1>
          <p>Zbulo klubet e platformës Footbaz, sipas kampionatit.</p>
        </div>

        <div className="clubs-search-panel">
          <div className="clubs-search-input">
            <LuSearch />
            <input
              type="text"
              placeholder="Kërko klub..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading && (
          <p className="clubs-empty">Duke ngarkuar klubet...</p>
        )}

        {!loading && leagueGroups.length === 0 && (
          <p className="clubs-empty">
            Nuk u gjet asnjë klub me këto kritere.
          </p>
        )}

        {!loading && leagueGroups.length > 0 && (
          <div className="clubs-leagues-grid">
            <div className="clubs-leagues-col">
              {superligaGroups.map((group) => (
                <div className="clubs-league-section" key={group.league}>
                  <Link
                    to={`/clubs/league/${encodeURIComponent(group.league)}`}
                    className="clubs-league-header"
                  >
                    <span className="clubs-league-eyebrow">Kampionati</span>
                    <h2>{group.league}</h2>
                    <span className="clubs-league-count">{group.clubs.length} klube</span>
                  </Link>
                </div>
              ))}
            </div>

            <div className="clubs-leagues-col">
              {otherGroups.map((group) => (
                <div className="clubs-league-section" key={group.league}>
                  <Link
                    to={`/clubs/league/${encodeURIComponent(group.league)}`}
                    className="clubs-league-header"
                  >
                    <span className="clubs-league-eyebrow">Kampionati</span>
                    <h2>{group.league}</h2>
                    <span className="clubs-league-count">{group.clubs.length} klube</span>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </>
  );
}

export default Clubs;
