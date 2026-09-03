import "./Club_Claim_Form.css";
import { useState } from "react";
import { createPortal } from "react-dom";
import { LuX } from "react-icons/lu";
import { db } from "../../firebase/firebase";
import { ref, push, set, serverTimestamp } from "firebase/database";
import { sendClaimNotification } from "../../utils/emailjsClaims";

// Buton + modal "A je përfaqësues i këtij klubi?" — shfaqet vetëm te klubet
// pa "ownerUid" (të shtuara nga admini, ende të pa-kërkuara nga askush).
// Kërkesa ruhet te clubClaims/{id} me status "pending" — asnjë llogari s'krijohet
// automatikisht këtu; Aldi i shqyrton kërkesat dhe jep qasje manualisht (për
// momentin), derisa të ndërtohet një faqe admini e dedikuar.
const ROLE_OPTIONS = [
  "Trajner",
  "Drejtor Sportiv",
  "Menaxher",
  "President/Pronar",
  "Anëtar Stafi",
  "Tjetër",
];

function Club_Claim_Form({ clubId, clubName }) {
  const [open, setOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [roleAtClub, setRoleAtClub] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const closeModal = () => {
    setOpen(false);
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim() || !roleAtClub.trim()) {
      setError("Plotëso emrin, mbiemrin, email-in, telefonin dhe rolin tënd te klubi.");
      return;
    }

    setSubmitting(true);

    try {
      const claimsRef = ref(db, "clubClaims");
      const newClaimRef = push(claimsRef);

      await set(newClaimRef, {
        clubId,
        clubName: clubName || "",
        name: `${firstName.trim()} ${lastName.trim()}`.trim(),
        email: email.trim(),
        phone: phone.trim(),
        roleAtClub: roleAtClub.trim(),
        message: message.trim(),
        status: "pending",
        createdAt: serverTimestamp(),
      });

      setSent(true);

      // Njoftimi email-it te Aldi është "best effort" — kërkesa është
      // ruajtur tashmë te clubClaims, ndaj nëse email-i dështon (rrjet,
      // kuotë e mbaruar te EmailJS, etj.) s'e prishim përvojën e kërkuesit.
      sendClaimNotification({
        clubName,
        name: `${firstName.trim()} ${lastName.trim()}`.trim(),
        email: email.trim(),
        phone: phone.trim(),
        roleAtClub: roleAtClub.trim(),
        message: message.trim(),
      }).catch((emailError) => {
        // eslint-disable-next-line no-console
        console.error("Club_Claim_Form email notification failed:", emailError);
      });
    } catch (submitError) {
      // eslint-disable-next-line no-console
      console.error("Club_Claim_Form submit error:", submitError);
      setError(`Kërkesa nuk u dërgua: ${submitError.code || submitError.message || "gabim i panjohur"}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button type="button" className="club-claim-trigger" onClick={() => setOpen(true)}>
        A je përfaqësues i këtij klubi? Kërko qasje
      </button>

      {open && createPortal(
        <div className="club-claim-backdrop" onClick={closeModal}>
          <div className="club-claim-modal" onClick={(event) => event.stopPropagation()}>
            <div className="club-claim-header">
              <h3>Kërko qasje te {clubName || "klubi"}</h3>
              <button type="button" onClick={closeModal} aria-label="Mbyll">
                <LuX />
              </button>
            </div>

            {sent ? (
              <p className="club-claim-success">
                Kërkesa u dërgua. Do të kontaktohesh nëse konfirmohet lidhja jote me klubin.
              </p>
            ) : (
              <form className="club-claim-form" onSubmit={handleSubmit}>
                <div className="club-claim-name-row">
                  <label>
                    Emri
                    <input
                      type="text"
                      value={firstName}
                      onChange={(event) => setFirstName(event.target.value)}
                    />
                  </label>

                  <label>
                    Mbiemri
                    <input
                      type="text"
                      value={lastName}
                      onChange={(event) => setLastName(event.target.value)}
                    />
                  </label>
                </div>

                <label>
                  Email
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                  <span className="club-claim-hint">Përdor një email që e kontrollon shpesh — do të të kontaktojmë aty.</span>
                </label>

                <label>
                  Telefon
                  <input
                    type="tel"
                    placeholder="p.sh. 068xxxxxxx"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                  />
                  <span className="club-claim-hint">Numri zakonisht nis me 068 ose 069.</span>
                </label>

                <label>
                  Roli yt te klubi
                  <select
                    value={roleAtClub}
                    onChange={(event) => setRoleAtClub(event.target.value)}
                  >
                    <option value="">Zgjidh rolin</option>
                    {ROLE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Mesazh (opsionale)
                  <textarea
                    rows={3}
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                  />
                </label>

                {error && <p className="club-claim-error">{error}</p>}

                <div className="club-claim-actions">
                  <button type="button" className="club-claim-cancel" onClick={closeModal}>
                    Anulo
                  </button>
                  <button type="submit" className="club-claim-submit" disabled={submitting}>
                    {submitting ? "Duke dërguar..." : "Dërgo kërkesën"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

export default Club_Claim_Form;
