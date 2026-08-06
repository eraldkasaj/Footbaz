import "./Legal.css";
import Navbar from "../../components/navbar/Navbar";
import { Link } from "react-router-dom";
import { LuArrowLeft } from "react-icons/lu";

function Privacy() {
  return (
    <>
      <Navbar />

      <section className="legal-page">
        <div className="legal-container">
          <Link to="/" className="legal-back">
            <LuArrowLeft /> Kthehu në faqen kryesore
          </Link>

          <span className="legal-eyebrow">Footbaz</span>
          <h1>Politika e Privatësisë</h1>
          <p className="legal-updated">Përditësuar më 6 Gusht 2026</p>

          <section>
            <h2>1. Çfarë të dhëna mbledhim</h2>
            <p>Kur krijon një llogari ose profil te Footbaz, mund të mbledhim:</p>
            <ul>
              <li>Të dhëna identifikuese: emër, mbiemër, email, datëlindje, kombësi.</li>
              <li>Të dhëna profili: pozicioni, klubi/kampionati aktual, gjatësia, pesha, biografia, këmba dominante.</li>
              <li>Përmbajtje media: foto profili, video highlights.</li>
              <li>Për klube: emri, qyteti, kampionati, kontakt, staf, stërvitje, ndeshje, dokumente të lojtarëve të tyre.</li>
              <li>Për të mitur: email i prindit/kujdestarit dhe pëlqimi i dhënë gjatë regjistrimit.</li>
              <li>Të dhëna teknike bazike (p.sh. koha e krijimit të llogarisë) për funksionimin e platformës.</li>
            </ul>
          </section>

          <section>
            <h2>2. Si i përdorim të dhënat</h2>
            <ul>
              <li>Për të shfaqur profilin tënd te klubet/skautët brenda platformës.</li>
              <li>Për të mundësuar komunikim mes lojtarëve dhe klubeve brenda Footbaz.</li>
              <li>Për të menaxhuar rosterin, stërvitjet, ndeshjet dhe statistikat e klubit (nëse je klub).</li>
              <li>Për të kontaktuar prindin/kujdestarin e një lojtari të mitur kur nevojitet.</li>
              <li>Nuk i shesim dhe nuk i japim të dhënat e tua palëve të treta për qëllime reklamimi.</li>
            </ul>
          </section>

          <section>
            <h2>3. Kush e sheh informacionin tënd</h2>
            <p>
              Profili publik i lojtarit (emër, pozicion, klub, video, foto)
              është i dukshëm për klubet e regjistruara në Footbaz dhe, në
              disa seksione, publikisht (p.sh. lista e lojtarëve). Të dhëna
              më të ndjeshme si dokumentet e ngarkuara nga një klub për një
              lojtar, ose email-i i prindit, nuk shfaqen publikisht — janë
              të dukshme vetëm për klubin përkatës.
            </p>
          </section>

          <section>
            <h2>4. Fëmijët dhe pëlqimi prindëror</h2>
            <p>
              Nëse një lojtar regjistrohet nën 18 vjeç, kërkojmë email të
              prindit/kujdestarit dhe konfirmim shprehimor gjatë
              regjistrimit se prindi/kujdestari pranon këto Kushte dhe
              Politikë. Prindi/kujdestari mund të kontaktojë{" "}
              <a href="mailto:footbazinfo@gmail.com">footbazinfo@gmail.com</a>{" "}
              në çdo kohë për të parë, korrigjuar ose kërkuar fshirjen e të
              dhënave të fëmijës së tij.
            </p>
          </section>

          <section>
            <h2>5. Ku ruhen të dhënat</h2>
            <p>
              Të dhënat ruhen te Firebase (Google) — baza e të dhënave dhe
              sistemi i identifikimit që përdor Footbaz. Foto dhe video
              ruhen te Cloudinary. Të dyja shërbimet përdoren vetëm për
              funksionimin teknik të platformës.
            </p>
          </section>

          <section>
            <h2>6. Të drejtat e tua</h2>
            <ul>
              <li>Mund të shohësh dhe të ndryshosh profilin tënd në çdo kohë (Edit Profile / Edit Club Profile).</li>
              <li>Mund të fshish video ose foto specifike nga profili yt.</li>
              <li>Mund të kërkosh fshirjen e plotë të llogarisë duke na shkruar te <a href="mailto:footbazinfo@gmail.com">footbazinfo@gmail.com</a>.</li>
              <li>Prindërit e lojtarëve të mitur kanë të njëjtat të drejta për të dhënat e fëmijës së tyre.</li>
            </ul>
          </section>

          <section>
            <h2>7. Ndryshimet</h2>
            <p>
              Kjo Politikë mund të përditësohet herë pas here për t'u
              përshtatur me funksione të reja të platformës. Ndryshimet e
              rëndësishme do të njoftohen brenda platformës.
            </p>
          </section>

          <section>
            <h2>8. Kontakt</h2>
            <p>
              Për çdo pyetje rreth privatësisë ose të dhënave të tua, na
              shkruaj te{" "}
              <a href="mailto:footbazinfo@gmail.com">footbazinfo@gmail.com</a>.
            </p>
          </section>
        </div>
      </section>
    </>
  );
}

export default Privacy;
