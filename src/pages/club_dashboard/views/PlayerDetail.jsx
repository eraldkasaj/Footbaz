import { useState } from "react";
import { ref, update, push, set, remove } from "firebase/database";
import { db } from "../../../firebase/firebase";
import {
  LuArrowLeft,
  LuFootprints,
  LuPencil,
  LuCheck,
  LuUpload,
  LuFileText,
  LuTrash2,
} from "react-icons/lu";
import { formatBirthdate, getPlayerAge } from "../../../utils/age";
import { formatDateShort } from "../../../utils/time";

const statItems = [
  ["matches", "Ndeshje"],
  ["goals", "Gola"],
  ["assists", "Asistime"],
  ["yellowCards", "Kartona të verdhë"],
  ["redCards", "Kartona të kuq"],
  ["minutes", "Minuta të luajtura"],
];

function PlayerDetail({
  player,
  playerId,
  clubUid,
  clubName,
  rosterEntry,
  setRoster,
  trainings,
  setTrainings,
  playerDocuments,
  setDocuments,
  onBack,
}) {
  const [activeTab, setActiveTab] = useState("Përmbledhje");
  const [editingJersey, setEditingJersey] = useState(false);
  const [jerseyValue, setJerseyValue] = useState(rosterEntry.jerseyNumber || "");
  const [uploading, setUploading] = useState(false);

  const profile = player.profile || {};
  const stats = player.statistics || {};
  const fullName = [profile.name, profile.surname].filter(Boolean).join(" ");
  const birthdate = profile.birthdate || profile.dateOfBirth;
  const age = getPlayerAge(profile);

  const dominantFootLabel =
    profile.dominantFoot === "Right" ? "E djathtë" :
    profile.dominantFoot === "Left" ? "E majtë" :
    profile.dominantFoot === "Both" ? "Të dyja" : "—";

  const saveJersey = async () => {
    try {
      await update(ref(db, `clubs/${clubUid}/roster/${playerId}`), { jerseyNumber: jerseyValue });
      setRoster((prev) => ({ ...prev, [playerId]: { ...prev[playerId], jerseyNumber: jerseyValue } }));
      setEditingJersey(false);
    } catch (error) {
      console.log(error.message);
    }
  };

  // ---------------- Attendance ----------------

  const trainingEntries = Object.entries(trainings || {})
    .map(([id, t]) => ({ id, ...t }))
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const markedEntries = trainingEntries.filter((t) => t.attendance && playerId in t.attendance);
  const presentCount = markedEntries.filter((t) => t.attendance[playerId]).length;
  const attendancePct = markedEntries.length > 0 ? Math.round((presentCount / markedEntries.length) * 100) : null;

  const setAttendance = async (trainingId, present) => {
    try {
      await update(ref(db, `clubTrainings/${clubUid}/${trainingId}/attendance`), { [playerId]: present });
      setTrainings((prev) => ({
        ...prev,
        [trainingId]: {
          ...prev[trainingId],
          attendance: { ...(prev[trainingId]?.attendance || {}), [playerId]: present },
        },
      }));
    } catch (error) {
      console.log(error.message);
    }
  };

  // ---------------- Documents ----------------
  // Ruhen te nyja krejt e veçantë clubDocuments/{clubUid}/{playerId}/{docId},
  // jo brenda "clubs" (i cili është publik: profile/roster/matches) — rregullat
  // e Firebase shkojnë vetëm poshtë, prandaj dokumentet private (kontrata, ID,
  // etj.) duhet të jenë jashtë degës publike që të mos "ngjiten" publike.

  const documents = Object.entries(playerDocuments || {}).map(([id, doc]) => ({ id, ...doc }));

  const uploadDocument = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "footbaz_players");

      const response = await fetch("https://api.cloudinary.com/v1_1/xqdb7tam/auto/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      const docRef = push(ref(db, `clubDocuments/${clubUid}/${playerId}`));
      const docEntry = { name: file.name, url: data.secure_url, uploadedAt: Date.now() };

      await set(docRef, docEntry);

      setDocuments((prev) => ({
        ...prev,
        [playerId]: { ...(prev[playerId] || {}), [docRef.key]: docEntry },
      }));
    } catch (error) {
      console.log(error.message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const deleteDocument = async (docId) => {
    if (!window.confirm("Ta fshish këtë dokument?")) return;

    try {
      await remove(ref(db, `clubDocuments/${clubUid}/${playerId}/${docId}`));
      setDocuments((prev) => {
        const nextDocs = { ...(prev[playerId] || {}) };
        delete nextDocs[docId];
        return { ...prev, [playerId]: nextDocs };
      });
    } catch (error) {
      console.log(error.message);
    }
  };

  return (
    <>
      <button type="button" className="club-back-btn" onClick={onBack}>
        <LuArrowLeft /> Kthehu te Lojtarët
      </button>

      <div className="club-detail-header">
        <div className="club-detail-photo">
          {profile.photoURL ? <img src={profile.photoURL} alt={fullName} /> : <span>{fullName.slice(0, 2).toUpperCase()}</span>}
        </div>

        <div className="club-detail-info">
          <h2>{fullName}</h2>

          <div className="club-detail-facts">
            <span>{profile.position || "Pozicioni nuk është vendosur"}</span>
            <span>{age ?? "—"} vjeç</span>
            {birthdate && <span>{formatBirthdate(birthdate)}</span>}
            <span>{profile.nationality || "—"}</span>
          </div>
        </div>

        <span className="club-detail-club-chip">{clubName}</span>
      </div>

      <nav className="club-detail-tabs">
        {["Përmbledhje", "Statistikat", "Prania", "Dokumente"].map((tab) => (
          <button
            key={tab}
            type="button"
            className={activeTab === tab ? "is-active" : ""}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </nav>

      {activeTab === "Përmbledhje" && (
        <div className="club-detail-grid">
          <div className="club-panel">
            <h3>Informacione</h3>

            <div className="club-detail-row">
              <span>Pozicioni</span>
              <span>{profile.position || "—"}</span>
            </div>

            <div className="club-detail-row">
              <span>Numri i Fanellës</span>
              {editingJersey ? (
                <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    value={jerseyValue}
                    onChange={(e) => setJerseyValue(e.target.value.replace(/\D/g, "").slice(0, 2))}
                    style={{ width: 48, background: "var(--cd-panel-2)", border: "1px solid var(--border)", borderRadius: 6, color: "var(--text-primary)", padding: "4px 8px" }}
                  />
                  <button type="button" className="club-icon-btn" onClick={saveJersey} title="Ruaj">
                    <LuCheck />
                  </button>
                </span>
              ) : (
                <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  {rosterEntry.jerseyNumber || "—"}
                  <button type="button" className="club-icon-btn" onClick={() => setEditingJersey(true)} title="Ndrysho">
                    <LuPencil />
                  </button>
                </span>
              )}
            </div>

            <div className="club-detail-row">
              <span>Gjatësia</span>
              <span>{profile.height ? `${profile.height} cm` : "—"}</span>
            </div>

            <div className="club-detail-row">
              <span>Pesha</span>
              <span>{profile.weight ? `${profile.weight} kg` : "—"}</span>
            </div>

            <div className="club-detail-row">
              <span><LuFootprints /> Këmba Dominante</span>
              <span>{dominantFootLabel}</span>
            </div>
          </div>

          <div className="club-panel">
            <h3>Statistikat Kryesore</h3>
            <div className="club-detail-stat-grid">
              {statItems.slice(0, 4).map(([key, label]) => (
                <div key={key}>
                  <span>{label}</span>
                  <strong>{stats[key] || 0}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "Statistikat" && (
        <div className="club-panel">
          <h3>Statistikat e Sezonit</h3>
          <div className="club-detail-stat-grid">
            {statItems.map(([key, label]) => (
              <div key={key}>
                <span>{label}</span>
                <strong>{stats[key] || 0}</strong>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "Prania" && (
        <div className="club-panel">
          <div className="club-attendance-header">
            <h3 style={{ margin: 0 }}>Prania në Stërvitje</h3>
            <span className="club-attendance-pct">{attendancePct === null ? "—" : `${attendancePct}%`}</span>
          </div>

          {trainingEntries.length === 0 ? (
            <p className="club-empty">Ende s'ka stërvitje të planifikuara.</p>
          ) : (
            trainingEntries.map((t) => (
              <div className="club-attendance-row" key={t.id}>
                <span>
                  {formatDateShort(t.date)} — {t.title}
                </span>

                <div className="club-attendance-toggle">
                  <button
                    type="button"
                    className={`present ${t.attendance?.[playerId] === true ? "is-active" : ""}`}
                    onClick={() => setAttendance(t.id, true)}
                  >
                    Prezent
                  </button>
                  <button
                    type="button"
                    className={`absent ${t.attendance?.[playerId] === false ? "is-active" : ""}`}
                    onClick={() => setAttendance(t.id, false)}
                  >
                    Mungon
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "Dokumente" && (
        <div className="club-panel">
          <h3>Dokumentet</h3>

          {documents.length === 0 ? (
            <p className="club-empty">Ende s'ka dokumente të ngarkuara.</p>
          ) : (
            documents.map((doc) => (
              <div className="club-doc-row" key={doc.id}>
                <a href={doc.url} target="_blank" rel="noreferrer">
                  <LuFileText /> {doc.name}
                </a>
                <button type="button" className="club-icon-btn danger" onClick={() => deleteDocument(doc.id)}>
                  <LuTrash2 />
                </button>
              </div>
            ))
          )}

          <label className="club-upload-label">
            <LuUpload /> {uploading ? "Duke ngarkuar..." : "Ngarko dokument"}
            <input type="file" onChange={uploadDocument} disabled={uploading} />
          </label>
        </div>
      )}
    </>
  );
}

export default PlayerDetail;
