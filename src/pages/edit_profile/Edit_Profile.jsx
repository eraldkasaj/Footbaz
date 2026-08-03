import "./Edit_Profile.css";

import { useEffect,useState } from "react";

import { auth,db } from "../../firebase/firebase";

import { ref,get,update,push,set,remove } from "firebase/database";

import { useNavigate } from "react-router-dom";

import { calculateAgeFromBirthdate } from "../../utils/age";
import { LEAGUE_OPTIONS } from "../../data/leagues";


// Countries most relevant for an Albanian-speaking scouting platform first,
// followed by other common nationalities. If a player's saved nationality
// isn't in this list (e.g. an older free-text value), it's added dynamically
// below so it still shows up instead of getting silently dropped.
const NATIONALITY_OPTIONS = [
  "Albania",
  "Kosovo",
  "North Macedonia",
  "Montenegro",
  "Serbia",
  "Croatia",
  "Bosnia and Herzegovina",
  "Slovenia",
  "Greece",
  "Italy",
  "Switzerland",
  "Germany",
  "Austria",
  "France",
  "Belgium",
  "Netherlands",
  "England",
  "Spain",
  "Portugal",
  "Turkey",
  "United States",
  "Canada",
  "Brazil",
  "Argentina",
  "Other",
];

function Edit_Profile(){


const navigate = useNavigate();


const [position,setPosition] = useState("");
const [club,setClub] = useState("");
const [league,setLeague] = useState("");
const [bio,setBio] = useState("");
const [height,setHeight] = useState("");
const [weight,setWeight] = useState("");
const [age,setAge] = useState("");
const [birthdate,setBirthdate] = useState("");
const [nationality,setNationality] = useState("");
const [dominantFoot,setDominantFoot] = useState("");
const [photoURL,setPhotoURL] = useState("");
const [videos,setVideos] = useState([]);

const [uploading,setUploading] = useState(false);





useEffect(()=>{


const getProfile = async()=>{


const user = auth.currentUser;


if(user){


const snapshot = await get(
ref(db,"players/" + user.uid)
);


if(snapshot.exists()){


const data = snapshot.val();

const profileData = data.profile || {};


setPosition(profileData.position || "");

setClub(profileData.club || "");

setLeague(profileData.league || "");

setBio(profileData.bio || "");

setHeight(profileData.height || "");

setWeight(profileData.weight || "");

setBirthdate(profileData.birthdate || profileData.dateOfBirth || "");

setAge(
  calculateAgeFromBirthdate(profileData.birthdate || profileData.dateOfBirth) ??
    profileData.age ??
    ""
);

setNationality(profileData.nationality || "");

setDominantFoot(profileData.dominantFoot || "");

setPhotoURL(profileData.photoURL || "");


const videosData = data.videos || {};

const videosArray = Object.keys(videosData).map((videoId)=>({

id: videoId,

...videosData[videoId],

}));


// Older accounts stored a single video directly on the profile. Show it
// too (as a non-deletable legacy entry) until it's replaced by real
// entries in the new "videos" list.
if(videosArray.length === 0 && profileData.videoURL){

videosArray.push({ id:"legacy", url: profileData.videoURL, legacy:true });

}


setVideos(videosArray);


}


}


}



getProfile();


},[]);










const uploadImage = async(e)=>{


const file = e.target.files[0];


if(!file){

return;

}


const formData = new FormData();


formData.append("file",file);

formData.append("upload_preset","talento11_players");



const response = await fetch(

"https://api.cloudinary.com/v1_1/xqdb7tam/image/upload",

{

method:"POST",

body:formData

}

);



const data = await response.json();


console.log("IMAGE:",data.secure_url);


setPhotoURL(data.secure_url);


}









const uploadVideo = async(e)=>{


const file = e.target.files[0];


if(!file){

return;

}


const user = auth.currentUser;

if(!user){

return;

}


setUploading(true);



const formData = new FormData();


formData.append("file",file);

formData.append("upload_preset","talento11_players");



try{


const response = await fetch(

"https://api.cloudinary.com/v1_1/xqdb7tam/video/upload",

{

method:"POST",

body:formData

}

);



const data = await response.json();


console.log("VIDEO:",data);


if(data.secure_url){


const videosRef = ref(db,"players/" + user.uid + "/videos");

const newVideoRef = push(videosRef);


const entry = { url:data.secure_url, createdAt:Date.now() };


await set(newVideoRef,entry);


setVideos((previous)=>[...previous, { id:newVideoRef.key, ...entry }]);


}


setUploading(false);


}


catch(error){


console.log(error);


setUploading(false);


}


}



const deleteVideo = async(videoId)=>{


const user = auth.currentUser;

if(!user || videoId === "legacy"){

return;

}


if(!window.confirm("Ta heqësh këtë video nga profili?")){

return;

}


try{


await remove(ref(db,"players/" + user.uid + "/videos/" + videoId));


setVideos((previous)=>previous.filter((video)=>video.id !== videoId));


}


catch(error){


console.log(error);


}


}









const saveProfile = async(e)=>{


e.preventDefault();


try{


const user = auth.currentUser;

const computedAge = calculateAgeFromBirthdate(birthdate);



await update(

  ref(db,"players/" + user.uid + "/profile"),

{


position,

club,

league,

bio,

height,

weight,

age: computedAge ?? age,

birthdate,

nationality,

dominantFoot,

photoURL


}

);



console.log("Profili u perditesua");


navigate("/player-dashboard");


}


catch(error){


console.log(error.message);


}


}


// Make sure a previously-saved nationality that isn't in the default list
// (e.g. free text from before this was a select) still appears as an option
// instead of silently disappearing.

const nationalityOptions = nationality && !NATIONALITY_OPTIONS.includes(nationality)

? [nationality, ...NATIONALITY_OPTIONS]

: NATIONALITY_OPTIONS;









return(


<section className="edit-profile-page">


<div className="edit-profile-container">



<h1>

Ndrysho Profilin

</h1>



<p>

Plotëso informacionet e profilit tënd.

</p>





<form

className="edit-profile-form"

onSubmit={saveProfile}

>






<div className="form-group">


<label>

Foto Profili

</label>



<input

type="file"

accept="image/*"

onChange={uploadImage}

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


<label>

Video Highlights

</label>



<input

type="file"

accept="video/*"

onChange={uploadVideo}

/>



{

uploading &&

<p>Duke ngarkuar videon...</p>

}



{

videos.length > 0 &&


<div className="video-list">


{videos.map((video)=>(


<div className="video-list-item" key={video.id}>


<video

src={video.url}

controls

className="preview-video"

/>



{

video.id !== "legacy" &&


<button

type="button"

className="video-remove-btn"

onClick={()=>deleteVideo(video.id)}

>

Hiq videon

</button>


}


</div>


))}


</div>


}



</div>


















<div className="form-group">

<label>Pozicioni</label>

<select
value={position}
onChange={(e)=>setPosition(e.target.value)}
>

<option value="">Zgjidh pozicionin</option>

<optgroup label="Portier">
<option value="GK">Portier (GK)</option>
</optgroup>

<optgroup label="Mbrojtës">
<option value="CB">Qendër Mbrojtës (CB)</option>
<option value="LB">Mbrojtës i Majtë (LB)</option>
<option value="RB">Mbrojtës i Djathtë (RB)</option>
<option value="LWB">Wing Back i Majtë (LWB)</option>
<option value="RWB">Wing Back i Djathtë (RWB)</option>
</optgroup>

<optgroup label="Mesfushor">
<option value="CDM">Mesfushor Defensiv (CDM)</option>
<option value="CM">Mesfushor Qendre (CM)</option>
<option value="CAM">Mesfushor Ofensiv (CAM)</option>
<option value="LM">Mesfushor i Majtë (LM)</option>
<option value="RM">Mesfushor i Djathtë (RM)</option>
</optgroup>

<optgroup label="Sulmues">
<option value="LW">Sulmues Krahu i Majtë (LW)</option>
<option value="RW">Sulmues Krahu i Djathtë (RW)</option>
<option value="CF">Qendër Sulmues (CF)</option>
<option value="ST">Sulmues (ST)</option>
</optgroup>

</select>

</div>




<div className="form-group">

<label>Klubi aktual</label>


<input

type="text"

placeholder="p.sh. Flamurtari FC"

value={club}

onChange={(e)=>setClub(e.target.value)}

/>

</div>




<div className="form-group">

<label>Kampionati aktual</label>


<select

value={league}

onChange={(e)=>setLeague(e.target.value)}

>

<option value="">Zgjidh kampionatin</option>

{LEAGUE_OPTIONS.map((leagueOption)=>(

<option key={leagueOption} value={leagueOption}>

{leagueOption}

</option>

))}

</select>

</div>















<div className="form-group">

<label>Përshkrimi</label>


<textarea

value={bio}

onChange={(e)=>setBio(e.target.value)}

placeholder="Shkruaj shkurt për stilin tënd të lojës dhe objektivat e tua..."

rows="4"

/>

</div>









<div className="form-group">

<label>Gjatesia</label>


<input

type="number"

min="0"

placeholder="cm"

value={height}

onChange={(e)=>setHeight(e.target.value)}

/>

</div>







<div className="form-group">

<label>Pesha</label>


<input

type="number"

min="0"

placeholder="kg"

value={weight}

onChange={(e)=>setWeight(e.target.value)}

/>

</div>









<div className="form-group">

<label>Mosha</label>


<input

type="text"

readOnly

value={calculateAgeFromBirthdate(birthdate) ?? (age || "—")}

/>

</div>






<div className="form-group">

<label>Datëlindja</label>


<input

type="date"

value={birthdate}

onChange={(e)=>{

const nextBirthdate = e.target.value;

setBirthdate(nextBirthdate);

setAge(calculateAgeFromBirthdate(nextBirthdate) ?? "");

}}

/>

</div>












<div className="form-group">

<label>Kombesia</label>


<select

value={nationality}

onChange={(e)=>setNationality(e.target.value)}

>

<option value="">Zgjidh kombësinë</option>

{nationalityOptions.map((option)=>(

<option key={option} value={option}>

{option}

</option>

))}

</select>

</div>











<div className="form-group">


<label>

Kemba dominante

</label>



<select

value={dominantFoot}

onChange={(e)=>setDominantFoot(e.target.value)}

>


<option value="">

Zgjidh

</option>


<option value="Right">

E djathta

</option>


<option value="Left">

E majta

</option>


<option value="Both">

Të dyja

</option>


</select>



</div>










<button

type="submit"

disabled={uploading}

>


{

uploading ?

"Duke ngarkuar..."

:

"Ruaj Profilin"

}


</button>







</form>


</div>


</section>


)


}



export default Edit_Profile;