import { useState } from "react";
import { ref, push, set, remove } from "firebase/database";
import { db } from "../../../firebase/firebase";
import { LuPlus, LuX, LuTrash2, LuUserCog } from "react-icons/lu";

function Staff({ clubUid, staff, setStaff }) {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", role: "", age: "", phone: "", startDate: "", photoURL: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const staffList = Object.entries(staff || {}).map(([id, s]) => ({ id, ...s }));

  const openModal = () => {
    setForm({ name: "", role: "", age: "", phone: "", startDate: "", photoURL: "" });
    setError("");
    setShowModal(true);
  };

  const uploadPhoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "footbaz_players");

      const response = await fetch("https://api.cloudinary.com/v1_1/xqdb7tam/image/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      setForm((p) => ({ ...p, photoURL: data.secure_url }));
    } catch (uploadError) {
      console.log(uploadError.message);
    } finally {
      setUploading(false);
    }
  };

  const addStaff = async (e) => {
    e.preventDefault();

    if (!form.name.trim() || !form.role.trim()) {
      setError("Plotëso emrin dhe rolin.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const staffRef = push(ref(db, `clubStaff/${clubUid}`));
      const entry = {
        name: form.name.trim(),
        role: form.role.trim(),
        age: form.age.trim(),
        phone: form.phone.trim(),
        startDate: form.startDate,
        photoURL: form.photoURL,
        addedAt: Date.now(),
      };

      await set(staffRef, entry);
      setStaff((prev) => ({ ...prev, [staffRef.key]: entry }));
      setShowModal(false);
    } catch (saveError) {
      setError(saveError.message || "Stafi nuk u shtua dot.");
    } finally {
      setSaving(false);
    }
  };

  const removeStaff = async (id) => {
    if (!window.confirm("Ta heqësh këtë anëtar stafi?")) return;

    try {
      await remove(ref(db, `clubStaff/${clubUid}/${id}`));
      setStaff((prev) => {
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
          <h1>Stafi</h1>
          <p>Trajnerët dhe stafi teknik i klubit.</p>
        </div>

        <button type="button" className="club-btn-primary" onClick={openModal}>
          <LuPlus /> Shto Staf
        </button>
      </div>

      {staffList.length === 0 ? (
        <p className="club-empty">Ende s'ke shtuar asnjë anëtar stafi.</p>
      ) : (
        <div className="club-staff-grid">
          {staffList.map((s) => (
            <div className="club-staff-card" key={s.id}>
              <button type="button" className="club-staff-remove" onClick={() => removeStaff(s.id)}>
                <LuX />
              </button>

              <div className="club-staff-photo">
                {s.photoURL ? <img src={s.photoURL} alt={s.name} /> : <LuUserCog />}
              </div>

              <h4>{s.name}</h4>
              <p>{s.role}</p>

              {(s.age || s.phone) && (
                <p className="club-staff-meta">
                  {[s.age ? `${s.age} vjeç` : null, s.phone || null].filter(Boolean).join(" · ")}
                </p>
              )}

              {s.startDate && (
                <p className="club-staff-meta">Që nga {s.startDate}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="club-modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="club-modal" onClick={(e) => e.stopPropagation()}>
            <div className="club-modal-header">
              <h3>Shto Anëtar Stafi</h3>
              <button type="button" onClick={() => setShowModal(false)} aria-label="Mbyll">
                <LuX />
              </button>
            </div>

            {error && <p className="club-form-error">{error}</p>}

            <form onSubmit={addStaff}>
              <div className="club-form-group">
                <label>Emri</label>
                <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="p.sh. Arben Strakosha" />
              </div>

              <div className="club-form-group">
                <label>Roli</label>
                <input value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))} placeholder="p.sh. Trajner Kryesor" />
              </div>

              <div className="club-form-group">
                <label>Mosha (opsionale)</label>
                <input
                  value={form.age}
                  onChange={(e) => setForm((p) => ({ ...p, age: e.target.value.replace(/\D/g, "").slice(0, 2) }))}
                  placeholder="p.sh. 45"
                  inputMode="numeric"
                />
              </div>

              <div className="club-form-group">
                <label>Telefon (opsionale)</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="p.sh. 068xxxxxxx"
                />
              </div>

              <div className="club-form-group">
                <label>Pjesë e ekipit që nga (opsionale)</label>
                <input
                  value={form.startDate}
                  onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value.replace(/\D/g, "").slice(0, 4) }))}
                  placeholder="p.sh. 2024"
                  inputMode="numeric"
                  maxLength={4}
                />
              </div>

              <div className="club-form-group">
                <label>Foto (opsionale)</label>
                <label className="club-upload-label">
                  {uploading ? "Duke ngarkuar..." : "Ngarko foto"}
                  <input type="file" accept="image/*" onChange={uploadPhoto} disabled={uploading} />
                </label>
                {form.photoURL && <img src={form.photoURL} alt="Preview" style={{ width: 60, height: 60, borderRadius: 12, marginTop: 10, objectFit: "cover" }} />}
              </div>

              <div className="club-form-actions">
                <button type="button" className="club-form-cancel" onClick={() => setShowModal(false)}>
                  Anulo
                </button>
                <button type="submit" className="club-btn-primary" disabled={saving}>
                  {saving ? "Duke ruajtur..." : "Shto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default Staff;
