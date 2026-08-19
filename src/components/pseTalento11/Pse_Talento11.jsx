import "./Pse_Talento11.css";
import mockup_img from "../../assets/images/mockup.png";
import {
  LuBadgeCheck,
  LuChartNoAxesCombined,
  LuGlobe,
  LuPlay,
  LuShieldCheck,
  LuUsers,
} from "react-icons/lu";

function Pse_Talento11() {
  return (
    <div className="pse-talento11-wrapper">
      <section id="pse-talento11" className="pse-talento11">

        <div className="pse-header">
          <span className="pse-eyebrow">NJË PROFIL QË FLET PËR TY</span>
          <h2>Pse Footbaz?</h2>
          <p>
            Shfaq talentin tënd me një profil profesional, statistika të qarta
            dhe videot që scoutët duan të shohin.
          </p>
        </div>

        <div className="pse-cards">

          <div className="pse-card">
            <div className="card-icon"><LuBadgeCheck /></div>

            <h3>Profil i plotë</h3>

            <p>
              Vendos pozicionin, klubin, moshën, gjatësinë dhe këmbën e
              preferuar në një profil të besueshëm.
            </p>

            <div className="pse-card-detail">
              <LuShieldCheck /> Profil i verifikuar
            </div>
          </div>

          <div className="pse-card">
            <div className="card-icon"><LuChartNoAxesCombined /></div>

            <h3>Statistika & highlights</h3>

            <p>
              Trego ndeshjet, golat, asistet dhe momentet e tua më të mira në
              një vend.
            </p>

            <div className="pse-card-detail">
              <LuPlay /> Video që shfaqin lojën tënde
            </div>
          </div>

          <div className="pse-card">
            <div className="card-icon"><LuGlobe /></div>

            <h3>Mundësi reale</h3>

            <p>
              Bëhu i dukshëm për scoutë, akademi dhe klube që kërkojnë lojtarë
              si ti.
            </p>

            <div className="pse-card-detail">
              <LuUsers /> Lidhu me profesionistët
            </div>
          </div>

        </div>

        <div className="profile-preview-intro">
          <div>
            <span>PREVIEW I PROFILIT</span>
            <h3>Gjithçka që duhet të dijë një scout</h3>
          </div>
          <div className="profile-preview-tags">
            <span>Profil live</span>
            <span>Video & Statistika</span>
            <span>Verifikuar nga Footbaz</span>
          </div>
        </div>

        <div className="app-preview">
          <img src={mockup_img} alt="Preview i profilit të lojtarit në Footbaz" className="mockup-img" />
        </div>

      </section>
    </div>
  );
}

export default Pse_Talento11;