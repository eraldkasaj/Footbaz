import { useEffect, useState } from "react";
import Navbar from "../../components/navbar/Navbar";
import Club_Card from "../../components/club_card/Club_Card";
import "./Clubs.css";
import { db } from "../../firebase/firebase";
import { ref, get } from "firebase/database";
import { LuSearch } from "react-icons/lu";

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

  return (
    <>
      <Navbar />

      <section className="clubs-page">
        <div className="clubs-header">
          <span className="clubs-eyebrow">Footbaz</span>
          <h1>Klubet</h1>
          <p>Zbulo klubet e platformës Footbaz.</p>
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

        {!loading && filteredClubs.length === 0 && (
          <p className="clubs-empty">
            Nuk u gjet asnjë klub me këto kritere.
          </p>
        )}

        {!loading && filteredClubs.length > 0 && (
          <div className="clubs-grid">
            {filteredClubs.map((club) => (
              <Club_Card key={club.uid} club={club} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}

export default Clubs;
