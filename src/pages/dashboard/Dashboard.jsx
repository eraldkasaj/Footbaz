import "./Dashboard.css";
import { Link } from "react-router-dom";

function Dashboard() {
  return (

    <section className="dashboard">

      <div className="dashboard-card">

        <h1>Mirë se erdhe 👋</h1>

        <p>
          Zgjidh panelin që dëshiron të hapësh.
        </p>

        <div className="dashboard-buttons">

         <Link
            to="/player-dashboard"
            className="dashboard-btn" >
            Paneli i Lojtarit
        </Link>

          <Link
            to="/club-dashboard"
            className="dashboard-btn" >
            Paneli i Klubit
        </Link>

        </div>

      </div>

    </section>

  );
}

export default Dashboard;