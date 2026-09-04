import { useState } from "react";
import { ref, set, remove, update } from "firebase/database";
import { db } from "../../../firebase/firebase";
import { LuPlus, LuX, LuSearch, LuTrash2, LuChevronRight, LuCheck } from "react-icons/lu";

function getInitials(profile) {
  const first = profile?.name?.[0] || "";
  const last = profile?.surname?.[0] || "";
  return (first + last).toUpperCase();
}

// Shtimi i një lojtari NUK e fut më direkt te roster-i — krijon një "ftesë"
// (rosterRequests/{clubId}_{playerId}) që lojtari duhet ta pranojë vetë te
// dashboard-i i tij. Njësoj, një lojtar mund të kërkojë vetë t'i bashkohet
// klubit (initiatedBy: "player") — ato kërkesa shfaqen këtu për t'u
// pranuar/refuzuar. Kjo shmang shtimin e një lojtari pa dijeninë e tij.
function Roster({ rosterPlayers, allPlayers, clubUid, clubName, roster, setRoster, rosterRequests, setRosterRequests, onOpenPlayer }) {
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalSearch, setModalSearch] = useState("");
  const [inviting, setInviting] = useState(false);
  const [respondingId, setRespondingId] = useState(null);

  const filteredRoster = rosterPlayers.filter((player) =>
    [player.profile?.name, player.profile?.surname]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const requestList = Object.entries(rosterRequests || {}).map(([id, r]) => ({ id, ...r }));
  const outgoingInvites = requestList.filter((r) => r.initiatedBy === "club");
  const incomingJoinRequests = requestList.filter((r) => r.initiatedBy === "player");
  const requestedPlayerIds = new Set(requestList.map((r) => r.playerId));

  const availablePlayers = Object.keys(allPlayers || {})
    .filter((id) => !roster[id] && !requestedPlayerIds.has(id))
    .map((id) => ({ uid: id, ...allPlayers[id] }))
    .filter((player) =>
      [player.profile?.name, player.profile?.surname]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(modalSearch.toLowerCase())
    );

  const sendInvite = async (playerId) => {
    if (!clubUid || inviting) return;

    setInviting(true);

    try {
      const requestId = `${clubUid}_${playerId}`;
      const entry = {
        clubId: clubUid,
        playerId,
        initiatedBy: "club",
        status: "pending",
        clubName: clubName || "",
        createdAt: Date.now(),
      };

      await set(ref(db, `rosterRequests/${requestId}`), entry);
      setRosterRequests((prev) => ({ ...prev, [requestId]: entry }));
      setShowModal(false);
      setModalSearch("");
    } catch (error) {
      console.log(error.message);
    } finally {
      setInviting(false);
    }
  };

  const cancelInvite = async (requestId) => {
    try {
      await remove(ref(db, `rosterRequests/${requestId}`));
      setRosterRequests((prev) => {
        const next = { ...prev };
        delete next[requestId];
        return next;
      });
    } catch (error) {
      console.log(error.message);
    }
  };

  const respondToJoinRequest = async (request, accept) => {
    if (respondingId) return;

    setRespondingId(request.id);

    try {
      if (accept) {
        const rosterEntry = { addedAt: Date.now() };

        await update(ref(db), {
          [`clubs/${clubUid}/roster/${request.playerId}`]: rosterEntry,
          [`rosterRequests/${request.id}`]: null,
        });

        setRoster((prev) => ({ ...prev, [request.playerId]: rosterEntry }));
      } else {
        await remove(ref(db, `rosterRequests/${request.id}`));
      }

      setRosterRequests((prev) => {
        const next = { ...prev };
        delete next[request.id];
        return next;
      });
    } catch (error) {
      console.log(error.message);
    } finally {
      setRespondingId(null);
    }
  };

  const removeFromRoster = async (playerId, event) => {
    event.stopPropagation();

    if (!clubUid) return;

    if (!window.confirm("Ta heqësh këtë lojtar nga skuadra?")) return;

    try {
      await remove(ref(db, `clubs/${clubUid}/roster/${playerId}`));
      setRoster((prev) => {
        const next = { ...prev };
        delete next[playerId];
        return next;
      });
    } catch (error) {
      console.log(error.message);
    }
  };

  return (
    <>
      <div className="club-header">
        <div>
          <h1>Lista e Lojtarëve</h1>
          <p>Menaxho skuadrën e klubit tënd.</p>
        </div>

        <div className="club-header-actions">
          <div className="club-search-input">
            <LuSearch />
            <input
              type="text"
              placeholder="Kërko lojtar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <button type="button" className="club-btn-primary" onClick={() => setShowModal(true)}>
            <LuPlus /> Shto Lojtar
          </button>
        </div>
      </div>

      {incomingJoinRequests.length > 0 && (
        <div className="club-panel" style={{ marginBottom: 20 }}>
          <h3>Kërkesa për t'u Bashkuar</h3>

          {incomingJoinRequests.map((request) => {
            const player = allPlayers?.[request.playerId];
            const profile = player?.profile;
            const fullName = [profile?.name, profile?.surname].filter(Boolean).join(" ") || "Lojtar";

            return (
              <div className="club-request-row" key={request.id}>
                <div className="player-photo">
                  {profile?.photoURL ? <img src={profile.photoURL} alt={fullName} /> : <span>{getInitials(profile)}</span>}
                </div>

                <div className="club-request-info">
                  <h4>{fullName}</h4>
                  <p>{profile?.position || "Pozicioni nuk është vendosur"}</p>
                </div>

                <div className="club-request-actions">
                  <button
                    type="button"
                    className="club-btn-primary"
                    disabled={respondingId === request.id}
                    onClick={() => respondToJoinRequest(request, true)}
                  >
                    <LuCheck /> Prano
                  </button>
                  <button
                    type="button"
                    className="club-icon-btn danger"
                    disabled={respondingId === request.id}
                    onClick={() => respondToJoinRequest(request, false)}
                    title="Refuzo"
                  >
                    <LuX />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {outgoingInvites.length > 0 && (
        <div className="club-panel" style={{ marginBottom: 20 }}>
          <h3>Ftesa në Pritje</h3>

          {outgoingInvites.map((invite) => {
            const player = allPlayers?.[invite.playerId];
            const profile = player?.profile;
            const fullName = [profile?.name, profile?.surname].filter(Boolean).join(" ") || "Lojtar";

            return (
              <div className="club-request-row" key={invite.id}>
                <div className="player-photo">
                  {profile?.photoURL ? <img src={profile.photoURL} alt={fullName} /> : <span>{getInitials(profile)}</span>}
                </div>

                <div className="club-request-info">
                  <h4>{fullName}</h4>
                  <p>Ftesë e dërguar — në pritje të përgjigjes</p>
                </div>

                <div className="club-request-actions">
                  <button type="button" className="club-icon-btn danger" onClick={() => cancelInvite(invite.id)} title="Anulo ftesën">
                    <LuTrash2 />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="club-panel">
        {filteredRoster.length === 0 ? (
          <p className="club-empty">
            {rosterPlayers.length === 0
              ? "Ende s'ke shtuar asnjë lojtar në skuadër."
              : "Nuk u gjet asnjë lojtar me këto kritere."}
          </p>
        ) : (
          filteredRoster.map((player) => (
            <div className="club-player-card" key={player.uid} onClick={() => onOpenPlayer(player.uid)}>
              <div className="player-photo">
                {player.profile?.photoURL ? (
                  <img src={player.profile.photoURL} alt={player.profile?.name} />
                ) : (
                  <span>{getInitials(player.profile)}</span>
                )}
              </div>

              <div className="player-main">
                <h3>
                  {player.profile?.name} {player.profile?.surname}
                </h3>
                <p className="player-club">{player.profile?.position || "Pozicioni nuk është vendosur"}</p>
              </div>

              <div className="player-col">
                <span className="player-col-label">Numri</span>
                <span className="player-col-value">{player.jerseyNumber || "—"}</span>
              </div>

              <div className="player-col">
                <span className="player-col-label">Mosha</span>
                <span className="player-col-value">{player.profile?.age ?? "—"}</span>
              </div>

              <div className="player-col">
                <span className="player-col-label">Lartësia</span>
                <span className="player-col-value">
                  {player.profile?.height ? `${player.profile.height} cm` : "—"}
                </span>
              </div>

              <div className="player-actions">
                <button
                  type="button"
                  className="club-icon-btn danger"
                  onClick={(e) => removeFromRoster(player.uid, e)}
                  title="Hiq nga skuadra"
                >
                  <LuTrash2 />
                </button>
                <button type="button" className="club-icon-btn" title="Shiko profilin">
                  <LuChevronRight />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="club-modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="club-modal" onClick={(e) => e.stopPropagation()}>
            <div className="club-modal-header">
              <h3>Shto Lojtar</h3>
              <button type="button" onClick={() => setShowModal(false)} aria-label="Mbyll">
                <LuX />
              </button>
            </div>

            <p className="club-modal-hint">
              Lojtari duhet ta pranojë ftesën nga dashboard-i i tij para se të shfaqet te skuadra.
            </p>

            <div className="club-modal-search">
              <LuSearch />
              <input
                type="text"
                placeholder="Kërko lojtar sipas emrit..."
                value={modalSearch}
                onChange={(e) => setModalSearch(e.target.value)}
              />
            </div>

            <div className="club-modal-list">
              {availablePlayers.length === 0 ? (
                <p className="club-empty">Nuk u gjet asnjë lojtar.</p>
              ) : (
                availablePlayers.map((player) => (
                  <div
                    className="club-modal-player-row"
                    key={player.uid}
                    onClick={() => sendInvite(player.uid)}
                  >
                    <div className="player-photo">
                      {player.profile?.photoURL ? (
                        <img src={player.profile.photoURL} alt={player.profile?.name} />
                      ) : (
                        <span>{getInitials(player.profile)}</span>
                      )}
                    </div>

                    <div>
                      <h4>
                        {player.profile?.name} {player.profile?.surname}
                      </h4>
                      <p>{player.profile?.position || "Pozicioni nuk është vendosur"}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Roster;
