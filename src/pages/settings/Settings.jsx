import "./Settings.css";

function Settings() {
  return (
    <section className="settings-page">

      <div className="settings-container">

        <h1>Cilësimet</h1>

        <p>
          Menaxho llogarinë tënde.
        </p>

        <div className="settings-list">

          <div className="setting-card">

            <h3>Ndrysho Email</h3>

            <input
              type="email"
              placeholder="Email i ri"
            />

            <button>Përditëso</button>

          </div>

          <div className="setting-card">

            <h3>Ndrysho Password</h3>

            <input
              type="password"
              placeholder="Password i ri"
            />

            <button>Përditëso</button>

          </div>

          <div className="setting-card danger">

            <h3>Fshi Llogarinë</h3>

            <p>
              Ky veprim nuk mund të kthehet pas.
            </p>

            <button>Fshi Llogarinë</button>

          </div>

          <div className="setting-card">

            <h3>Dil nga Llogaria</h3>

            <button>Logout</button>

          </div>

        </div>

      </div>

    </section>
  );
}

export default Settings;