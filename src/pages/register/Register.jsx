import "./Register.css";
import { Link, useNavigate } from "react-router-dom";
import logo_img from "../../assets/images/logo.png";

import { useState } from "react";

import { auth, db } from "../../firebase/firebase";

import { createUserWithEmailAndPassword, sendEmailVerification, deleteUser } from "firebase/auth";

import { ref, set } from "firebase/database";

import { LuArrowLeft } from "react-icons/lu";



function Register() {


  const navigate = useNavigate();


  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [role, setRole] = useState("player");
  const [emailFocused, setEmailFocused] = useState(false);



  const handleRegister = async (e) => {


    e.preventDefault();

    setError("");
    setSuccess("");

    if (!name || !surname || !email || !password || !confirmPassword) {

      setError("Plotësoni të gjitha fushat.");

      return;

    }

    if (password !== confirmPassword) {

      setError("Fjalëkalimet nuk përputhen.");

      return;

    }


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
            age: "",
            birthdate: "",
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




          <input
            type="text"
            placeholder="Emri"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />




          <input
            type="text"
            placeholder="Mbiemri"
            value={surname}
            onChange={(e) => setSurname(e.target.value)}
          />





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
                value="scout"
                checked={role === "scout"}
                onChange={(e) => setRole(e.target.value)}
              />


              Scout


            </label>



          </div>







          <button type="submit">

            Regjistrohu

          </button>




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