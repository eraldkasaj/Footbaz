import "./Player_Card.css";
import { Link } from "react-router-dom";
import {
  LuBadgeCheck,
  LuCalendarDays,
  LuChevronRight,
  LuShield,
  LuTrophy,
} from "react-icons/lu";
import defaultAvatar from "../../assets/images/avatar-player.png";

function PlayerCard({ player }) {
  const profile = player.profile || {};
  const careerEntries = Object.values(player.career || {});
  const currentCareerEntry = careerEntries.find((entry) => !entry.endYear) || careerEntries[careerEntries.length - 1];
  const club = currentCareerEntry?.club || profile.club || "Klubi nuk është vendosur";
  const league = currentCareerEntry?.league || profile.league || "Kampionati nuk është vendosur";
  const fullName = `${profile.name ?? ""} ${profile.surname ?? ""}`.trim() || "Lojtar";
  const age = profile.age ? `${profile.age} vjeç` : "Mosha —";
  const birthdate = profile.birthdate || profile.dateOfBirth || "—";
  const hasPhoto = Boolean(profile.photoURL);

  return (
    <article className="player-card">
      <div className="player-image-wrap">
        <img
          src={hasPhoto ? profile.photoURL : defaultAvatar}
          className={`player-image${hasPhoto ? "" : " player-image--default"}`}
          alt={fullName}
        />

        <span className="player-badge player-badge--position">
          {profile.position ? profile.position.toUpperCase() : "—"}
        </span>
      </div>

      <div className="player-info">
        <div className="player-name-row">
          <h3>{fullName}</h3>
          <LuBadgeCheck className="player-verified" aria-label="Profil i verifikuar" />
        </div>

        <div className="player-meta">
          <span><LuShield /> {club}</span>
          <span><LuTrophy /> {league}</span>
          <span className="player-age-birthdate">
            <LuCalendarDays />
            {age} <span className="player-date-separator">•</span> {birthdate}
          </span>
        </div>

        <Link to={`/players/${player.uid}`} className="profile-btn">
          Shiko Profilin <LuChevronRight />
        </Link>
      </div>
    </article>
  );
}

export default PlayerCard;