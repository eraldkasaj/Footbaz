import "./Hero.css";
import { Link } from "react-router-dom";
import { Link as ScrollLink } from "react-scroll";
import { useEffect, useState } from "react";
import { db } from "../../firebase/firebase";
import { ref, get } from "firebase/database";
import heroPhone from "../../assets/images/hero-phone.png";

function Hero() {
  const [stats, setStats] = useState({ players: 0, clubs: 0 });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const playersSnapshot = await get(ref(db, "players"));
        const players = playersSnapshot.exists() ? playersSnapshot.val() : {};
        const playerCount = Object.keys(players).length;

        const clubsSnapshot = await get(ref(db, "clubs"));
        const clubs = clubsSnapshot.exists() ? clubsSnapshot.val() : {};
        const clubCount = Object.keys(clubs).length;

        setStats({
          players: playerCount,
          clubs: clubCount,
        });
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="hero-wrapper">
      <section className="hero">
        <div className="hero-glow" aria-hidden="true" />

        <div className="hero-left">
          <span className="hero-badge">
            <span className="hero-badge-dot" />
            Platforma e parë e skautimit në Shqipëri
          </span>

          <h1>
            Shfaq talentin tënd.
            <br />
            Bëhu <span className="hero-highlight">i dukshëm</span> për skautët.
          </h1>

          <p>
            Krijo profilin tënd, ngarko videot e ndeshjeve<br />
            dhe lidhu me klube dhe skautë.
          </p>

          <div className="hero-buttons">
            <Link to="/register" className="hero-register">Regjistrohu</Link>
            <ScrollLink to="si-funksionon" smooth duration={500} offset={50} className="hero-learn">
              Mëso më shumë
            </ScrollLink>
          </div>

          <div className="hero-stats">
            <div className="hero-stat">
              <h3>{loadingStats ? "—" : stats.players}</h3>
              <p>Lojtarë të regjistruar</p>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <h3 className={!loadingStats && stats.clubs === 0 ? "hero-stat-soon" : ""}>
                {loadingStats ? "—" : stats.clubs === 0 ? "Së shpejti" : stats.clubs}
              </h3>
              <p>Klube të regjistruara</p>
            </div>
          </div>
        </div>

        <div className="hero-right">
          <div className="hero-phone-showcase">
            <img className="hero-phone-art" src={heroPhone} alt="Footbaz - profil lojtari" />
          </div>
        </div>
      </section>
    </div>
  );
}

export default Hero;