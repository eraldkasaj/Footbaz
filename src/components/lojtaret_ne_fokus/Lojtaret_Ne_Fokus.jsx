import "./Lojtaret_Ne_Fokus.css";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PlayerCard from "../player_card/Player_Card";
import { db } from "../../firebase/firebase";
import { ref, get } from "firebase/database";

// Vlerëson sa i plotë është profili i lojtarit — foto ka peshë më të madhe
function getCompletenessScore(player) {
  const profile = player.profile || {};

  const hasPhoto = Boolean(profile.photoURL);
  const hasVideo = Boolean(player.videos && Object.keys(player.videos).length > 0);

  const fields = [
    profile.position,
    profile.height,
    profile.weight,
    profile.nationality,
    profile.birthdate,
    profile.bio,
    profile.age,
    profile.dominantFoot,
  ];

  const filledCount = fields.filter(
    (value) => value !== undefined && value !== null && value !== ""
  ).length;

  let score = filledCount;

  if (hasPhoto) score += 5; // foto është faktori më i rëndësishëm vizual
  if (hasVideo) score += 2;

  return score;
}

function Lojtaret_Ne_Fokus() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getFeaturedPlayers = async () => {
      const playersRef = ref(db, "players");
      const snapshot = await get(playersRef);

      if (snapshot.exists()) {
        const data = snapshot.val();

        const playersArray = Object.keys(data).map((uid) => ({
          uid,
          ...data[uid],
        }));

        // Rendit lojtarët sipas sa i plotë është profili (foto + fusha të plotësuara + video)
        const sortedByCompleteness = [...playersArray].sort(
          (a, b) => getCompletenessScore(b) - getCompletenessScore(a)
        );

        setPlayers(sortedByCompleteness.slice(0, 4));
      }

      setLoading(false);
    };

    getFeaturedPlayers();
  }, []);

  if (!loading && players.length === 0) {
    return null;
  }

  return (
    <section className="featured-players">
      <div className="featured-header">
        <h2>Lojtarët në Fokus</h2>

        <p>
          Lojtarë që po tërheqin vëmendjen e
          skautëve, akademive dhe klubeve.
        </p>
      </div>

      {loading ? (
        <p className="featured-loading">Duke ngarkuar lojtarët...</p>
      ) : (
        <>
          <div className="featured-grid">
            {players.map((player) => (
              <PlayerCard key={player.uid} player={player} />
            ))}
          </div>

          <div className="featured-footer">
            <Link to="/players" className="featured-view-all">
              Shiko të gjithë lojtarët
            </Link>
          </div>
        </>
      )}
    </section>
  );
}

export default Lojtaret_Ne_Fokus;