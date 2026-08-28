import { LuUsers, LuUserCog, LuSwords, LuCalendarClock } from "react-icons/lu";
import { timeAgo, formatDateFull } from "../../../utils/time";
import Club_Crest from "../../../components/club_crest/Club_Crest";

function isSameMonth(dateStr, reference) {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return false;
  return date.getMonth() === reference.getMonth() && date.getFullYear() === reference.getFullYear();
}

function DashboardHome({ clubName, rosterCount, staffCount, trainings, matches, roster, players }) {
  const now = new Date();

  const trainingList = Object.values(trainings || {});
  const matchList = Object.entries(matches || {}).map(([id, m]) => ({ id, ...m }));

  const trainingsThisMonth = trainingList.filter((t) => isSameMonth(t.date, now)).length;
  const matchesThisMonth = matchList.filter((m) => isSameMonth(m.date, now)).length;

  const upcomingMatch = matchList
    .filter((m) => m.status !== "played")
    .sort((a, b) => new Date(a.date) - new Date(b.date))[0];

  const activity = [
    ...Object.entries(roster || {}).map(([id, entry]) => {
      const p = players?.[id]?.profile;
      const name = p ? [p.name, p.surname].filter(Boolean).join(" ") : "Lojtar";
      return { ts: entry.addedAt || 0, text: `Lojtari i ri është shtuar: ${name}` };
    }),
    ...trainingList.map((t) => ({ ts: t.createdAt || 0, text: `Stërvitja "${t.title}" u planifikua` })),
    ...matchList.map((m) => ({
      ts: m.createdAt || 0,
      text:
        m.status === "played"
          ? `Rezultati u shtua: ${clubName} ${m.ourScore ?? 0} - ${m.opponentScore ?? 0} ${m.opponent}`
          : `Ndeshja kundër ${m.opponent} u shtua në kalendar`,
    })),
  ]
    .filter((entry) => entry.ts)
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 5);

  return (
    <>
      <div className="club-header">
        <div>
          <h1>Mirë se erdhe, {clubName}!</h1>
          <p>Këtu është një përmbledhje e përgjithshme e klubit tuaj.</p>
        </div>
      </div>

      <div className="club-stats">
        <div className="club-stat-card">
          <div className="club-stat-icon teal">
            <LuUsers />
          </div>
          <div>
            <p className="club-stat-label">Lojtarë</p>
            <h2>{rosterCount}</h2>
          </div>
        </div>

        <div className="club-stat-card">
          <div className="club-stat-icon blue">
            <LuUserCog />
          </div>
          <div>
            <p className="club-stat-label">Staf</p>
            <h2>{staffCount}</h2>
          </div>
        </div>

        <div className="club-stat-card">
          <div className="club-stat-icon green">
            <LuSwords />
          </div>
          <div>
            <p className="club-stat-label">Ndeshje këtë muaj</p>
            <h2>{matchesThisMonth}</h2>
          </div>
        </div>

        <div className="club-stat-card">
          <div className="club-stat-icon yellow">
            <LuCalendarClock />
          </div>
          <div>
            <p className="club-stat-label">Stërvitje këtë muaj</p>
            <h2>{trainingsThisMonth}</h2>
          </div>
        </div>
      </div>

      <div className="club-home-grid">
        <div className="club-panel">
          <h3>Ndeshja e Radhës</h3>

          {upcomingMatch ? (
            <div className="club-upcoming-match">
              <div className="club-upcoming-teams">
                <div className="club-upcoming-team">
                  <div className="club-upcoming-team-mark">
                    <Club_Crest name={clubName} />
                  </div>
                  <span>{clubName}</span>
                </div>

                <span className="club-upcoming-vs">VS</span>

                <div className="club-upcoming-team">
                  <div className="club-upcoming-team-mark">
                    <Club_Crest name={upcomingMatch.opponent} />
                  </div>
                  <span>{upcomingMatch.opponent}</span>
                </div>
              </div>

              <p className="club-upcoming-meta">
                {formatDateFull(upcomingMatch.date)} {upcomingMatch.time ? `- ${upcomingMatch.time}` : ""}
                <br />
                {upcomingMatch.location || "Vendi nuk është vendosur"}
              </p>
            </div>
          ) : (
            <p className="club-upcoming-empty">Nuk ka ndeshje të planifikuara.</p>
          )}
        </div>

        <div className="club-panel">
          <h3>Aktivitete të Fundit</h3>

          {activity.length === 0 ? (
            <p className="club-empty">Ende s'ka aktivitet.</p>
          ) : (
            <ul className="club-activity-list">
              {activity.map((entry, index) => (
                <li key={index}>
                  <span className="club-activity-dot" />
                  <span>
                    {entry.text}
                    <span className="club-activity-time">{timeAgo(entry.ts)}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}

export default DashboardHome;
