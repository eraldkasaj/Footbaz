import "./Si_Funksionon.css";

import {
  LuUserPlus,
  LuBadgeInfo,
  LuVideo,
  LuHandshake
} from "react-icons/lu";

function Si_Funksionon() {
  return (
    <section id="si-funksionon" className="si-funksionon">

      <div className="si-header">
        <span className="si-eyebrow">NGA PROFILI TE MUNDËSIA</span>
        <h2>Si funksionon?</h2>

        <p>
          Në katër hapa të thjeshtë, krijo prezencën tënde profesionale dhe
          bëhu i dukshëm për futbollin.
        </p>
      </div>

      <div className="steps">

        <div className="step">
          <div className="step-icon">
            <LuUserPlus />
            <span className="step-number">01</span>
          </div>

          <span className="step-label">HAPI I PARË</span>
          <h3>Regjistrohu</h3>

          <p>
            Krijo një llogari falas dhe bëhu pjesë
            e platformës Footbaz.
          </p>
        </div>

        <div className="step">
          <div className="step-icon">
            <LuBadgeInfo />
            <span className="step-number">02</span>
          </div>

          <span className="step-label">HAPI I DYTË</span>
          <h3>Krijo Profilin</h3>

          <p>
            Plotëso pozicionin,
            moshën, gjatësinë dhe
            statistikat.
          </p>
        </div>

        <div className="step">
          <div className="step-icon">
            <LuVideo />
            <span className="step-number">03</span>
          </div>

          <span className="step-label">HAPI I TRETË</span>
          <h3>Ngarko Videot</h3>

          <p>
            Publiko videot e
            ndeshjeve dhe
            momenteve më të mira.
          </p>
        </div>

        <div className="step">
          <div className="step-icon">
            <LuHandshake />
            <span className="step-number">04</span>
          </div>

          <span className="step-label">HAPI I KATËRT</span>
          <h3>Lidhu me Klubet</h3>

          <p>
            Scoutët, akademitë dhe
            klubet mund të të
            zbulojnë.
          </p>
        </div>

      </div>

    </section>
  );
}

export default Si_Funksionon;
