import "./Register.css";
import { Link, useNavigate } from "react-router-dom";
import logo_img from "../../assets/images/logo.png";
import Club_Claim_Form from "../../components/club_claim/Club_Claim_Form";

import { useEffect, useState } from "react";

import { auth, db } from "../../firebase/firebase";

import { createUserWithEmailAndPassword, sendEmailVerification, deleteUser } from "firebase/auth";

import { ref, set, get } from "firebase/database";

import { LuArrowLeft } from "react-icons/lu";

import { calculateAgeFromBirthdate, getBirthdateError, getTodayDateString } from "../../utils/age";

import { normalizeName } from "../../utils/normalizeName";



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

  // Për rolin "club": lista e klubeve ekzistuese, e ngarkuar një herë kur
  // zgjidhet ky rol. Useri zgjedh nga kjo listë (dropdown) në vend që të
  // shkruajë emrin lirshëm — kështu shmanget krijimi i klubeve "binjake" që
  // në rrënjë. "new" do të thotë "klubi im s'është në listë, dua të krijoj
  // një të ri" — vetëm atëherë shfaqet fusha e emrit + regjistrimi normal.
  const [existingClubs, setExistingClubs] = useState([]);
  const [clubSelection, setClubSelection] = useState("");

  useEffect(() => {
    setClubSelection("");
  }, [role]);

  useEffect(() => {
    if (role !== "club") return;

    const loadClubs = async () => {
      const snapshot = await get(ref(db, "clubs"));
      if (!snapshot.exists()) return;

      const data = snapshot.val();
      setExistingClubs(
        Object.keys(data).map((uid) => ({ uid, ...data[uid] }))
      );
    };

    loadClubs();
  }, [role]);

  const matchingClubs =
    role === "club" && clubSelection === "new" && name.trim()
      ? existingClubs.filter(
          (club) => normalizeName(club.profile?.name || "") === normalizeName(name)
        )
      : [];

  const selectedExistingClub =
    role === "club" && clubSelection && clubSelection !== "new"
      ? existingClubs.find((club) => club.uid === clubSelection)
      : null;

  // Disa klube kanë të njëjtin emër (p.sh. "Apolonia" te U-17 dhe te U-19),
  // ndaj kërkesa e ruajtur te clubClaims duhet të tregojë edhe ligën, jo
  // vetëm emrin — përndryshe Aldi s'ka si ta dallojë cilit klub i përket
  // kërkesa kur i shqyrton (i njëjti format si te opsionet e select-it sipër).
  const selectedExistingClubLabel = selectedExistingClub
    ? `${selectedExistingClub.profile?.name || "Klub"}${
        selectedExistingClub.profile?.league ? ` — ${selectedExistingClub.profile.league}` : ""
      }`
    : "";

  // Fushat e llogarisë (email/password/submit) shfaqen vetëm kur useri po
  // krijon vërtet një llogari të re — lojtar, ose klub "i ri" (jo klub
  // ekzistues, ku në vend të kësaj del formulari i kërkesës për qasje).
  const showAccountFields = role === "player" || (role === "club" && clubSelection === "new");



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
          // false deri sa të verifikojë email-in dhe të futet një herë (shih
          // Login.jsx) — Players.jsx (kërkimi publik) e fsheh profilin deri
          // atëherë, që të mos mbushet direktoria me llogari të pa-vërtetuara
          // (dikush që s'e merr dot email-in dhe rregjistrohet disa herë me
          // email të ndryshëm, p.sh.).
          emailVerified: false,
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
          // Klubi i vet-regjistruar është menjëherë "i zotëruar" nga vetë
          // krijuesi — ndryshe nga klubet e shtuara nga admini (pa ownerUid),
          // te të cilat dikush duhet të "kërkojë qasje" (shih clubClaims).
          ownerUid: user.uid,
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

          {role === "player" && (
            <input
              type="text"
              placeholder="Emri"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          )}

          {role === "club" && (
            <>
              <select
                value={clubSelection}
                onChange={(e) => setClubSelection(e.target.value)}
              >
                <option value="">Zgjidh klubin tënd</option>

                {[...existingClubs]
                  .sort((a, b) => (a.profile?.name || "").localeCompare(b.profile?.name || ""))
                  .map((club) => (
                    <option key={club.uid} value={club.uid}>
                      {club.profile?.name || "Klub"}
                      {club.profile?.league ? ` — ${club.profile.league}` : ""}
                      {club.ownerUid ? " (i menaxhuar)" : ""}
                    </option>
                  ))}

                <option value="new">+ Krijo klub të ri</option>
              </select>

              {selectedExistingClub && (
                <div className="register-club-claim">
                  <p className="register-hint">
                    {selectedExistingClub.ownerUid
                      ? "Ky klub tashmë menaxhohet nga dikush. Nëse mendon se ka gabim, na kontakto."
                      : "Ky klub ende s'ka përfaqësues të caktuar. Dërgo një kërkesë qasjeje — do ta shqyrtojmë dhe do të kontaktohesh."}
                  </p>

                  <Club_Claim_Form
                    clubId={selectedExistingClub.uid}
                    clubName={selectedExistingClubLabel}
                  />
                </div>
              )}

              {clubSelection === "new" && (
                <>
                  <input
                    type="text"
                    placeholder="Emri i klubit"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />

                  {matchingClubs.length > 0 && (
                    <p className="register-hint">
                      Ekziston tashmë {matchingClubs.length === 1 ? "një klub" : "klube"} me këtë emër:{" "}
                      {matchingClubs.map((club, index) => (
                        <span key={club.uid}>
                          <Link to={`/clubs/${club.uid}`} target="_blank" rel="noopener noreferrer">
                            {club.profile?.name}
                          </Link>
                          {index < matchingClubs.length - 1 ? ", " : ""}
                        </span>
                      ))}
                      . Nëse je përfaqësues i njërit, zgjidhe nga lista sipër dhe kërko qasje, në vend që të krijosh një llogari të re.
                    </p>
                  )}
                </>
              )}
            </>
          )}

          {role === "player" && (
            <input
              type="text"
              placeholder="Mbiemri"
              value={surname}
              onChange={(e) => setSurname(e.target.value)}
            />
          )}

          {role === "player" && (
            <input
              type="date"
              value={birthdate}
              max={getTodayDateString()}
              onChange={(e) => setBirthdate(e.target.value)}
            />
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





          {showAccountFields && (
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onFocus={() => setEmailFocused(true)}
            onBlur={() => setEmailFocused(false)}
            autoComplete="email"
          />
          )}

          {showAccountFields && emailFocused && (
            <p className="register-hint">
              Përdor një email real që e kontrollon shpesh — do të duhet ta verifikosh (linku i konfirmimit) para se të mund të hysh në llogari.
            </p>
          )}

          {showAccountFields && (
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          )}





          {showAccountFields && (
          <input
            type="password"
            placeholder="Konfirmo Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          )}







          {showAccountFields && (
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
          )}

          {showAccountFields && (
          <button type="submit" disabled={isSubmitting}>

            {isSubmitting ? "Duke u regjistruar..." : "Regjistrohu"}

          </button>
          )}

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