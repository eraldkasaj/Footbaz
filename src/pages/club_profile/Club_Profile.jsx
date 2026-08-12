import Navbar from "../../components/navbar/Navbar";
import Club_Profile_Card from "../../components/club_profile_card/Club_Profile_Card";
import "./Club_Profile.css";

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { db } from "../../firebase/firebase";
import { ref, get } from "firebase/database";
import { getSquadPlayers, computeSquadStats } from "../../utils/squad";
import { computeStandings } from "../../utils/standings";

function Club_Profile() {
  const { id } = useParams();

  const [club, setClub] = useState(null);
  const [squadPlayers, setSquadPlayers] = useState([]);
  const [squadStats, setSquadStats] = useState({ squadSize: 0, avgAge: null, foreigners: 0 });
  const [standing, setStanding] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getClub = async () => {
      try {
        const [clubSnapshot, clubsSnapshot, playersSnapshot] = await Promise.all([
          get(ref(db, `clubs/${id}`)),
          get(ref(db, "clubs")),
          get(ref(db, "players")),
        ]);

        if (!clubSnapshot.exists()) {
          setClub(null);
          return;
        }

        const clubData = { uid: id, ...clubSnapshot.val() };
        setClub(clubData);

        const playersById = playersSnapshot.exists() ? playersSnapshot.val() : {};
        const players = getSquadPlayers(clubData, playersById);
        setSquadPlayers(players);
        setSquadStats(computeSquadStats(players));

        // Pozicioni në tabelë — llogaritet mes klubeve të të njëjtit kampionat,
        // njësoj si te League_Clubs, që numri të mos bjerë ndesh me tabelën atje.
        const league = clubData.profile?.league;
        const allClubsData = clubsSnapshot.exists() ? clubsSnapshot.val() : {};

        if (league) {
          const leagueClubs = Object.keys(allClubsData)
            .map((uid) => ({ uid, ...allClubsData[uid] }))
            .filter((c) => c.profile?.league === league);

          const standings = computeStandings(leagueClubs);
          const position = standings.findIndex((c) => c.uid === id) + 1;

          setStanding({ league, position: position || null, total: standings.length });
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    getClub();
  }, [id]);

  if (loading) {
    return <p className="club-profile-loading">Duke ngarkuar...</p>;
  }

  return (
    <>
      <Navbar />

      <section className="club-profile">
        {club && (
          <Club_Profile_Card
            club={club}
            squadPlayers={squadPlayers}
            squadStats={squadStats}
            standing={standing}
          />
        )}
      </section>
    </>
  );
}

export default Club_Profile;
