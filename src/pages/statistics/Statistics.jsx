import "./Statistics.css";

import { useEffect,useState } from "react";

import { auth,db } from "../../firebase/firebase";

import { ref,get,update } from "firebase/database";

import { useNavigate } from "react-router-dom";



function Statistics(){


const navigate = useNavigate();



const [season,setSeason] = useState("");
const [matches,setMatches] = useState("");
const [goals,setGoals] = useState("");
const [assists,setAssists] = useState("");
const [minutes,setMinutes] = useState("");
const [yellowCards,setYellowCards] = useState("");
const [redCards,setRedCards] = useState("");

const [saving,setSaving] = useState(false);




useEffect(()=>{


const getStats = async()=>{


const user = auth.currentUser;


if(user){


const statsRef = ref(db,"players/" + user.uid + "/statistics");


const snapshot = await get(statsRef);



if(snapshot.exists()){


const data = snapshot.val();



setSeason(data.season || "");

setMatches(data.matches || "");

setGoals(data.goals || "");

setAssists(data.assists || "");

setMinutes(data.minutes || "");

setYellowCards(data.yellowCards || "");

setRedCards(data.redCards || "");


}


}


}



getStats();



},[]);








const saveStats = async(e)=>{


e.preventDefault();


setSaving(true);


try{


const user = auth.currentUser;



await update(ref(db,"players/" + user.uid + "/statistics"),{


season,
matches,
goals,
assists,
minutes,
yellowCards,
redCards


});



console.log("Statistikat u ruajten");



navigate("/player-dashboard");



}



catch(error){


console.log(error.message);


setSaving(false);


}



}









return(

<section className="statistics-page">


<div className="statistics-container">



<h1>

Statistikat

</h1>




<p>

Përditëso statistikat e sezonit.

</p>






<form 
className="statistics-form"
onSubmit={saveStats}
>






<div className="form-group">

<label>Sezoni</label>

<input
type="text"
placeholder="2025/2026"
value={season}
onChange={(e)=>setSeason(e.target.value)}
/>

</div>







<div className="form-group">

<label>Ndeshje</label>

<input
type="number"
value={matches}
onChange={(e)=>setMatches(e.target.value)}
/>

</div>







<div className="form-group">

<label>Gola</label>

<input
type="number"
value={goals}
onChange={(e)=>setGoals(e.target.value)}
/>

</div>








<div className="form-group">

<label>Asiste</label>

<input
type="number"
value={assists}
onChange={(e)=>setAssists(e.target.value)}
/>

</div>








<div className="form-group">

<label>Minuta të Luajtura</label>

<input
type="number"
value={minutes}
onChange={(e)=>setMinutes(e.target.value)}
/>

</div>









<div className="form-group">

<label>Kartonë të Verdhë</label>

<input
type="number"
value={yellowCards}
onChange={(e)=>setYellowCards(e.target.value)}
/>

</div>








<div className="form-group">

<label>Kartonë të Kuq</label>

<input
type="number"
value={redCards}
onChange={(e)=>setRedCards(e.target.value)}
/>

</div>







<button type="submit" disabled={saving}>

{saving ? "Duke ruajtur..." : "Ruaj Statistikat"}

</button>





</form>



</div>



</section>


)


}



export default Statistics;