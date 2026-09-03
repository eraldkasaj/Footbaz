import "./Admin.css";
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { auth, db } from "../../firebase/firebase";
import { ref, get, update } from "firebase/database";
import { LuArrowLeft, LuCheck, LuX } from "react-icons/lu";
import { sendClaimStatusUpdate } from "../../utils/emailjsClaims";
import { createManagedClubAccount, generateTempPassword } from "../../utils/manageClubAccount";

const STATUS_LABELS = {
  pending: "Në pritje",
  approved: "Aprovuar",
  rejected: "Refuzuar",
};

// Paneli i administratorit — për momentin vetëm shqyrtimi i kërkesave për
// klube (clubClaims). Qasja lejohet vetëm te llogaria me users/{uid}/role
// === "admin" (kontrollohet edhe nga rregullat e Firebase, jo vetëm këtu).
// Aprovimi krijon vetë një llogari Footbaz për kërkuesin (email + fjalëkalim
// i përkohshëm, pa prekur sesionin e Aldit — shih manageClubAccount.js),
// e lidh si ownerUid te klubi, dhe ia dërgon kredencialet me email. Rregulli
// i Firebase lejon "admin" të shkruajë VETËM fushën ownerUid të klubeve,
// asgjë tjetër.
function Admin() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [claims, setClaims] = useState([]);
  const [loadingClaims, setLoadingClaims] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [actioningId, setActioningId] = useState(null);
  const [actionError, setActionError] = useState("");

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

    const loadClaims = async () => {
      const snapshot = await get(ref(db, "clubClaims"));

      if (snapshot.exists()) {
        const data = snapshot.val();
        const list = Object.keys(data)
          .map((id) => ({ id, ...data[id] }))
          .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

        setClaims(list);
      }

      setLoadingClaims(false);
    };

    loadClaims();
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

  const visibleClaims = claims.filter((claim) => (claim.status || "pending") === statusFilter);

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
          <h1>Kërkesat për Klube</h1>
          <span>Shqyrto kërkesat e njerëzve që duan qasje te një klub ekzistues.</span>
        </header>

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

        {loadingClaims ? (
          <p className="admin-empty">Duke ngarkuar...</p>
        ) : visibleClaims.length === 0 ? (
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
      </div>
    </section>
  );
}

export default Admin;
