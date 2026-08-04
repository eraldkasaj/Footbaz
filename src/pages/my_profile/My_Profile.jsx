import "./My_Profile.css";

import { Link } from "react-router-dom";

import { useEffect,useState } from "react";

import { auth,db } from "../../firebase/firebase";

import { ref,get } from "firebase/database";


function My_Profile(){


const [player,setPlayer] = useState(null);



useEffect(()=>{


const getProfile = async()=>{


const user = auth.currentUser;


if(user){


const userRef = ref(db,"users/" + user.uid);


const snapshot = await get(userRef);


if(snapshot.exists()){


setPlayer(snapshot.val());


}


}


}



getProfile();



},[]);





return(

<section className="my-profile">


<h1>
Profili Im
</h1>




{

player &&


<div className="profile-card">



{

player.profile?.photoURL ?


<img
src={player.profile.photoURL}
className="profile-image"
/>


:


<div className="profile-image">

FOTO

</div>


}





<div className="profile-info">



<div className="info-row">

<span>Emri</span>

<h3>

{player.name} {player.surname}

</h3>

</div>






<div className="info-row">

<span>Klubi</span>

<h3>

{player.profile?.club}

</h3>

</div>






<div className="info-row">

<span>Pozicioni</span>

<h3>

{player.profile?.position}

</h3>

</div>






<div className="info-row">

<span>Mosha</span>

<h3>

{player.profile?.age}

</h3>

</div>







<div className="info-row">

<span>Gjatësia</span>

<h3>

{player.profile?.height} cm

</h3>

</div>






<div className="info-row">

<span>Këmba dominante</span>

<h3>

{player.profile?.dominantFoot}

</h3>

</div>





</div>


</div>


}





<Link 
to="/edit-profile"
className="edit-btn"
>

Edito Profilin

</Link>




</section>


)


}


export default My_Profile;