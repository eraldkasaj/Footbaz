import { initializeApp, deleteApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { getDatabase, ref, set } from "firebase/database";
import { firebaseConfig } from "../firebase/firebase";

// Gjeneron një fjalëkalim të përkohshëm — mjaftueshëm i gjatë, pa karaktere
// që ngatërrohen lehtë (0/O, 1/l), për t'u lexuar/shkruar lehtë nga dikush
// që e merr me email.
export function generateTempPassword() {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let result = "";

  for (let i = 0; i < 10; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }

  return result;
}

// Krijon një llogari Firebase Auth për kërkuesin e aprovuar, PA prekur
// sesionin e loguar të adminit në browser. E arrin këtë duke përdorur një
// instancë krejt të veçantë, të përkohshme, të Firebase App-it — ka
// "sesionin" e vet të Auth, të pavarur nga app-i kryesor (ai i Aldit).
// Instanca e përkohshme fshihet sapo të mbarojmë.
export async function createManagedClubAccount(email, password) {
  const secondaryApp = initializeApp(firebaseConfig, `managed-account-${Date.now()}`);

  try {
    const secondaryAuth = getAuth(secondaryApp);
    const secondaryDb = getDatabase(secondaryApp);

    const credential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    const uid = credential.user.uid;

    // Shkruajmë users/{uid} këtu, brenda vetë sesionit të llogarisë së re —
    // rregulli i Firebase lejon vetëm auth.uid === $uid të shkruajë te
    // users/{uid}, dhe këtu jemi saktësisht ai uid.
    await set(ref(secondaryDb, "users/" + uid), {
      email,
      role: "club",
      createdAt: new Date().toISOString(),
    });

    await signOut(secondaryAuth);

    return uid;
  } finally {
    await deleteApp(secondaryApp);
  }
}
