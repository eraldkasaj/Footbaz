import "./Lojtaret_Ne_Fokus.css";

import { useEffect, useState } from "react";

import { Link } from "react-router-dom";

import PlayerCard from "../player_card/Player_Card";

import { db } from "../../firebase/firebase";

import { ref, get } from "firebase/database";


function Lojtaret_Ne_Fokus() {


const [players, setPlayers] = useState([]);

const [loading, setLoading] = useState(true);


useEffect(() => {


const getFeaturedPlayers = async () => {

const playersRef = ref(db, "players");

const snapshot = await get(playersRef);


if (snapshot.exists()) {


const data = snapshot.val();

const playersArray = Object.keys(data).map((uid) => ({
  uid,
  ...data[uid],
}));


// Prefer players with a complete-looking profile (photo + at least one
// highlight video) so the homepage showcase looks its best; fall back
// to any players if there aren't 4 like that yet.

const withPhotoAndVideo = playersArray.filter(

(player) => player.profile?.photoURL && (player.videos || player.profile?.videoURL)

);


const pool = withPhotoAndVideo.length >= 4 ? withPhotoAndVideo : playersArray;


setPlayers(pool.slice(0, 4));


}


setLoading(false);


};


getFeaturedPlayers();


}, []);


if (!loading && players.length === 0) {

return null;

}


return (

<section className="featured-players">


<div className="featured-header">

<h2>Lojtarët në Fokus</h2>


<p>

Lojtarë që po tërheqin vëmendjen e

skautëve, akademive dhe klubeve.

</p>

</div>


{loading ? (

<p className="featured-loading">Duke ngarkuar lojtarët...</p>

) : (

<>

<div className="featured-grid">


{players.map((player) => (

<PlayerCard key={player.uid} player={player} />

))}


</div>


<div className="featured-footer">

<Link to="/players" className="featured-view-all">

Shiko të gjithë lojtarët

</Link>

</div>

</>

)}


</section>

);

}


export default Lojtaret_Ne_Fokus;