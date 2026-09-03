import { ref, get, query, orderByChild, equalTo } from "firebase/database";
import { db } from "../firebase/firebase";

// Klubi "im" mund të jetë në dy gjendje: (a) klub i vetë-regjistruar, ku
// ID-ja e klubit te baza e të dhënave është njësoj si UID-ja ime e login-ut
// (rasti origjinal, i vetmi që ekzistonte deri tani), ose (b) një klub
// ekzistues (i shtuar nga admini, ose i dikujt tjetër) që m'u dha si
// pronar përmes rrjedhës "Kërko qasje" → clubClaims → ownerUid — atëherë
// ID-ja e klubit është krejt tjetër nga UID-ja ime.
//
// Kjo funksion e zbulon cilin rast jemi, pa ndryshuar/migruar asgjë te
// vetë klubet — thjesht kontrollon të dyja mundësitë me radhë.
export async function resolveMyClubId(uid) {
  const directSnap = await get(ref(db, "clubs/" + uid));

  if (directSnap.exists()) {
    return uid;
  }

  const ownedQuery = query(ref(db, "clubs"), orderByChild("ownerUid"), equalTo(uid));
  const ownedSnap = await get(ownedQuery);

  if (ownedSnap.exists()) {
    const [firstMatchId] = Object.keys(ownedSnap.val());
    return firstMatchId;
  }

  return null;
}
