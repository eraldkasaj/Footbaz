import "./Legal.css";
import Navbar from "../../components/navbar/Navbar";
import { Link } from "react-router-dom";
import { LuArrowLeft } from "react-icons/lu";

function Terms() {
  return (
    <>
      <Navbar />

      <section className="legal-page">
        <div className="legal-container">
          <Link to="/" className="legal-back">
            <LuArrowLeft /> Kthehu në faqen kryesore
          </Link>

          <span className="legal-eyebrow">Footbaz</span>
          <h1>Kushtet e Përdorimit</h1>
          <p className="legal-updated">Përditësuar më 6 Gusht 2026</p>

          <section>
            <h2>1. Çfarë është Footbaz</h2>
            <p>
              Footbaz është një platformë online që lidh lojtarë futbolli,
              klube dhe akademi në Shqipëri. Lojtarët krijojnë një profil me
              të dhëna dhe video për t'u parë nga klubet; klubet krijojnë një
              profil publik dhe menaxhojnë ekipin e tyre.
            </p>
          </section>

          <section>
            <h2>2. Krijimi i llogarisë</h2>
            <p>
              Për të krijuar një llogari duhet të japësh informacione të
              sakta (emër, email, datëlindje). Je përgjegjës për ruajtjen e
              fjalëkalimit tënd dhe për çdo veprim që kryhet nga llogaria
              jote.
            </p>
            <p>
              Nëse je nën 18 vjeç, regjistrimi lejohet vetëm me pëlqimin e
              prindit/kujdestarit ligjor, siç përshkruhet gjatë procesit të
              regjistrimit. Prindi/kujdestari mban përgjegjësi për
              informacionin e dhënë dhe mund të kërkojë fshirjen e llogarisë
              në çdo kohë duke na kontaktuar.
            </p>
          </section>

          <section>
            <h2>3. Përmbajtja që ngarkon</h2>
            <p>
              Kur ngarkon foto, video ose informacion tjetër te profili yt,
              na jep të drejtën ta shfaqim atë përmbajtje brenda platformës
              (p.sh. te profili publik, te lista e lojtarëve) me qëllim
              funksionimin e Footbaz. Ti mbetesh pronar i përmbajtjes dhe
              mund ta fshish në çdo kohë nga profili yt.
            </p>
            <p>
              Nuk lejohet ngarkimi i përmbajtjes që nuk të përket, që është
              fyese, mashtruese, ose që shkel të drejtat e dikujt tjetër.
            </p>
          </section>

          <section>
            <h2>4. Sjellja në platformë</h2>
            <ul>
              <li>Trajto lojtarët, klubet dhe stafin me respekt.</li>
              <li>Mos jep informacion të rremë për identitetin, moshën apo aftësitë.</li>
              <li>Mos përdor platformën për qëllime të paligjshme ose për të kontaktuar të mitur jashtë kontekstit të skautimit të ligjshëm futbollistik.</li>
            </ul>
            <p>
              Footbaz mund të pezullojë ose fshijë llogari që shkelin këto
              rregulla.
            </p>
          </section>

          <section>
            <h2>5. Pa garanci</h2>
            <p>
              Footbaz shërben si urë lidhëse mes lojtarëve dhe klubeve. Nuk
              garantojmë kontrata, transferime, apo rezultate specifike nga
              përdorimi i platformës. Marrëdhëniet dhe marrëveshjet mes
              lojtarëve/prindërve dhe klubeve mbeten përgjegjësi e tyre.
            </p>
          </section>

          <section>
            <h2>6. Ndryshimet</h2>
            <p>
              Mund t'i përditësojmë këto Kushte herë pas here. Ndryshimet e
              rëndësishme do të njoftohen brenda platformës. Vazhdimi i
              përdorimit pas ndryshimeve nënkupton pranimin e tyre.
            </p>
          </section>

          <section>
            <h2>7. Kontakt</h2>
            <p>
              Për pyetje rreth këtyre Kushteve, na shkruaj te{" "}
              <a href="mailto:footbazinfo@gmail.com">footbazinfo@gmail.com</a>.
            </p>
          </section>
        </div>
      </section>
    </>
  );
}

export default Terms;
