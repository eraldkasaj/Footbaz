import { useState } from "react";
import { ref, push, set, remove } from "firebase/database";
import { db } from "../../../firebase/firebase";
import { LuPlus, LuX, LuChevronLeft, LuChevronRight, LuTrash2 } from "react-icons/lu";
import { MONTH_NAMES, WEEKDAY_LABELS, formatDateShort } from "../../../utils/time";

// E RËNDËSISHME: përdor komponentët LOKALË të datës, jo .toISOString() (që
// konverton në UTC). Shqipëria është UTC+1/+2, kështu që mesnata lokale e
// një dite (p.sh. qeliza e kalendarit për "6 Shtator") bie te 22:00-23:00 UTC
// e ditës PARA — .toISOString() do ta kthente gabimisht si "5 Shtator", duke
// bërë që stërvitjet e shtuara për datën 5 të duken të vendosura te dita 6.
function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function Trainings({ clubUid, trainings, setTrainings }) {
  const [monthCursor, setMonthCursor] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: "", date: toDateKey(new Date()), time: "", location: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedDayKey, setSelectedDayKey] = useState(null);

  const trainingEntries = Object.entries(trainings || {}).map(([id, t]) => ({ id, ...t }));

  // Harta datë -> lista e stërvitjeve atë ditë (jo thjesht një Set/bool si më
  // parë) — kështu kur klikohet një ditë e theksuar, mund t'i tregojmë vetë
  // titullin/orën/vendin, jo vetëm ta dimë që "ka diçka".
  const trainingsByDate = new Map();
  trainingEntries.forEach((t) => {
    const d = new Date(t.date);
    if (Number.isNaN(d.getTime())) return;
    const key = toDateKey(d);
    if (!trainingsByDate.has(key)) trainingsByDate.set(key, []);
    trainingsByDate.get(key).push(t);
  });

  const selectedDayTrainings = selectedDayKey ? trainingsByDate.get(selectedDayKey) || [] : [];

  const year = monthCursor.getFullYear();
  const month = monthCursor.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingEmpty = (firstDay.getDay() + 6) % 7; // Monday-first grid

  const calendarCells = [
    ...Array.from({ length: leadingEmpty }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const upcoming = trainingEntries
    .filter((t) => new Date(t.date) >= new Date(new Date().toDateString()))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const openModal = () => {
    setForm({ title: "", date: toDateKey(new Date()), time: "", location: "" });
    setError("");
    setShowModal(true);
  };

  const addTraining = async (e) => {
    e.preventDefault();

    if (!form.title.trim() || !form.date) {
      setError("Plotëso të paktën titullin dhe datën.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const trainingRef = push(ref(db, `clubTrainings/${clubUid}`));
      const entry = {
        title: form.title.trim(),
        date: form.date,
        time: form.time,
        location: form.location.trim(),
        createdAt: Date.now(),
      };

      await set(trainingRef, entry);
      setTrainings((prev) => ({ ...prev, [trainingRef.key]: entry }));
      setShowModal(false);
    } catch (saveError) {
      setError(saveError.message || "Stërvitja nuk u shtua dot.");
    } finally {
      setSaving(false);
    }
  };

  const deleteTraining = async (id) => {
    if (!window.confirm("Ta fshish këtë stërvitje?")) return;

    try {
      await remove(ref(db, `clubTrainings/${clubUid}/${id}`));
      setTrainings((prev) => {
        const next = { ...prev };
        delete next[id];
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
          <h1>Sfidat / Stërvitjet</h1>
          <p>Programo dhe menaxho stërvitjet e klubit.</p>
        </div>

        <button type="button" className="club-btn-primary" onClick={openModal}>
          <LuPlus /> Shto Stërvitje
        </button>
      </div>

      <div className="club-panel" style={{ marginBottom: 20 }}>
        <div className="club-calendar-nav">
          <button
            type="button"
            onClick={() => {
              setMonthCursor(new Date(year, month - 1, 1));
              setSelectedDayKey(null);
            }}
          >
            <LuChevronLeft />
          </button>
          <span>
            {MONTH_NAMES[month]} {year}
          </span>
          <button
            type="button"
            onClick={() => {
              setMonthCursor(new Date(year, month + 1, 1));
              setSelectedDayKey(null);
            }}
          >
            <LuChevronRight />
          </button>
        </div>

        <div className="club-calendar-grid">
          {WEEKDAY_LABELS.map((label) => (
            <div className="club-calendar-weekday" key={label}>
              {label}
            </div>
          ))}

          {calendarCells.map((day, index) => {
            if (!day) return <div className="club-calendar-day is-empty" key={`empty-${index}`} />;

            const dateKey = toDateKey(new Date(year, month, day));
            const hasTraining = trainingsByDate.has(dateKey);

            return (
              <div
                className={`club-calendar-day ${hasTraining ? "has-training" : ""} ${
                  selectedDayKey === dateKey ? "is-selected" : ""
                }`}
                key={dateKey}
                onClick={() => hasTraining && setSelectedDayKey((prev) => (prev === dateKey ? null : dateKey))}
              >
                {day}
              </div>
            );
          })}
        </div>

        {selectedDayTrainings.length > 0 && (
          <div className="club-calendar-selected-day">
            {selectedDayTrainings.map((t) => (
              <div className="club-training-row" key={t.id}>
                <span className="club-training-date">{formatDateShort(t.date)}</span>

                <div className="club-training-info" style={{ flex: 1 }}>
                  <h4>{t.title}</h4>
                  <p>
                    {t.time ? `${t.time} · ` : ""}
                    {t.location || "Vendi nuk është vendosur"}
                  </p>
                </div>

                <button type="button" className="club-icon-btn danger" onClick={() => deleteTraining(t.id)}>
                  <LuTrash2 />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="club-panel">
        <h3>Stërvitjet e Planifikuara</h3>

        {upcoming.length === 0 ? (
          <p className="club-empty">Nuk ka stërvitje të planifikuara.</p>
        ) : (
          upcoming.map((t) => (
            <div className="club-training-row" key={t.id}>
              <span className="club-training-date">{formatDateShort(t.date)}</span>

              <div className="club-training-info" style={{ flex: 1 }}>
                <h4>{t.title}</h4>
                <p>
                  {t.time ? `${t.time} · ` : ""}
                  {t.location || "Vendi nuk është vendosur"}
                </p>
              </div>

              <button type="button" className="club-icon-btn danger" onClick={() => deleteTraining(t.id)}>
                <LuTrash2 />
              </button>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="club-modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="club-modal" onClick={(e) => e.stopPropagation()}>
            <div className="club-modal-header">
              <h3>Shto Stërvitje</h3>
              <button type="button" onClick={() => setShowModal(false)} aria-label="Mbyll">
                <LuX />
              </button>
            </div>

            {error && <p className="club-form-error">{error}</p>}

            <form onSubmit={addTraining}>
              <div className="club-form-group">
                <label>Titulli</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="p.sh. Kondicion Fizik"
                />
              </div>

              <div className="club-form-row">
                <div className="club-form-group">
                  <label>Data</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                  />
                </div>

                <div className="club-form-group">
                  <label>Ora</label>
                  <input
                    type="time"
                    value={form.time}
                    onChange={(e) => setForm((p) => ({ ...p, time: e.target.value }))}
                  />
                </div>
              </div>

              <div className="club-form-group">
                <label>Vendi</label>
                <input
                  value={form.location}
                  onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                  placeholder="p.sh. Stadiumi i Qytetit"
                />
              </div>

              <div className="club-form-actions">
                <button type="button" className="club-form-cancel" onClick={() => setShowModal(false)}>
                  Anulo
                </button>
                <button type="submit" className="club-btn-primary" disabled={saving}>
                  {saving ? "Duke ruajtur..." : "Shto Stërvitjen"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default Trainings;
