import "../edit_profile/Edit_Profile.css";

import { useEffect,useState } from "react";

import { auth,db } from "../../firebase/firebase";

import { ref,get,update } from "firebase/database";

import { useNavigate } from "react-router-dom";

import { LEAGUE_OPTIONS } from "../../data/leagues";

import { resolveMyClubId } from "../../utils/resolveClubId";


function Edit_Club_Profile(){


const navigate = useNavigate();


const [name,setName] = useState("");
const [league,setLeague] = useState("");
const [city,setCity] = useState("");
const [country,setCountry] = useState("");
const [foundedYear,setFoundedYear] = useState("");
const [description,setDescription] = useState("");
const [contactEmail,setContactEmail] = useState("");
const [contactPhone,setContactPhone] = useState("");
const [photoURL,setPhotoURL] = useState("");

const [saving,setSaving] = useState(false);

const [clubId,setClubId] = useState(null);




useEffect(()=>{


const getProfile = async()=>{


const user = auth.currentUser;


if(!user){

navigate("/login");

return;

}


const resolvedClubId = await resolveMyClubId(user.uid);

if(!resolvedClubId){
navigate("/club-dashboard");
return;
}

setClubId(resolvedClubId);

const snapshot = await get(
ref(db,"clubs/" + resolvedClubId)
);


if(snapshot.exists()){


const data = snapshot.val();

const profileData = data.profile || {};


setName(profileData.name || "");

setLeague(profileData.league || "");

setCity(profileData.city || "");

setCountry(profileData.country || "");

setFoundedYear(profileData.foundedYear || "");

setDescription(profileData.description || "");

setContactEmail(profileData.contactEmail || user.email || "");

setContactPhone(profileData.contactPhone || "");

setPhotoURL(profileData.photoURL || "");


}


};



getProfile();


},[navigate]);




const uploadLogo = async(e)=>{


const file = e.target.files[0];


if(!file){

return;

}


const formData = new FormData();


formData.append("file",file);

formData.append("upload_preset","footbaz_players");



const response = await fetch(

"https://api.cloudinary.com/v1_1/xqdb7tam/image/upload",

{

method:"POST",

body:formData

}

);



const data = await response.json();


setPhotoURL(data.secure_url);


}




const saveProfile = async(e)=>{


e.preventDefault();


try{


setSaving(true);


await update(

ref(db,"clubs/" + clubId + "/profile"),

{

name,

league,

city,

country,

foundedYear,

description,

contactEmail,

contactPhone,

photoURL

}

);


navigate("/club-dashboard");


}


catch(error){


console.log(error.message);


}

finally{

setSaving(false);

}


}




return(


<section className="edit-profile-page">


<div className="edit-profile-container">



<h1>

Profili i Klubit

</h1>



<p>

Plotëso informacionet e klubit tënd.

</p>




<form

className="edit-profile-form"

onSubmit={saveProfile}

>



<div className="form-group">


<label>

Logo e Klubit

</label>



<input

type="file"

accept="image/*"

onChange={uploadLogo}

/>



{

photoURL &&


<img

src={photoURL}

className="preview-image"

/>

}


</div>




<div className="form-group">

<label>Emri i klubit</label>


<input

type="text"

value={name}

disabled

placeholder="p.sh. FK Partizani"

/>

<small className="form-hint">Për të ndryshuar emrin, kontakto footbazinfo@gmail.com.</small>

</div>




<div className="form-group">

<label>Kampionati</label>


<select

value={league}

disabled

>

<option value="">Zgjidh kampionatin</option>

{LEAGUE_OPTIONS.map((option)=>(

<option key={option} value={option}>{option}</option>

))}

</select>

<small className="form-hint">Për të ndryshuar kampionatin, kontakto footbazinfo@gmail.com.</small>

</div>




<div className="form-group">

<label>Qyteti</label>


<input

type="text"

value={city}

onChange={(e)=>setCity(e.target.value)}

placeholder="p.sh. Tiranë"

/>

</div>




<div className="form-group">

<label>Shteti</label>


<input

type="text"

value={country}

onChange={(e)=>setCountry(e.target.value)}

placeholder="p.sh. Shqipëri"

/>

</div>




<div className="form-group">

<label>Viti i themelimit</label>


<input

type="number"

min="0"

value={foundedYear}

onChange={(e)=>setFoundedYear(e.target.value)}

placeholder="p.sh. 1946"

/>

</div>




<div className="form-group">

<label>Përshkrimi</label>


<textarea

value={description}

onChange={(e)=>setDescription(e.target.value)}

placeholder="Shkruaj shkurt për klubin, akademinë dhe objektivat e tua..."

rows="4"

/>

</div>




<div className="form-group">

<label>Email kontakti</label>


<input

type="email"

value={contactEmail}

onChange={(e)=>setContactEmail(e.target.value)}

/>

</div>




<div className="form-group">

<label>Telefon kontakti</label>


<input

type="text"

value={contactPhone}

onChange={(e)=>setContactPhone(e.target.value)}

placeholder="p.sh. +355 6X XXX XXXX"

/>

</div>




<button

type="submit"

disabled={saving}

>


{

saving ?

"Duke ruajtur..."

:

"Ruaj Profilin"

}


</button>




</form>


</div>


</section>


)


}



export default Edit_Club_Profile;
