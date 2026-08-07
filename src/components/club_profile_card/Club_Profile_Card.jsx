import "./Club_Profile_Card.css";
import { LuMapPin, LuCalendar, LuMail, LuPhone, LuShield } from "react-icons/lu";

function Club_Profile_Card({ club }) {
  const profile = club.profile || {};
  const location = [profile.city, profile.country].filter(Boolean).join(", ");

  return (
    <div className="club-profile-card">
      <div className="club-profile-top">
        <div className="club-profile-logo">
          {profile.photoURL ? (
            <img src={profile.photoURL} alt={profile.name} />
          ) : (
            <LuShield />
          )}
        </div>

        <div className="club-profile-info">
          <h1>{profile.name || "Klub"}</h1>
          <span className="club-profile-role">Klub</span>
          {profile.isDemo && (
            <span className="club-profile-demo-badge">Profil Demo — Jozyrtar</span>
          )}

          <div className="club-profile-details">
            <div className="club-detail-card">
              <LuMapPin />
              <div>
                <span>Vendndodhja</span>
                <h3>{location || "—"}</h3>
              </div>
            </div>

            <div className="club-detail-card">
              <LuCalendar />
              <div>
                <span>Viti i themelimit</span>
                <h3>{profile.foundedYear || "—"}</h3>
              </div>
            </div>

            {profile.contactEmail && (
              <div className="club-detail-card">
                <LuMail />
                <div>
                  <span>Email</span>
                  <h3>{profile.contactEmail}</h3>
                </div>
              </div>
            )}

            {profile.contactPhone && (
              <div className="club-detail-card">
                <LuPhone />
                <div>
                  <span>Telefon</span>
                  <h3>{profile.contactPhone}</h3>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="about-club">
        <h2>Rreth klubit</h2>
        <p>{profile.description || "Nuk ka përshkrim akoma."}</p>
      </div>
    </div>
  );
}

export default Club_Profile_Card;
