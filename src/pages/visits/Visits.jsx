import "./Visits.css";

function Visits() {
  return (
    <section className="visits-page">

      <div className="visits-container">

        <h1>Vizitat</h1>

        <p>
          Këtu shfaqen personat që kanë parë profilin tënd.
        </p>

        <div className="visit-list">

          <div className="visit-card">
            <h3>Marco Rossi</h3>
            <span>Scout • Hellas Verona</span>

            <p>Sot • 13:45</p>
          </div>

          <div className="visit-card">
            <h3>Arben Kola</h3>
            <span>Scout • FK Partizani</span>

            <p>Dje • 18:20</p>
          </div>

          <div className="visit-card">
            <h3>David Müller</h3>
            <span>Scout • Borussia Dortmund</span>

            <p>2 ditë më parë</p>
          </div>

        </div>

      </div>

    </section>
  );
}

export default Visits;