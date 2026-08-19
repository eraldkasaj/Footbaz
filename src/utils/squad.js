import { getPlayerAge } from "./age";

// Skuadra e klubit = lojtarët në rosterin e tij (clubs/{uid}/roster) të
// lidhur me profile reale te players/{uid}. Shumica e klubeve demo ende
// s'kanë roster real, kështu që kjo del bosh derisa klube reale të shtojnë
// lojtarë.
export function getSquadPlayers(club, playersById) {
  const rosterIds = Object.keys(club.roster || {});

  return rosterIds
    .map((id) => (playersById[id] ? { uid: id, ...playersById[id] } : null))
    .filter(Boolean);
}

// Përdoret njësoj kudo (League_Clubs header + tabelë, Club_Profile) që
// numrat të mos bien ndesh mes njëri-tjetrit.
export function computeSquadStats(squadPlayers) {
  const ages = squadPlayers
    .map((player) => getPlayerAge(player.profile))
    .filter((value) => value !== null);

  const avgAge = ages.length > 0 ? ages.reduce((sum, value) => sum + value, 0) / ages.length : null;

  const foreigners = squadPlayers.filter(
    (player) => player.profile?.nationality && player.profile.nationality !== "Albania"
  ).length;

  return { squadSize: squadPlayers.length, avgAge, foreigners };
}
