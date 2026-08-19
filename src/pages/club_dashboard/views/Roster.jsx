import { useState } from "react";
import { ref, set, remove } from "firebase/database";
import { db } from "../../../firebase/firebase";
import { LuPlus, LuX, LuSearch, LuTrash2, LuChevronRight } from "react-icons/lu";

function getInitials(profile) {
  const first = profile?.name?.[0] || "";
  const last = profile?.surname?.[0] || "";
  return (first + last).toUpperCase();
}

function Roster({ rosterPlayers, allPlayers, clubUid, roster, setRoster, onOpenPlayer }) {
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalSearch, setModalSearch] = useState("");
  const [adding, setAdding] = useState(false);

  const filteredRoster = rosterPlayers.filter((player) =>
    [player.profile?.name, player.profile?.surname]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const availablePlayers = Object.keys(allPlayers || {})
    .filter((id) => !roster[id])
    .map((id) => ({ uid: id, ...allPlayers[id] }))
    .filter((player) =>
      [player.profile?.name, player.profile?.surname]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(modalSearch.toLowerCase())
    );

  const addToRoster = async (playerId) => {
    if (!clubUid || adding) return;

    setAdding(true);

    try {
      const entry = { addedAt: Date.now() };
      await set(ref(db, `clubs/${clubUid}/roster/${playerId}`), entry);
      setRoster((prev) => ({ ...prev, [playerId]: entry }));
      setShowModal(false);
      setModalSearch("");
    } catch (error) {
      console.log(error.message);
    } finally {
      setAdding(false);
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
                    onClick={() => addToRoster(player.uid)}
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
