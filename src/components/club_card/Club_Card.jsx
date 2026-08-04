import "./Club_Card.css";
import { Link } from "react-router-dom";
import { LuMapPin, LuChevronRight, LuShield } from "react-icons/lu";

function Club_Card({ club }) {
  const profile = club.profile || {};
  const hasLogo = Boolean(profile.photoURL);
  const location = [profile.city, profile.country].filter(Boolean).join(", ");

  return (
    <article className="club-card">
      <div className="club-logo-wrap">
        {hasLogo ? (
          <img src={profile.photoURL} className="club-logo-image" alt={profile.name} />
        ) : (
          <span className="club-logo-fallback">
            <LuShield />
          </span>
        )}
      </div>

      <div className="club-info">
        <div className="club-name-row">
          <h3>{profile.name || "Klub"}</h3>
        </div>

        <div className="club-meta">
          <span><LuMapPin /> {location || "Vendndodhja nuk është vendosur"}</span>
        </div>

        <Link to={`/clubs/${club.uid}`} className="club-profile-btn">
          Shiko Klubin <LuChevronRight />
        </Link>
      </div>
    </article>
  );
}

export default Club_Card;
