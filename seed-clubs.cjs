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

const clubs = [
  { name: "KF Tirana Junior", city: "Tiranë", country: "Shqipëri", foundedYear: "1920", description: "Akademia rinore e KF Tiranës, e fokusuar te zhvillimi i talenteve nga mosha 12-19 vjeç." },
  { name: "Partizani Akademi", city: "Tiranë", country: "Shqipëri", foundedYear: "1946", description: "Sektori rinor i Partizanit, me traditë të gjatë në formimin e lojtarëve për ekipin e parë." },
  { name: "Vllaznia U17", city: "Shkodër", country: "Shqipëri", foundedYear: "1919", description: "Grupmosha U17 e Vllaznisë, pjesë e njërit prej klubeve më historikë në Shqipëri." },
  { name: "Skënderbeu Korçë", city: "Korçë", country: "Shqipëri", foundedYear: "1909", description: "Klub me histori të pasur, i njohur për zbulimin dhe zhvillimin e talenteve nga Korça." },
  { name: "Apolonia Fier", city: "Fier", country: "Shqipëri", foundedYear: "1928", description: "Klub tradicional nga Fieri, me akademi aktive për moshat e reja." },
  { name: "Teuta Durrës", city: "Durrës", country: "Shqipëri", foundedYear: "1920", description: "Akademia e Teutës, e njohur për zhvillimin e lojtarëve nga bregdeti." },
];

(async () => {
  for (const club of clubs) {
    const email = `eraldkasaj14+seed.${club.name.toLowerCase().replace(/[^a-z0-9]+/g, "")}@gmail.com`;
    const password = "Footbaz2026!";

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const uid = cred.user.uid;

      await set(ref(db, "clubs/" + uid), {
        profile: {
          name: club.name,
          city: club.city,
          country: club.country,
          foundedYear: club.foundedYear,
          description: club.description,
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
