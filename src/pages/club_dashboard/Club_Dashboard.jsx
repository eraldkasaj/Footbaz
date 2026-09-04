import "./Club_Dashboard.css";

import { useEffect, useState } from "react";

import { auth, db } from "../../firebase/firebase";

import { ref, get } from "firebase/database";

import { useNavigate } from "react-router-dom";

import { signOut } from "firebase/auth";

import { resolveMyClubId } from "../../utils/resolveClubId";

import {
  LuLayoutDashboard,
  LuUsers,
  LuCalendarClock,
  LuSwords,
  LuChartBar,
  LuMessageSquare,
  LuUserCog,
  LuSettings,
  LuKeyRound,
  LuLogOut,
} from "react-icons/lu";

import DashboardHome from "./views/DashboardHome";
import Roster from "./views/Roster";
import PlayerDetail from "./views/PlayerDetail";
import Trainings from "./views/Trainings";
import Matches from "./views/Matches";
import Statistics from "./views/Statistics";
import Staff from "./views/Staff";

const NAV_ITEMS = [
  { key: "home", label: "Dashboard", icon: <LuLayoutDashboard /> },
  { key: "roster", label: "Lojtarët", icon: <LuUsers /> },
  { key: "trainings", label: "Sfidat / Stërvitjet", icon: <LuCalendarClock /> },
  { key: "matches", label: "Ndeshjet", icon: <LuSwords /> },
  { key: "statistics", label: "Statistikat", icon: <LuChartBar /> },
  { key: "staff", label: "Stafi", icon: <LuUserCog /> },
];

