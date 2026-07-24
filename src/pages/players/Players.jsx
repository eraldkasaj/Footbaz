import { useEffect, useState } from "react";

import Navbar from "../../components/navbar/Navbar";

import PlayerCard from "../../components/player_card/Player_Card";

import "./Players.css";

import { db } from "../../firebase/firebase";

import { ref, get } from "firebase/database";

import { LuSearch, LuX } from "react-icons/lu";


function Players(){


const [players,setPlayers] = useState([]);

const [loading,setLoading] = useState(true);

const [search,setSearch] = useState("");

const [position,setPosition] = useState("");

const [age,setAge] = useState("");

const [sort,setSort] = useState("");


useEffect(()=>{


const getPlayers = async()=>{


const playersRef = ref(db, "players");

const snapshot = await get(playersRef);


if(snapshot.exists()){


const data = snapshot.val();


const playersArray = Object.keys(data).map((uid) => ({
  uid,
  ...data[uid],
}));

setPlayers(playersArray);

}


setLoading(false);


}


getPlayers();


},[]);


// Options for the position dropdown, generated from the actual data so the
// value shown always matches what's stored in Firebase (any casing).

const positionOptions = [...new Set(

players

.map((player)=>player.profile?.position)

.filter(Boolean)

)];


let filteredPlayers = [...players];


filteredPlayers = filteredPlayers.filter((player)=>

(
  (player.profile?.name || "") +
  " " +
  (player.profile?.surname || "")
)
.toLowerCase()
.includes(search.toLowerCase())

);


if(position !== ""){

filteredPlayers = filteredPlayers.filter(

(player)=>

(player.profile?.position || "").toLowerCase() === position.toLowerCase()

);

}


if(age==="16-18"){

filteredPlayers = filteredPlayers.filter(

(player)=>
Number(player.profile?.age)>=16 &&
Number(player.profile?.age)<=18

);

}


if(age==="19-21"){

filteredPlayers = filteredPlayers.filter(

(player)=>
Number(player.profile?.age)>=19 &&
Number(player.profile?.age)<=21

);

}


if(age==="22+"){

filteredPlayers = filteredPlayers.filter(

(player)=>
Number(player.profile?.age)>=22

);

}


if(sort==="age-asc"){

filteredPlayers.sort(

(a,b)=>(Number(a.profile?.age)||0)-(Number(b.profile?.age)||0)

);

}


if(sort==="age-desc"){

filteredPlayers.sort(

(a,b)=>(Number(b.profile?.age)||0)-(Number(a.profile?.age)||0)

);

}


const hasActiveFilters = search !== "" || position !== "" || age !== "" || sort !== "";


const resetFilters = () => {

setSearch("");

setPosition("");

setAge("");

setSort("");

};


return(

<>


<Navbar/>


<section className="players-page">


<div className="players-header">

<span className="players-eyebrow">Footbaz</span>

<h1>Lojtarët</h1>

<p>

Zbulo talentet e platformës Footbaz.

</p>

</div>


<div className="players-filter-panel">


<div className="players-filters">


<div className="players-search-input">

<LuSearch />

<input

type="text"

placeholder="Kërko lojtar..."

value={search}

onChange={(e)=>setSearch(e.target.value)}

/>

{search && (

<button

type="button"

className="players-search-clear"

onClick={()=>setSearch("")}

aria-label="Pastro kërkimin"

>

<LuX />

</button>

)}

</div>


<select

value={position}

onChange={(e)=>setPosition(e.target.value)}

>


<option value="">

Pozicioni

</option>


{positionOptions.map((pos)=>(

<option key={pos} value={pos}>

{pos.toUpperCase()}

</option>

))}


</select>


<select

value={age}

onChange={(e)=>setAge(e.target.value)}

>


<option value="">

Mosha

</option>

<option value="16-18">

16-18

</option>

<option value="19-21">

19-21

</option>

<option value="22+">

22+

</option>


</select>


<select

value={sort}

onChange={(e)=>setSort(e.target.value)}

>

<option value="">

Rendit sipas

</option>


<option value="age-asc">

Mosha ↑

</option>


<option value="age-desc">

Mosha ↓

</option>


</select>


{hasActiveFilters && (

<button

type="button"

className="players-reset-btn"

onClick={resetFilters}

>

Pastro filtrat

</button>

)}


</div>


</div>


{!loading && (

<p className="players-count">

{filteredPlayers.length} {filteredPlayers.length === 1 ? "lojtar u gjet" : "lojtarë u gjetën"}

</p>

)}


{loading && (

<p className="players-empty">Duke ngarkuar lojtarët...</p>

)}


{!loading && filteredPlayers.length === 0 && (

<p className="players-empty">

Nuk u gjet asnjë lojtar me këto kritere.

</p>

)}


{!loading && filteredPlayers.length > 0 && (

<div className="players-grid">


{filteredPlayers.map((player)=>(

<PlayerCard

key={player.uid}

player={player}

/>

))}


</div>

)}


</section>


</>

)


}


export default Players;