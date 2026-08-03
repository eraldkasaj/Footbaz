import "../../pages/player_dashboard/Player_Dashboard.css";

import { useEffect,useState } from "react";

import { useParams,useNavigate } from "react-router-dom";

import { db } from "../../firebase/firebase";

import { ref,get } from "firebase/database";

import {
LuArrowLeft,
LuFootprints,
LuMapPin,
LuPlay,
LuShield
} from "react-icons/lu";

import { formatBirthdate, getPlayerAge } from "../../utils/age";


const statItems=[

["matches","Ndeshje"],
["goals","Gola"],
["assists","Asist"],
["yellowCards","Kartona të verdhë"],
["redCards","Kartona të kuq"]

];


const detailedStatItems=[...statItems,["minutes","Minuta të luajtura"]];


// Every individual position the pitch can highlight. Keys are the canonical
// codes used both by the CSS classes (lowercased) and by getPositionName.
// Kept identical to Player_Dashboard.jsx so both pages stay in sync.
const PITCH_POSITIONS=[

"GK",
"CB",
"LB",
"RB",
"LWB",
"RWB",
"CDM",
"CM",
"CAM",
"LM",
"RM",
"LW",
"RW",
"CF",
"ST",

];


// Aliases so odd/legacy values stored in Firebase (or synonyms like "DF",
// "MID", "GOALKEEPER") still resolve to one of the exact codes above instead
// of falling back to a generic zone.
const POSITION_ALIASES={

GOALKEEPER:"GK",
PORTIER:"GK",
DF:"CB",
DEF:"CB",
DEFENDER:"CB",
DM:"CDM",
MID:"CM",
MIDFIELDER:"CM",
AM:"CAM",
FW:"ST",
FORWARD:"ST",
STRIKER:"ST",

};


// Resolves any stored position value to one of the exact codes in
// PITCH_POSITIONS (GK, LB, CB, RB, LWB, RWB, CDM, CM, CAM, LM, RM, LW, RW,
// CF, ST). Falls back to "ST" only when the value is missing or unrecognized.
const getPitchPosition=(position)=>{


const normalizedPosition=position?.trim().toUpperCase();


if(!normalizedPosition) return "ST";


if(PITCH_POSITIONS.includes(normalizedPosition)) return normalizedPosition;


return POSITION_ALIASES[normalizedPosition] || "ST";


}


const getPositionName=(position)=>{

const normalizedPosition=position?.trim().toUpperCase();

const names={

GK:"Portier",
CB:"Qendër Mbrojtës",
LB:"Mbrojtës i Majtë",
RB:"Mbrojtës i Djathtë",
LWB:"Wing Back i Majtë",
RWB:"Wing Back i Djathtë",
CDM:"Mesfushor Defensiv",
CM:"Mesfushor Qendre",
CAM:"Mesfushor Ofensiv",
LM:"Mesfushor i Majtë",
RM:"Mesfushor i Djathtë",
LW:"Sulmues Krahu i Majtë",
RW:"Sulmues Krahu i Djathtë",
CF:"Qendër Sulmues",
ST:"Sulmues",

};

const name=names[normalizedPosition];

if(!name) return "—";

return `${name} (${normalizedPosition})`;

}



