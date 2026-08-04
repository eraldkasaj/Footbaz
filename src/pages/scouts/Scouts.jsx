
import Navbar from "../../components/navbar/Navbar";
import Scout_Card from "../../components/scout_card/Scout_Card";
import scouts from "../../data/scouts";

import "./Scouts.css";

function Scouts() {
  return (
    <>
      <Navbar />

      <section className="scouts-page">

        <div className="scouts-header">

          <h1>Scoutët</h1>

          <p>
            Zbulo scoutët profesionistë të platformës Footbaz.
          </p>

        </div>

        <div className="scouts-grid">

          {scouts.map((scout) => (
            <Scout_Card
              key={scout.id}
              scout={scout}
            />
          ))}

        </div>

      </section>
    </>
  );
}

export default Scouts;