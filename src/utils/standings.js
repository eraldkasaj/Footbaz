// Tabela e klasifikimit — llogaritet nga ndeshjet e vetë-raportuara të çdo
// klubi (clubs/{uid}/matches, status:"played"). Klubet demo pa asnjë ndeshje
// dalin me 0 kudo, njësoj si një kampionat që ende s'ka filluar.
// Përdoret te League_Clubs (tabela e plotë) dhe Club_Profile (pozicioni i
// një klubi të vetëm) — i njëjti llogaritje kudo, që renditja të mos ndryshojë.
export function computeStandings(clubs) {
  return clubs
    .map((club) => {
      const played = Object.values(club.matches || {}).filter(
        (match) => match.status === "played"
      );

      const stats = played.reduce(
        (acc, match) => {
          acc.goalsFor += Number(match.ourScore) || 0;
          acc.goalsAgainst += Number(match.opponentScore) || 0;

          if (match.ourScore > match.opponentScore) acc.wins += 1;
          else if (match.ourScore === match.opponentScore) acc.draws += 1;
          else acc.losses += 1;

          return acc;
        },
        { wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0 }
      );

      const points = stats.wins * 3 + stats.draws;
      const goalDiff = stats.goalsFor - stats.goalsAgainst;

      // Forma — rezultati i 5 ndeshjeve të fundit të luajtura, nga më e
      // vjetra te më e reja (majtas-djathtas), sipas datës.
      const form = [...played]
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(-5)
        .map((match) => {
          if (match.ourScore > match.opponentScore) return "F";
          if (match.ourScore === match.opponentScore) return "B";
          return "H";
        });

      return { ...club, ...stats, points, goalDiff, played: played.length, form };
    })
    .sort((a, b) => b.points - a.points || b.goalDiff - a.goalDiff || b.goalsFor - a.goalsFor);
}
