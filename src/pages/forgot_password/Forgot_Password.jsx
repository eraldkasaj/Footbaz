import "./Forgot_Password.css";
import { Link } from "react-router-dom";
import logo_img from "../../assets/images/logo.png";

import { useState } from "react";

import { auth } from "../../firebase/firebase";
import { sendPasswordResetEmail } from "firebase/auth";

function Forgot_Password(){

const [email,setEmail] = useState("");

const [error,setError] = useState("");

const [success,setSuccess] = useState("");


const handleReset = async(e)=>{

e.preventDefault();

setError("");
setSuccess("");

try{

await sendPasswordResetEmail(auth,email);

setSuccess("Linku për ndryshimin e password-it u dërgua në email.");

setEmail("");

}
catch(error){

if(error.code==="auth/user-not-found"){

setError("Nuk ekziston asnjë llogari me këtë email.");

}

else if(error.code==="auth/invalid-email"){

setError("Email i pavlefshëm.");

}

else{

setError("Ndodhi një gabim. Provo përsëri.");

}

}

}


return(

<section className="login">

<div className="login-card">

<img
src={logo_img}
alt="Footbaz"
className="login-logo"
/>

<h1>Forgot Password</h1>

<p>

Shkruaj email-in dhe do të të dërgojmë një link për të ndryshuar password-in.

</p>


{error && (

<p className="register-error">

{error}

</p>

)}

{success && (

<p className="register-success">

{success}

</p>

)}


<form
className="login-form"
onSubmit={handleReset}
>

<input
type="email"
placeholder="Email"
value={email}
onChange={(e)=>setEmail(e.target.value)}
autoComplete="email"
/>

<button type="submit">

Dërgo linkun

</button>

</form>


<span>

Kthehu te

<Link to="/login">

Login

</Link>

</span>

</div>

</section>

)

}

export default Forgot_Password;