function Player_Profile(){


const {id}=useParams();

const navigate=useNavigate();


const [player,setPlayer]=useState(null);


const [activeTab,setActiveTab]=useState("Përmbledhje");



useEffect(()=>{


const getPlayer=async()=>{


const snapshot = await get(ref(db, `players/${id}`));


if(snapshot.exists()){

setPlayer(snapshot.val());

}


}


getPlayer();


},[id]);



if(!player){

return <p>Duke ngarkuar...</p>

}



const profile=player.profile || {};

const birthdate=profile.birthdate || profile.dateOfBirth;

const age=getPlayerAge(profile);

const stats = player.statistics || {};


const fullName = `${profile.name || ""} ${profile.surname || ""}`;


const careerEntries=Object.entries(player.career || {})

.map(([entryId,entry])=>({id:entryId,...entry}))

// parseInt (jo Number) që një vlerë e keqformuar si "2025-2026" të rendisë
// sipas vitit fillestar (2025) në vend që të bjerë në fund si 0.
.sort((a,b)=>(parseInt(b.startYear,10)||0)-(parseInt(a.startYear,10)||0));


// Klubi aktual vjen nga profili (vendoset te Edito Profilin). Për llogaritë
// e vjetra që e kishin vendosur klubin vetëm si zë karriere pa datë mbarimi
// (para se të kishte fusha të dedikuara), bie fallback te ai zë.
const currentCareerEntry=careerEntries.find((entry)=>!entry.endYear);

const club=profile.club || currentCareerEntry?.club || "Klubi nuk është vendosur";


const league=profile.league || currentCareerEntry?.league || "Superliga Shqiptare U-19";


const pitchPosition=getPitchPosition(profile.position);


const videoEntries=player.videos

? Object.entries(player.videos)

.map(([videoId,video])=>({id:videoId,...video}))

.sort((a,b)=>(b.createdAt||0)-(a.createdAt||0))

: profile.videoURL

? [{id:"legacy",url:profile.videoURL}]

: [];


const dominantFootLabel=

profile.dominantFoot==="Right" ? "E djathtë" :

profile.dominantFoot==="Left" ? "E majtë" :

profile.dominantFoot==="Both" ? "Të dyja" :

"—";


return(


<main className="talento-player-dashboard">


<div className="talento-player-back-row">

<button

type="button"

className="talento-player-back"

onClick={()=>navigate(-1)}

>

<LuArrowLeft/> Kthehu mbrapa

</button>

</div>


<section className="talento-player-panel">



<header className="talento-player-hero">


<div className="talento-player-photo">


{

profile.photoURL ?

<img src={profile.photoURL} alt={fullName}/>

:

<span>{fullName.slice(0,2)}</span>


}


</div>




<div className="talento-player-summary">



<div className="talento-player-name-row">


<h1>{fullName}</h1>


<span className="talento-player-verified">

Verified

</span>


</div>



<p className="talento-player-club">

<LuShield/> {club}

</p>



<p className="talento-player-league">

🇦🇱 {league}

</p>



<div className="talento-player-facts">


<div>

<strong>
{age ?? "—"}
{birthdate ? ` (${formatBirthdate(birthdate)})` : ""}
</strong>

<span>Mosha</span>

</div>



<div>

<strong>{profile.height ? `${profile.height} cm`:"—"}</strong>

<span>Lartësia</span>

</div>



<div>

<strong>{getPositionName(profile.position)}</strong>

<span>Pozicioni</span>

</div>




<div>

<strong><LuMapPin/> {profile.nationality || "—"}</strong>

<span>Kombësia</span>

</div>



<div>

<strong><LuFootprints/> {dominantFootLabel}</strong>

<span>Këmba e preferuar</span>

</div>



<div>

<strong>{profile.weight ? `${profile.weight} kg`:"—"}</strong>

<span>Pesha</span>

</div>



</div>



</div>


</header>





<nav className="talento-player-tabs">


{

["Përmbledhje","Statistikat","Media","Karriera"].map(tab=>(


<button

key={tab}

className={activeTab===tab ? "is-active":""}

onClick={()=>setActiveTab(tab)}

>

{tab}

</button>


))

}


</nav>





{

activeTab==="Përmbledhje" &&


<>


<section className="talento-player-about">


<div>

<h2>Rreth lojtarit</h2>


<p>

{profile.bio || "Nuk ka përshkrim akoma."}

</p>


</div>



<div className={`talento-player-pitch talento-player-pitch--${pitchPosition.toLowerCase()}`}>

<div className="talento-player-pitch-center" />

<div className="talento-player-pitch-box talento-player-pitch-box-left" />

<div className="talento-player-pitch-box talento-player-pitch-box-right" />

<span/>

</div>



</section>




<section className="talento-player-statistics">


<div className="talento-player-section-heading">

<h2>Statistikat</h2>

<span>{stats.season || "Sezoni aktual"}</span>

</div>




<div className="talento-player-stat-grid">


{

statItems.map(([key,label])=>(


<div key={key}>


<span>{label}</span>


<strong>{stats[key] || 0}</strong>


</div>


))


}


</div>



</section>



<section className="talento-player-club-card">

<div className="talento-player-club-mark"><LuShield/></div>

<div>

<span>Klubi aktual</span>

<h2>{club}</h2>

<p>🇦🇱 {league}</p>

</div>

</section>



<section className="talento-player-highlights">

<div className="talento-player-section-heading"><h2>Highlights</h2></div>

{

videoEntries.length > 0 ?


<div className="talento-player-video-grid">

{videoEntries.map((video)=>(

<div className="talento-player-video-wrap" key={video.id}>

<video

src={video.url}

controls

className="talento-player-video"

/>

</div>

))}

</div>


:


<div className="talento-player-empty-video">

<LuPlay/>

<span>Nuk ka video akoma</span>

</div>


}

</section>


</>


}




{


activeTab==="Statistikat" &&


<section className="talento-player-tab-dashboard">


<div className="talento-player-detailed-stat-grid">


{


detailedStatItems.map(([key,label])=>(


<div key={key}>


<span>{label}</span>


<strong>{stats[key] || 0}</strong>


</div>


))


}


</div>


</section>


}





{


activeTab==="Media" &&


<section className="talento-player-tab-dashboard">


<div className="talento-player-section-heading"><h2>Video Highlights</h2></div>


{

videoEntries.length > 0 ?


<div className="talento-player-video-grid">

{videoEntries.map((video)=>(

<div className="talento-player-video-wrap" key={video.id}>

<video

src={video.url}

controls

className="talento-player-video"

/>

</div>

))}

</div>


:


<div className="talento-player-empty-video">

<LuPlay/>

<span>Nuk ka video</span>

</div>


}


</section>


}




{


activeTab==="Karriera" &&


<section className="talento-player-tab-dashboard">


<div className="talento-player-section-heading"><h2>Karriera</h2></div>


{

careerEntries.length===0 ?


<p className="talento-player-career-empty">

Ky lojtar ende s'ka shtuar histori karriere.

</p>


:


careerEntries.map((entry)=>(


<div className="talento-player-career-entry" key={entry.id}>


<div className="talento-player-club-mark"><LuShield/></div>


<div>

<span>{entry.endYear ? "Ish klub" : "Klubi aktual"}</span>

<h3>{entry.club}</h3>

<p>{entry.league ? `🇦🇱 ${entry.league}` : "Kampionati nuk është vendosur"}</p>

</div>


<time>{entry.startYear} – {entry.endYear || "Aktual"}</time>


</div>


))


}


</section>


}




</section>


</main>


)


}


export default Player_Profile;