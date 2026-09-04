// Fshin plotësisht një llogari nga Footbaz: Firebase Authentication +
// users/{uid} + players/{uid} (nëse ekziston). Përdor Firebase Admin SDK
// (serviceAccountKey.json, si te scriptet e tjera admin), ndaj anashkalon
// rregullat e sigurisë dhe mund të fshijë çdo llogari, jo vetëm të vetën —
// e njëjta gjë si fshirja e mëparshme e zigzag11app@gmail.com, por tani si
// script i ruajtur, i ripërdorshëm.
//
// PËRDORIMI:
//   node scripts/delete-user.cjs email@shembull.com            → DRY RUN (vetëm tregon çfarë do fshihej)
//   node scripts/delete-user.cjs email@shembull.com --confirm  → fshin realisht
//
// SHËNIM: nëse llogaria ka edhe një klub (clubs/{uid}, rasti i vetë-regjistrimit),
// ky script s'e prek atë nyje — klubi mund të ketë të dhëna reale (roster,
// ndeshje, etj.) që s'duhen fshirë pa kontroll manual. Kontrollohet dhe
// paralajmërohet, por s'fshihet automatikisht.
//
// SHËNIM 2: fotot e ngarkuara në Cloudinary (photoURL) NUK fshihen këtu —
// e njëjta kufizim e dokumentuar te "Footbaz: account deletion gap" (memory).

const admin = require("firebase-admin");
const serviceAccount = require("../serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://footbaz-default-rtdb.europe-west1.firebasedatabase.app",
});

const db = admin.database();

const email = process.argv[2];
const confirm = process.argv.includes("--confirm");

if (!email) {
  console.error("Përdorim: node scripts/delete-user.cjs email@shembull.com [--confirm]");
  process.exit(1);
}

(async () => {
  let userRecord;

  try {
    userRecord = await admin.auth().getUserByEmail(email);
  } catch (error) {
    if (error.code === "auth/user-not-found") {
      console.log(`S'ekziston asnjë llogari Auth me email-in ${email}.`);
      process.exit(0);
    }
    throw error;
  }

  const uid = userRecord.uid;

  const [usersSnap, playersSnap, clubsSnap] = await Promise.all([
    db.ref("users/" + uid).get(),
    db.ref("players/" + uid).get(),
    db.ref("clubs/" + uid).get(),
  ]);

  console.log(`\nLlogaria: ${email} (UID: ${uid})`);
  console.log(`- users/${uid}: ${usersSnap.exists() ? "EKZISTON, do fshihet" : "s'ekziston"}`);
  console.log(`- players/${uid}: ${playersSnap.exists() ? "EKZISTON, do fshihet" : "s'ekziston"}`);

  if (clubsSnap.exists()) {
    console.log(
      `- clubs/${uid}: EKZISTON — s'PREKET automatikisht nga ky script (mund të ketë të dhëna reale klubi). Fshije manualisht nëse je i sigurt.`
    );
  }

  if (!confirm) {
    console.log("\n(DRY RUN — asgjë s'u fshi. Rifute komandën me --confirm për ta bërë realisht.)");
    process.exit(0);
  }

  await admin.auth().deleteUser(uid);
  if (usersSnap.exists()) await db.ref("users/" + uid).remove();
  if (playersSnap.exists()) await db.ref("players/" + uid).remove();

  console.log("\nU fshi: llogaria Auth, users/" + uid + (playersSnap.exists() ? ", players/" + uid : "") + ".");
})().catch((error) => {
  console.error("Gabim:", error);
  process.exit(1);
});
