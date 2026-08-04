import Navbar from "../../components/navbar/Navbar";
import Club_Profile_Card from "../../components/club_profile_card/Club_Profile_Card";
import "./Club_Profile.css";

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { db } from "../../firebase/firebase";
import { ref, get } from "firebase/database";

function Club_Profile() {
  const { id } = useParams();

  const [club, setClub] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getClub = async () => {
      try {
        const snapshot = await get(ref(db, `clubs/${id}`));

        if (snapshot.exists()) {
          setClub({ uid: id, ...snapshot.val() });
        } else {
          setClub(null);
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
        {club && <Club_Profile_Card club={club} />}
      </section>
    </>
  );
}

export default Club_Profile;
