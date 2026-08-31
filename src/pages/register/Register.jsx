import "./Register.css";
import { Link, useNavigate } from "react-router-dom";
import logo_img from "../../assets/images/logo.png";

import { useState } from "react";

import { auth, db } from "../../firebase/firebase";

import { createUserWithEmailAndPassword, sendEmailVerification, deleteUser } from "firebase/auth";

import { ref, set } from "firebase/database";

import { LuArrowLeft } from "react-icons/lu";

import { calculateAgeFromBirthdate, getBirthdateError, getTodayDateString } from "../../utils/age";



function Register() {


  const navigate = useNavigate();


  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [parentConsent, setParentConsent] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [role, setRole] = useState(null);
  const [emailFocused, setEmailFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Vetëm për rolin "player": llogaritet nga datëlindja e futur, për të
  // vendosur nëse duhet kërkuar email + pëlqim i prindit/kujdestarit.
  const playerAge = role === "player" ? calculateAgeFromBirthdate(birthdate) : null;
  const isMinor = playerAge !== null && playerAge < 18;



  const handleRegister = async (e) => {


    e.preventDefault();

    if (isSubmitting) return;

    setError("");
    setSuccess("");

    const missingPlayerFields = role === "player" && (!name || !surname || !birthdate);
    const missingClubFields = role === "club" && !name;

    if (missingPlayerFields || missingClubFields || !email || !password || !confirmPassword) {

      setError("Plotësoni të gjitha fushat.");

      return;

    }

    if (role === "player") {

      const birthdateError = getBirthdateError(birthdate);

      if (birthdateError) {

        setError(birthdateError);

        return;

      }

    }

    if (password !== confirmPassword) {

      setError("Fjalëkalimet nuk përputhen.");

      return;

    }

    if (!acceptedTerms) {

      setError("Duhet të pranosh Kushtet e Përdorimit dhe Politikën e Privatësisë për të vazhduar.");

      return;

    }

    if (role === "player" && isMinor && !parentConsent) {

      setError("Meqë je nën 18 vjeç, duhet pëlqimi i prindit/kujdestarit për të vazhduar.");

      return;

    }


    setIsSubmitting(true);

    try {


      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );


      const user = userCredential.user;

    // Nga këtu e poshtë, llogaria e Auth ekziston tashmë. Nëse ndonjë shkrim
    // te Database dështon (rrjet, rregulla sigurie, etj.), e fshijmë
    // llogarinë e Auth që sapo u krijua — përndryshe email-i mbetet i "zënë"
    // (auth/email-already-in-use) përgjithmonë, pa asnjë profil pas tij.
    try {

      await set(ref(db, "users/" + user.uid), {
        email,
        role,
        createdAt: new Date().toISOString(),
      });

      if (role === "player") {
        await set(ref(db, "players/" + user.uid), {
          profile: {
            name,
            surname,
            age: calculateAgeFromBirthdate(birthdate) ?? "",
            birthdate,
            nationality: "",
            position: "",
            club: "",
            league: "",
            height: "",
            weight: "",
            dominantFoot: "",
            bio: "",
            photoURL: "",
          },
          career: {},
          statistics: {},
          videos: {},
          consent: {
            acceptedTerms: true,
            acceptedAt: new Date().toISOString(),
            isMinor,
            parentEmail: isMinor ? parentEmail : "",
            parentConsent: isMinor ? parentConsent : false,
          },
          createdAt: new Date().toISOString(),
        });
      }

      if (role === "club") {
        await set(ref(db, "clubs/" + user.uid), {
          profile: {
            name,
            league: "",
            city: "",
            country: "",
            foundedYear: "",
            description: "",
            contactEmail: email,
            contactPhone: "",
            photoURL: "",
          },
          consent: {
            acceptedTerms: true,
            acceptedAt: new Date().toISOString(),
          },
          createdAt: new Date().toISOString(),
        });
      }

    } catch (dbError) {

      try {
        await deleteUser(user);
      } catch {
        // Nëse edhe fshirja dështon, të paktën provuam — përdoruesi mund të
        // kontaktojë suportin nëse email-i mbetet i bllokuar.
      }

      throw dbError;
    }

    // Firebase vetëm kontrollon formatin e email-it, jo nëse ai ekziston
    // vërtet. Dërgojmë një link verifikimi — llogaria nuk mund të hyjë
    // (shih Login.jsx) derisa email-i i vërtetë të konfirmohet duke klikuar
    // linkun.
    try {
      await sendEmailVerification(user);
    } catch {
      // Nëse dërgimi dështon (p.sh. shumë kërkesa), llogaria mbetet e
      // krijuar — përdoruesi mund të marrë linkun sërish kur provon të hyjë.
    }

      setSuccess("Llogaria u krijua me sukses. Të kemi dërguar një email verifikimi — konfirmoje para se të hysh. Po ridrejtoheni te Login...");

      setTimeout(() => {

        navigate("/login");

      }, 2000);


    }
    catch (error) {

      if (error.code === "auth/email-already-in-use") {

        setError("Ky email është përdorur më parë.");

      }

      else if (error.code === "auth/weak-password") {

        setError("Fjalëkalimi duhet të ketë të paktën 6 karaktere.");

      }

      else if (error.code === "auth/invalid-email") {

        setError("Email-i nuk është i vlefshëm.");

      }

      else {

        setError("Ndodhi një gabim. Provo përsëri.");

      }

      setIsSubmitting(false);

    }


  }




  return (


    <section className="register">


      <Link to="/" className="register-back">
        <LuArrowLeft /> Kthehu në faqen kryesore
      </Link>


      <div className="register-card">


        <Link to="/">
          <img
            src={logo_img}
            alt="Footbaz"
            className="register-logo"
          />
        </Link>



        <h1>Krijo Llogari</h1>


        <p>
          Bashkohu me komunitetin Footbaz.
        </p>



        {error && (

          <p className="register-error">

            {error}

          </p>)}

        {success && (

          <p className="register-success"> {success} </p>

        )}

        <form
          className="register-form"
          onSubmit={handleRegister}
        >

          <p className="register-hint">Regjistrohu si:</p>

          <div className="role-select">

            <label>

              <input
                type="radio"
                name="role"
                value="player"
                checked={role === "player"}
                onChange={(e) => setRole(e.target.value)}
              />

              Lojtar

            </label>

            <label>

              <input
                type="radio"
                name="role"
                value="club"
                checked={role === "club"}
                onChange={(e) => setRole(e.target.value)}
              />

              Klub

            </label>

          </div>

          {role && (
          <>

          <input
            type="text"
            placeholder={role === "club" ? "Emri i klubit" : "Emri"}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />




          {role === "player" && (
            <input
              type="text"
              placeholder="Mbiemri"
              value={surname}
              onChange={(e) => setSurname(e.target.value)}
            />
          )}

          {role === "player" && (
            <div className="register-field">
              <label className="register-field-label" htmlFor="birthdate">Datëlindja</label>
              <input
                id="birthdate"
                type="date"
                value={birthdate}
                max={getTodayDateString()}
                onChange={(e) => setBirthdate(e.target.value)}
              />
            </div>
          )}

          {role === "player" && isMinor && (
            <>
              <input
                type="email"
                placeholder="Email i prindit/kujdestarit (opsionale)"
                value={parentEmail}
                onChange={(e) => setParentEmail(e.target.value)}
              />

              <p className="register-hint">
                Meqë je nën 18 vjeç, regjistrimi lejohet vetëm me pëlqimin e prindit/kujdestarit tënd.
              </p>

              <label className="register-checkbox">
                <input
                  type="checkbox"
                  checked={parentConsent}
                  onChange={(e) => setParentConsent(e.target.checked)}
                />
                Prindi/kujdestari im pranon Kushtet e Përdorimit dhe Politikën e Privatësisë të Footbaz për llogarinë time.
              </label>
            </>
          )}





          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onFocus={() => setEmailFocused(true)}
            onBlur={() => setEmailFocused(false)}
            autoComplete="email"
          />

          {emailFocused && (
            <p className="register-hint">
              Përdor një email real që e kontrollon shpesh — do të duhet ta verifikosh (linku i konfirmimit) para se të mund të hysh në llogari.
            </p>
          )}

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />





          <input
            type="password"
            placeholder="Konfirmo Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />







          <label className="register-checkbox">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
            />
            Pranoj{" "}
            <Link to="/terms" target="_blank" rel="noopener noreferrer">Kushtet e Përdorimit</Link>
            {" "}dhe{" "}
            <Link to="/privacy" target="_blank" rel="noopener noreferrer">Politikën e Privatësisë</Link>.
          </label>

          <button type="submit" disabled={isSubmitting}>

            {isSubmitting ? "Duke u regjistruar..." : "Regjistrohu"}

          </button>

          </>
          )}

        </form>







        <span>


          Ke tashmë llogari?


          <Link to="/login">

            Hyr

          </Link>



        </span>





      </div>


    </section>


  )


}



export default Register;