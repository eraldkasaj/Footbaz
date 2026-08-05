const { initializeApp } = require("firebase/app");
const { getAuth, createUserWithEmailAndPassword } = require("firebase/auth");
const { getDatabase, ref, set } = require("firebase/database");

const firebaseConfig = {
  apiKey: "AIzaSyAIOS-HQoAOjAZWcJ22dqu45-WRajAZ-q4",
  authDomain: "footbaz.firebaseapp.com",
  databaseURL: "https://footbaz-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "footbaz",
  storageBucket: "footbaz.firebasestorage.app",
  messagingSenderId: "719543232765",
  appId: "1:719543232765:web:95e3663096cc5d09417694",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

const LEAGUE = "U-19 Abissnet Superiore";

const clubs = [
  { name: "Dinamo City", city: "Tiranë", country: "Shqipëri" },
  { name: "Vllaznia", city: "Shkodër", country: "Shqipëri" },
  { name: "FK Vora", city: "Vorë", country: "Shqipëri" },
  { name: "Laçi", city: "Laç", country: "Shqipëri" },
  { name: "Teuta", city: "Durrës", country: "Shqipëri" },
  { name: "Skënderbeu", city: "Korçë", country: "Shqipëri" },
  { name: "Bylis", city: "Ballsh", country: "Shqipëri" },
  { name: "Partizani", city: "Tiranë", country: "Shqipëri" },
  { name: "Apolonia", city: "Fier", country: "Shqipëri" },
  { name: "AF Elbasani", city: "Elbasan", country: "Shqipëri" },
];

(async () => {
  for (const club of clubs) {
    const email = `eraldkasaj14+seed.u19${club.name.toLowerCase().replace(/[^a-z0-9]+/g, "")}@gmail.com`;
    const password = "Footbaz2026!";

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const uid = cred.user.uid;

      await set(ref(db, "clubs/" + uid), {
        profile: {
          name: club.name,
          league: LEAGUE,
          city: club.city,
          country: club.country,
          foundedYear: "",
          description: `Ekipi U-19 i ${club.name}, pjesëmarrës në kampionatin ${LEAGUE}.`,
          contactEmail: email,
          contactPhone: "",
          photoURL: "",
        },
        createdAt: new Date().toISOString(),
      });

      await set(ref(db, "users/" + uid), {
        email,
        role: "club",
        createdAt: new Date().toISOString(),
      });

      console.log("OK:", club.name, uid);
    } catch (err) {
      console.log("FAIL:", club.name, err.code || err.message);
    }
  }

  process.exit(0);
})();
