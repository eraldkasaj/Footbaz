import "./Admin.css";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { auth, db } from "../../firebase/firebase";
import { ref, get, update } from "firebase/database";
import {
  LuArrowLeft,
  LuCheck,
  LuX,
  LuLayoutDashboard,
  LuInbox,
  LuUsersRound,
  LuTriangleAlert,
} from "react-icons/lu";
import { sendClaimStatusUpdate } from "../../utils/emailjsClaims";
import { createManagedClubAccount, generateTempPassword } from "../../utils/manageClubAccount";
import { normalizeName } from "../../utils/normalizeName";

const STATUS_LABELS = {
  pending: "Në pritje",
  approved: "Aprovuar",
  rejected: "Refuzuar",
};

const SECTIONS = [
  { key: "overview", label: "Përmbledhje", icon: <LuLayoutDashboard /> },
  { key: "claims", label: "Kërkesat për Klube", icon: <LuInbox /> },
  { key: "manage", label: "Lojtarë & Klube", icon: <LuUsersRound /> },
];

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function isWithinLastWeek(createdAt) {
  if (!createdAt) return false;
  const timestamp = new Date(createdAt).getTime();
  return !Number.isNaN(timestamp) && Date.now() - timestamp <= ONE_WEEK_MS;
}

// Paneli i administratorit. Qasja lejohet vetëm te llogaria me
// users/{uid}/role === "admin" (kontrollohet edhe nga rregullat e Firebase,
// jo vetëm këtu). Tre seksione:
// - Përmbledhje: statistika të shpejta.
// - Kërkesat për Klube: shqyrtimi i clubClaims — Aprovimi krijon vetë një
//   llogari Footbaz për kërkuesin (pa prekur sesionin e Aldit, shih
//   manageClubAccount.js), e lidh si ownerUid te klubi, dhe ia dërgon
//   kredencialet me email.
// - Lojtarë & Klube: kërkim + çaktivizim/aktivizim (fusha "disabled",
//   admin-writable, s'prek asgjë tjetër nga profili), plus sinjalizim i
//   emrave të dyfishtë të lojtarëve.
function Admin() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [section, setSection] = useState("overview");

  const [claims, setClaims] = useState([]);
  const [players, setPlayers] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  const [statusFilter, setStatusFilter] = useState("pending");
  const [actioningId, setActioningId] = useState(null);
  const [actionError, setActionError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("players");
  const [togglingId, setTogglingId] = useState(null);

  useEffect(() => {
    const checkAdmin = async () => {
      const user = auth.currentUser;

      if (!user) {
        navigate("/login");
        return;
      }

      const snapshot = await get(ref(db, `users/${user.uid}`));
      const role = snapshot.exists() ? snapshot.val().role : null;

      if (role !== "admin") {
        navigate("/");
        return;
      }

      setIsAdmin(true);
      setChecking(false);
    };

    checkAdmin();
  }, [navigate]);

  useEffect(() => {
    if (!isAdmin) return;

    const loadAll = async () => {
      const [claimsSnap, playersSnap, clubsSnap] = await Promise.all([
        get(ref(db, "clubClaims")),
        get(ref(db, "players")),
        get(ref(db, "clubs")),
      ]);

      if (claimsSnap.exists()) {
        const data = claimsSnap.val();
        const list = Object.keys(data)
          .map((id) => ({ id, ...data[id] }))
          .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

        setClaims(list);
      }

      if (playersSnap.exists()) {
        const data = playersSnap.val();
        setPlayers(Object.keys(data).map((uid) => ({ uid, ...data[uid] })));
      }

      if (clubsSnap.exists()) {
        const data = clubsSnap.val();
        setClubs(Object.keys(data).map((uid) => ({ uid, ...data[uid] })));
      }

      setLoadingData(false);
    };

    loadAll();
  }, [isAdmin]);

  const setClaimStatus = async (claim, status) => {
    const claimId = claim.id;
    setActioningId(claimId);
    setActionError("");

    let tempPassword = "";

    try {
      // Aprovimi krijon llogarinë PARA se të ndryshojmë statusin — nëse
      // krijimi i llogarisë dështon, s'duam që kërkesa të mbetet "aprovuar"
      // pa asnjë lidhje reale pas saj.
      if (status === "approved") {
        try {
          tempPassword = generateTempPassword();
          const newUid = await createManagedClubAccount(claim.email, tempPassword);
          await update(ref(db, `clubs/${claim.clubId}`), { ownerUid: newUid });
        } catch (accountError) {
          if (accountError.code === "auth/email-already-in-use") {
            setActionError(
              `Email-i ${claim.email} ka tashmë një llogari Footbaz — s'mund t'i krijohet një e re automatikisht. Kjo kërkon lidhje manuale (UID-ja e llogarisë ekzistuese) përmes Claude Code.`
            );
          } else {
            // eslint-disable-next-line no-console
            console.error("Admin: create managed account failed:", accountError);
            setActionError("Dështoi krijimi i llogarisë. Provo sërish, ose kontrollo konsolën (F12) për detaje.");
          }

          setActioningId(null);
          return;
        }
      }

      await update(ref(db, `clubClaims/${claimId}`), {
        status,
        reviewedAt: Date.now(),
      });

      setClaims((previous) =>
        previous.map((c) => (c.id === claimId ? { ...c, status } : c))
      );

      // Email-i i përgjigjes te kërkuesi është "best effort" — statusi
      // është ndryshuar tashmë te Firebase, ndaj nëse email-i dështon
      // s'e rikthejmë ndryshimin, thjesht e loggojmë.
      sendClaimStatusUpdate({
        toEmail: claim.email,
        toName: claim.name,
        clubName: claim.clubName,
        status,
        tempPassword,
      }).catch((emailError) => {
        // eslint-disable-next-line no-console
        console.error("Admin claim status email failed:", emailError);
      });
    } catch {
      // Nëse update-i i statusit dështon (p.sh. rregulla e papublikuar
      // ende), lista thjesht mbetet siç ishte — useri mund të riprovojë.
      setActionError("Ndryshimi i statusit dështoi. Provo sërish.");
    } finally {
      setActioningId(null);
    }
  };

  const toggleDisabled = async (kind, entity) => {
    const path = kind === "players" ? `players/${entity.uid}` : `clubs/${entity.uid}`;
    const nextDisabled = !entity.disabled;

    setTogglingId(entity.uid);

    try {
      await update(ref(db, path), { disabled: nextDisabled });

      const updater = (list) =>
        list.map((item) => (item.uid === entity.uid ? { ...item, disabled: nextDisabled } : item));

      if (kind === "players") setPlayers(updater);
      else setClubs(updater);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Admin toggleDisabled failed:", error);
      alert("Dështoi ndryshimi i statusit. Kontrollo nëse rregulli i Firebase është publikuar.");
    } finally {
      setTogglingId(null);
    }
  };

  // Emra lojtarësh që shfaqen më shumë se një herë — sinjalizim i shpejtë
  // për regjistrime të dyfishta (p.sh. dikush që rregjistrohet disa herë me
  // email të ndryshëm sepse s'i erdhi email-i i verifikimit).
  const duplicatePlayerNames = useMemo(() => {
    const groups = new Map();

    players.forEach((player) => {
      const fullName = `${player.profile?.name || ""} ${player.profile?.surname || ""}`.trim();
      if (!fullName) return;

      const key = normalizeName(fullName);
      if (!groups.has(key)) groups.set(key, { label: fullName, players: [] });
      groups.get(key).players.push(player);
    });

    return [...groups.values()].filter((group) => group.players.length > 1);
  }, [players]);

  const visibleClaims = claims.filter((claim) => (claim.status || "pending") === statusFilter);

  const searchResults = useMemo(() => {
    const list = searchType === "players" ? players : clubs;
    const query = normalizeName(searchQuery);

    if (!query) return list;

    return list.filter((item) => {
      const label =
        searchType === "players"
          ? `${item.profile?.name || ""} ${item.profile?.surname || ""}`
          : item.profile?.name || "";

      return normalizeName(label).includes(query);
    });
  }, [players, clubs, searchType, searchQuery]);

  const stats = useMemo(() => {
    return {
      totalPlayers: players.length,
      totalClubs: clubs.length,
      newPlayers: players.filter((p) => isWithinLastWeek(p.createdAt)).length,
      newClubs: clubs.filter((c) => isWithinLastWeek(c.createdAt)).length,
      pendingClaims: claims.filter((c) => (c.status || "pending") === "pending").length,
    };
  }, [players, clubs, claims]);

  if (checking) {
    return <p className="admin-loading">Duke kontrolluar qasjen...</p>;
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <section className="admin-page">
      <div className="admin-panel">
        <button type="button" className="admin-back" onClick={() => navigate("/")}>
          <LuArrowLeft /> Kthehu në faqen kryesore
        </button>

        <header className="admin-header">
          <p>Paneli i Administratorit</p>
          <h1>{SECTIONS.find((s) => s.key === section)?.label}</h1>
        </header>

        <div className="admin-section-nav">
          {SECTIONS.map((s) => (
            <button
              key={s.key}
              type="button"
              className={section === s.key ? "admin-section-btn active" : "admin-section-btn"}
              onClick={() => setSection(s.key)}
            >
              {s.icon} {s.label}
            </button>
          ))}
        </div>

        {loadingData ? (
          <p className="admin-empty">Duke ngarkuar...</p>
        ) : (
          <>
            {section === "overview" && (
              <div className="admin-stats-grid">
                <div className="admin-stat-card">
                  <span className="admin-stat-value">{stats.totalPlayers}</span>
                  <span className="admin-stat-label">Lojtarë gjithsej</span>
                </div>
                <div className="admin-stat-card">
                  <span className="admin-stat-value">{stats.newPlayers}</span>
                  <span className="admin-stat-label">Lojtarë të rinj (7 ditë)</span>
                </div>
                <div className="admin-stat-card">
                  <span className="admin-stat-value">{stats.totalClubs}</span>
                  <span className="admin-stat-label">Klube gjithsej</span>
                </div>
                <div className="admin-stat-card">
                  <span className="admin-stat-value">{stats.newClubs}</span>
                  <span className="admin-stat-label">Klube të reja (7 ditë)</span>
                </div>
                <div className="admin-stat-card">
                  <span className="admin-stat-value">{stats.pendingClaims}</span>
                  <span className="admin-stat-label">Kërkesa në pritje</span>
                </div>
              </div>
            )}

            {section === "claims" && (
              <>
                <div className="admin-tabs">
                  {Object.keys(STATUS_LABELS).map((status) => (
                    <button
                      key={status}
                      type="button"
                      className={statusFilter === status ? "admin-tab active" : "admin-tab"}
                      onClick={() => setStatusFilter(status)}
                    >
                      {STATUS_LABELS[status]}
                      {" "}
                      ({claims.filter((claim) => (claim.status || "pending") === status).length})
                    </button>
                  ))}
                </div>

                {actionError && <p className="admin-action-error">{actionError}</p>}

                {visibleClaims.length === 0 ? (
                  <p className="admin-empty">Asnjë kërkesë këtu.</p>
                ) : (
                  <div className="admin-claims-list">
                    {visibleClaims.map((claim) => (
                      <div key={claim.id} className="admin-claim-card">
                        <div className="admin-claim-main">
                          <h3>
                            {claim.name}
                            <span className="admin-claim-role">{claim.roleAtClub}</span>
                          </h3>

                          <p className="admin-claim-club">
                            Kërkon qasje te{" "}
                            <Link to={`/clubs/${claim.clubId}`} target="_blank" rel="noopener noreferrer">
                              {claim.clubName || claim.clubId}
                            </Link>
                          </p>

                          <div className="admin-claim-contact">
                            <span>{claim.email}</span>
                            <span>{claim.phone}</span>
                          </div>

                          {claim.message && <p className="admin-claim-message">"{claim.message}"</p>}
                        </div>

                        {statusFilter === "pending" && (
                          <div className="admin-claim-actions">
                            <button
                              type="button"
                              className="admin-claim-approve"
                              disabled={actioningId === claim.id}
                              onClick={() => setClaimStatus(claim, "approved")}
                            >
                              <LuCheck /> {actioningId === claim.id ? "Duke krijuar llogari..." : "Aprovo"}
                            </button>
                            <button
                              type="button"
                              className="admin-claim-reject"
                              disabled={actioningId === claim.id}
                              onClick={() => setClaimStatus(claim, "rejected")}
                            >
                              <LuX /> Refuzo
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {section === "manage" && (
              <>
                {duplicatePlayerNames.length > 0 && (
                  <div className="admin-duplicates-box">
                    <p className="admin-duplicates-title">
                      <LuTriangleAlert /> Emra të dyfishtë te lojtarët
                    </p>
                    <div className="admin-duplicates-list">
                      {duplicatePlayerNames.map((group) => (
                        <button
                          key={group.label}
                          type="button"
                          className="admin-duplicate-chip"
                          onClick={() => {
                            setSearchType("players");
                            setSearchQuery(group.label);
                          }}
                        >
                          {group.label} ({group.players.length})
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="admin-manage-controls">
                  <div className="admin-manage-type">
                    <button
                      type="button"
                      className={searchType === "players" ? "admin-tab active" : "admin-tab"}
                      onClick={() => setSearchType("players")}
                    >
                      Lojtarë
                    </button>
                    <button
                      type="button"
                      className={searchType === "clubs" ? "admin-tab active" : "admin-tab"}
                      onClick={() => setSearchType("clubs")}
                    >
                      Klube
                    </button>
                  </div>

                  <input
                    type="text"
                    className="admin-search-input"
                    placeholder={searchType === "players" ? "Kërko lojtar..." : "Kërko klub..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {searchResults.length === 0 ? (
                  <p className="admin-empty">Asnjë rezultat.</p>
                ) : (
                  <div className="admin-manage-list">
                    {searchResults.map((item) => {
                      const label =
                        searchType === "players"
                          ? `${item.profile?.name || ""} ${item.profile?.surname || ""}`.trim()
                          : item.profile?.name || "Klub";

                      return (
                        <div key={item.uid} className="admin-manage-row">
                          <div>
                            <p className="admin-manage-name">
                              {label || "(pa emër)"}
                              {item.disabled && <span className="admin-manage-disabled-badge">Çaktivizuar</span>}
                            </p>
                            {searchType === "clubs" && item.profile?.league && (
                              <p className="admin-manage-sub">{item.profile.league}</p>
                            )}
                          </div>

                          <button
                            type="button"
                            className={item.disabled ? "admin-manage-enable" : "admin-manage-disable"}
                            disabled={togglingId === item.uid}
                            onClick={() => toggleDisabled(searchType, item)}
                          >
                            {togglingId === item.uid
                              ? "..."
                              : item.disabled
                              ? "Aktivizo"
                              : "Çaktivizo"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </section>
  );
}

export default Admin;
