import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Navbar from "../../components/navbar/Navbar";
import "./League_Clubs.css";
import { db } from "../../firebase/firebase";
import { ref, get } from "firebase/database";
import { LuArrowLeft, LuShield, LuChevronRight } from "react-icons/lu";

function League_Clubs() {
  const { league: leagueParam } = useParams();
  const league = decodeURIComponent(leagueParam);

  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getClubs = async () => {
      const snapshot = await get(ref(db, "clubs"));

      if (snapshot.exists()) {
        const data = snapshot.val();

        const clubsArray = Object.keys(data)
          .map((uid) => ({ uid, ...data[uid] }))
          .filter((club) => club.profile?.league === league);

        setClubs(clubsArray);
      }

      setLoading(false);
    };

    getClubs();
  }, [league]);

  return (
    <>
      <Navbar />

      <section className="league-clubs-page">
        <div className="league-clubs-header">
          <Link to="/clubs" className="league-clubs-back">
            <LuArrowLeft /> Kampionatet
          </Link>

          <span className="league-clubs-eyebrow">Kampionati</span>
          <h1>{league}</h1>
          <p>{clubs.length} klube</p>
        </div>

        {loading && <p className="league-clubs-empty">Duke ngarkuar klubet...</p>}

        {!loading && clubs.length === 0 && (
          <p className="league-clubs-empty">
            Ende s'ka klube të regjistruara në këtë kampionat.
          </p>
        )}

        {!loading && clubs.length > 0 && (
          <div className="league-clubs-table-wrap">
            <table className="league-clubs-table">
              <thead>
                <tr>
                  <th className="league-clubs-rank">#</th>
                  <th className="league-clubs-club">Klub</th>
                  <th>Qyteti</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {clubs.map((club, index) => {
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
                              <LuShield />
                            )}
                          </span>
                          <span>{profile.name || "Klub"}</span>
                          {profile.isDemo && (
                            <span className="league-clubs-demo-badge">Demo</span>
                          )}
                        </Link>
                      </td>
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
      </section>
    </>
  );
}

export default League_Clubs;
