import emailjs from "@emailjs/browser";

// Konfigurimi i EmailJS — dërgon email direkt nga browser-i, pa server/backend
// dhe pa kërkuar upgrade të Firebase në planin Blaze. "Public Key" këtu është
// menduar të jetë publike (njësoj si Firebase apiKey te firebase.js), jo
// sekret; mbrojtja vjen nga limitet e vetë EmailJS (200 email/muaj falas).
const EMAILJS_SERVICE_ID = "service_17cuu8c";
const EMAILJS_PUBLIC_KEY = "qYFnp8DTkIUnsjj4T";

// Template 1: njofton Aldin (footbazinfo@gmail.com) kur dikush dërgon
// kërkesë të re "Kërko qasje" për një klub.
const EMAILJS_TEMPLATE_NEW_CLAIM = "template_qkfvmb9";

// Template 2: i përgjigjet automatikisht kërkuesit kur statusi i kërkesës
// së tij ndryshon (aprovohet/refuzohet) te faqja Admin.
const EMAILJS_TEMPLATE_CLAIM_STATUS = "template_txvbcni";

// Të dyja funksionet më poshtë janë "best effort": nëse EmailJS dështon
// (rrjet, kuotë e mbaruar, etj.), kjo s'duhet të prishë veprimin kryesor
// (ruajtja e kërkesës te clubClaims, ose ndryshimi i statusit te Admin) —
// thirrësi i tyre e kap gabimin veç e veç dhe vetëm e loggon.
export function sendClaimNotification({ clubName, name, email, phone, roleAtClub, message }) {
  return emailjs.send(
    EMAILJS_SERVICE_ID,
    EMAILJS_TEMPLATE_NEW_CLAIM,
    {
      club_name: clubName || "",
      from_name: name,
      from_email: email,
      phone,
      role: roleAtClub,
      message: message || "(pa mesazh)",
    },
    { publicKey: EMAILJS_PUBLIC_KEY }
  );
}

export function sendClaimStatusUpdate({ toEmail, toName, clubName, status, tempPassword }) {
  const statusLabel = status === "approved" ? "u aprovua" : "u refuzua";
  const statusMessage =
    status === "approved"
      ? `Llogaria jote në Footbaz u krijua. Hyr te footbaz.com/login me email-in ${toEmail} dhe fjalëkalimin ${tempPassword}.`
      : "Nëse mendon se ka gabim, na shkruaj te footbazinfo@gmail.com.";

  return emailjs.send(
    EMAILJS_SERVICE_ID,
    EMAILJS_TEMPLATE_CLAIM_STATUS,
    {
      to_email: toEmail,
      to_name: toName || "",
      club_name: clubName || "",
      status: statusLabel,
      status_message: statusMessage,
    },
    { publicKey: EMAILJS_PUBLIC_KEY }
  );
}
