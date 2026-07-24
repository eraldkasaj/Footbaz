import Navbar from "../../components/navbar/Navbar";
import Player_Profile_Card from "../../components/player_profile_card/Player_Profile_Card";
import "./Player_Profile.css";

import { useEffect,useState } from "react";
import { useParams } from "react-router-dom";

import { db } from "../../firebase/firebase";
import { ref,get } from "firebase/database";


function Player_Profile(){


const {id} = useParams();


const [player,setPlayer] = useState(null);



useEffect(()=>{

const getPlayer = async () => {
  try {
    const playerRef = ref(db, `players/${id}`);

    const snapshot = await get(playerRef);

    if (snapshot.exists()) {
      setPlayer(snapshot.val());
    } else {
      setPlayer(null);
    }
  } catch (error) {
    console.error(error);
  }
};



getPlayer();



},[id]);





return(

<>

<Navbar/>


<section className="player-profile">


{

player &&

<Player_Profile_Card player={player}/>

}


</section>


</>

)


}


export default Player_Profile;