function Club_Dashboard() {
  const navigate = useNavigate();

  const [club, setClub] = useState(null);
  const [players, setPlayers] = useState({});
  const [roster, setRoster] = useState({});
  const [staff, setStaff] = useState({});
  const [trainings, setTrainings] = useState({});
  const [matches, setMatches] = useState({});
  const [documents, setDocuments] = useState({});
  const [loading, setLoading] = useState(true);

  const [activeView, setActiveView] = useState("home");
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);
  const [clubUid, setClubUid] = useState(null);
  const [noClubFound, setNoClubFound] = useState(false);

  useEffect(() => {
    const load = async () => {
      const user = auth.currentUser;

      if (!user) {
        navigate("/login");
        return;
      }

      // "Klubi im" mund të jetë klub i vetë-regjistruar (ID-ja e klubit =
      // UID-ja ime) ose një klub ekzistues që m'u dha si pronar përmes
      // "Kërko qasje" → ownerUid (ID krejt tjetër nga UID-ja ime) — shih
      // resolveClubId.js.
      const resolvedClubId = await resolveMyClubId(user.uid);

      if (!resolvedClubId) {
        setNoClubFound(true);
        setLoading(false);
        return;
      }

      setClubUid(resolvedClubId);

      // "clubs" është publik (profile/roster/matches), ndërsa staf, stërvitje
      // dhe dokumente jetojnë në nyje krejt të veçanta që janë private për
      // klubin — kështu nuk ka rrezik që të dhëna private të "ngjiten" publike
      // bashkë me pjesën publike të "clubs" (rregullat e Firebase shkojnë
      // vetëm poshtë, jo lart, prandaj s'mund t'i ndajmë brenda të njëjtit degë).
      const [clubSnap, playersSnap, staffSnap, trainingsSnap, documentsSnap] = await Promise.all([
        get(ref(db, "clubs/" + resolvedClubId)),
        get(ref(db, "players")),
        get(ref(db, "clubStaff/" + resolvedClubId)),
        get(ref(db, "clubTrainings/" + resolvedClubId)),
        get(ref(db, "clubDocuments/" + resolvedClubId)),
      ]);

      if (clubSnap.exists()) {
        const data = clubSnap.val();
        setClub(data.profile || {});
        setRoster(data.roster || {});
        setMatches(data.matches || {});
      }

      if (playersSnap.exists()) {
        setPlayers(playersSnap.val());
      }

      if (staffSnap.exists()) setStaff(staffSnap.val());
      if (trainingsSnap.exists()) setTrainings(trainingsSnap.val());
      if (documentsSnap.exists()) setDocuments(documentsSnap.val());

      setLoading(false);
    };

    load();
  }, [navigate]);

  const logout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.log(error.message);
    }
  };

  const openPlayer = (playerId) => {
    setSelectedPlayerId(playerId);
    setActiveView("player");
  };

  const clubName = club?.name || "Klubi im";

  const rosterPlayers = Object.keys(roster)
    .filter((id) => players[id])
    .map((id) => ({ uid: id, ...players[id], ...roster[id] }));

  if (loading) {
    return (
      <section className="club-dashboard">
        <p className="club-empty" style={{ padding: "64px", width: "100%" }}>
          Duke ngarkuar...
        </p>
      </section>
    );
  }

  if (noClubFound) {
    return (
      <section className="club-dashboard">
        <p className="club-empty" style={{ padding: "64px", width: "100%" }}>
          Llogaria jote s'është lidhur ende me asnjë klub. Kontakto footbazinfo@gmail.com.
        </p>
      </section>
    );
  }

  return (
    <section className="club-dashboard">
      <aside className="club-sidebar">
        <div>
          <h2 className="club-logo">
            Foot<span>baz</span>
          </h2>

          <div className="club-user">
            <div className="club-user-avatar">
              {club?.photoURL ? (
                <img src={club.photoURL} alt={clubName} />
              ) : (
                clubName.slice(0, 2).toUpperCase()
              )}
            </div>

            <div>
              <p className="club-user-name">{clubName}</p>
              <p className="club-user-role">
                Klub <span className="club-user-dot" />
              </p>
            </div>
          </div>

          <nav className="club-nav">
            <ul>
              {NAV_ITEMS.map((item) => (
                <li
                  key={item.key}
                  className={
                    activeView === item.key || (item.key === "roster" && activeView === "player")
                      ? "active"
                      : ""
                  }
                  onClick={() => setActiveView(item.key)}
                >
                  <span className="club-nav-icon">{item.icon}</span> {item.label}
                </li>
              ))}

              <li onClick={() => navigate("/messages")}>
                <span className="club-nav-icon">
                  <LuMessageSquare />
                </span>{" "}
                Mesazhet
              </li>

              <li onClick={() => navigate("/edit-club-profile")}>
                <span className="club-nav-icon">
                  <LuSettings />
                </span>{" "}
                Profili im
              </li>

              <li onClick={() => navigate("/settings")}>
                <span className="club-nav-icon">
                  <LuKeyRound />
                </span>{" "}
                Cilësimet
              </li>
            </ul>
          </nav>
        </div>

        <button className="club-logout" onClick={logout}>
          <span className="club-nav-icon">
            <LuLogOut />
          </span>
          Dil
        </button>
      </aside>

      <div className="club-content">
        {activeView === "home" && (
          <DashboardHome
            clubName={clubName}
            rosterCount={rosterPlayers.length}
            staffCount={Object.keys(staff).length}
            trainings={trainings}
            matches={matches}
            roster={roster}
            players={players}
          />
        )}

        {activeView === "roster" && (
          <Roster
            rosterPlayers={rosterPlayers}
            allPlayers={players}
            clubUid={clubUid}
            roster={roster}
            setRoster={setRoster}
            onOpenPlayer={openPlayer}
          />
        )}

        {activeView === "player" && selectedPlayerId && players[selectedPlayerId] && (
          <PlayerDetail
            player={players[selectedPlayerId]}
            playerId={selectedPlayerId}
            clubUid={clubUid}
            clubName={clubName}
            rosterEntry={roster[selectedPlayerId] || {}}
            setRoster={setRoster}
            trainings={trainings}
            setTrainings={setTrainings}
            playerDocuments={documents[selectedPlayerId] || {}}
            setDocuments={setDocuments}
            onBack={() => setActiveView("roster")}
          />
        )}

        {activeView === "trainings" && (
          <Trainings clubUid={clubUid} trainings={trainings} setTrainings={setTrainings} />
        )}

        {activeView === "matches" && (
          <Matches matches={matches} clubName={clubName} clubPhotoURL={club?.photoURL} />
        )}

        {activeView === "statistics" && (
          <Statistics matches={matches} rosterPlayers={rosterPlayers} />
        )}

        {activeView === "staff" && (
          <Staff clubUid={clubUid} staff={staff} setStaff={setStaff} />
        )}
      </div>
    </section>
  );
}

export default Club_Dashboard;
