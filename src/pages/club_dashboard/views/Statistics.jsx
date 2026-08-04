function Statistics({ matches, rosterPlayers }) {
  const playedMatches = Object.values(matches || {})
    .filter((m) => m.status === "played")
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  let wins = 0;
  let draws = 0;
  let losses = 0;
  let goalsScored = 0;
  let goalsConceded = 0;

  playedMatches.forEach((m) => {
    const our = Number(m.ourScore) || 0;
    const their = Number(m.opponentScore) || 0;

    goalsScored += our;
    goalsConceded += their;

    if (our > their) wins++;
    else if (our === their) draws++;
    else losses++;
  });

  const last5 = playedMatches.slice(0, 5);
  const formCounts = last5.reduce(
    (acc, m) => {
      const our = Number(m.ourScore) || 0;
      const their = Number(m.opponentScore) || 0;

      if (our > their) acc.w++;
      else if (our === their) acc.d++;
      else acc.l++;

      return acc;
    },
    { w: 0, d: 0, l: 0 }
  );

  const totalForm = last5.length || 1;
  const winPct = (formCounts.w / totalForm) * 100;
  const drawPct = (formCounts.d / totalForm) * 100;

  const donutStyle = {
    width: 120,
    height: 120,
    borderRadius: "50%",
    background:
      last5.length === 0
        ? "var(--cd-panel-2)"
        : `conic-gradient(var(--brand-green) 0% ${winPct}%, var(--brand-gold) ${winPct}% ${winPct + drawPct}%, #f87171 ${winPct + drawPct}% 100%)`,
    flexShrink: 0,
  };

  const topPlayers = rosterPlayers
    .map((p) => ({
      ...p,
      goals: p.statistics?.goals || 0,
      assists: p.statistics?.assists || 0,
    }))
    .filter((p) => p.goals + p.assists > 0)
    .sort((a, b) => b.goals + b.assists - (a.goals + a.assists))
    .slice(0, 5);

  return (
    <>
      <div className="club-header">
        <div>
          <h1>Statistikat e Ekipit</h1>
          <p>Përmbledhje e performancës së klubit.</p>
        </div>
      </div>

      <div className="club-record-grid">
        <div className="club-record-card">
          <h2>{playedMatches.length}</h2>
          <span>Ndeshje</span>
        </div>
        <div className="club-record-card">
          <h2>{wins}</h2>
          <span>Fitore</span>
        </div>
        <div className="club-record-card">
          <h2>{draws}</h2>
          <span>Barazime</span>
        </div>
        <div className="club-record-card">
          <h2>{losses}</h2>
          <span>Humbje</span>
        </div>
      </div>

      <div className="club-home-grid">
        <div className="club-panel">
          <h3>Golat</h3>

          <div className="club-goals-row">
            <div className="club-goals-col">
              <strong>{goalsScored}</strong>
              <span>Të shënuara</span>
            </div>
            <div className="club-goals-col">
              <strong>{goalsConceded}</strong>
              <span>Të pësuara</span>
            </div>
          </div>

          <h3>Forma e Fundit</h3>

          <div className="club-donut-wrap">
            <div style={donutStyle} />

            <ul className="club-donut-legend">
              <li>
                <span className="dot" style={{ background: "var(--brand-green)" }} /> Fitore ({formCounts.w})
              </li>
              <li>
                <span className="dot" style={{ background: "var(--brand-gold)" }} /> Barazim ({formCounts.d})
              </li>
              <li>
                <span className="dot" style={{ background: "#f87171" }} /> Humbje ({formCounts.l})
              </li>
            </ul>
          </div>
        </div>

        <div className="club-panel">
          <h3>Lojtarët më të Mirë</h3>

          {topPlayers.length === 0 ? (
            <p className="club-empty">Ende s'ka statistika lojtarësh.</p>
          ) : (
            topPlayers.map((p) => (
              <div className="club-top-players-row" key={p.uid}>
                <span>
                  {p.profile?.name} {p.profile?.surname}
                </span>
                <span>
                  {p.goals} gola{p.assists ? `, ${p.assists} asistime` : ""}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

export default Statistics;
