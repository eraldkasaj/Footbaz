import "./Scout_Dashboard.css";

import { useEffect, useState, useMemo } from "react";

import { auth, db } from "../../firebase/firebase";

import { ref, get } from "firebase/database";

import { useNavigate } from "react-router-dom";

import { signOut } from "firebase/auth";



function Scout_Dashboard(){


const [players,setPlayers] = useState([]);

const [search,setSearch] = useState("");

const [favorites,setFavorites] = useState([]);

const [currentUser,setCurrentUser] = useState(null);


const [filters,setFilters] = useState({

position:"all",

age:"all",

city:"all",

club:"all",

height:"all",

});


const [sortBy,setSortBy] = useState("recent");


const [page,setPage] = useState(1);


const playersPerPage = 5;


const navigate = useNavigate();





const logout = async()=>{


try{


await signOut(auth);


navigate("/login");


}


catch(error){


console.log(error.message);


}


}


useEffect(()=>{


const getPlayers = async()=>{


const usersRef = ref(db,"users");


const snapshot = await get(usersRef);


if(snapshot.exists()){


const data = snapshot.val();


const playersArray = Object.keys(data)
.map((id)=>({

id:id,

...data[id]

}))
.filter((user)=> user.role === "player");


setPlayers(playersArray);


}


};


getPlayers();


},[]);


// ------- Options for filter dropdowns, derived from the loaded players -------

const positionOptions = useMemo(()=>(

[...new Set(players.map((p)=>p.profile?.position).filter(Boolean))]

),[players]);


const cityOptions = useMemo(()=>(

[...new Set(players.map((p)=>p.profile?.city).filter(Boolean))]

),[players]);


const clubOptions = useMemo(()=>(

[...new Set(players.map((p)=>p.profile?.club).filter(Boolean))]

),[players]);


// ------- Filtering -------

const filteredPlayers = players

.filter((player)=>

(player.name + " " + player.surname)
.toLowerCase()
.includes(search.toLowerCase())

)

.filter((player)=>

filters.position === "all" ? true : player.profile?.position === filters.position

)

.filter((player)=>

filters.city === "all" ? true : player.profile?.city === filters.city

)

.filter((player)=>

filters.club === "all" ? true : player.profile?.club === filters.club

)

.filter((player)=>{

if(filters.age === "all") return true;

const age = Number(player.profile?.age);

if(filters.age === "u18") return age < 18;

if(filters.age === "18-21") return age >= 18 && age <= 21;

if(filters.age === "22-25") return age >= 22 && age <= 25;

if(filters.age === "25+") return age > 25;

return true;

})

.filter((player)=>{

if(filters.height === "all") return true;

const height = Number(player.profile?.height);

if(filters.height === "u175") return height < 1.75;

if(filters.height === "175-185") return height >= 1.75 && height <= 1.85;

if(filters.height === "185+") return height > 1.85;

return true;

});


// ------- Sorting -------

const sortedPlayers = [...filteredPlayers].sort((a,b)=>{

if(sortBy === "name") return (a.name || "").localeCompare(b.name || "");

if(sortBy === "age") return (Number(a.profile?.age)||0) - (Number(b.profile?.age)||0);

if(sortBy === "height") return (Number(b.profile?.height)||0) - (Number(a.profile?.height)||0);

return 0; // "recent" -> keep original order

});


// ------- Pagination -------

const totalPages = Math.max(1, Math.ceil(sortedPlayers.length / playersPerPage));

const paginatedPlayers = sortedPlayers.slice(

(page - 1) * playersPerPage,

page * playersPerPage

);


useEffect(()=>{

setPage(1);

},[search,filters,sortBy]);


// ------- Favorites -------

const toggleFavorite = (playerId)=>{

setFavorites((prev)=>

prev.includes(playerId)

? prev.filter((id)=>id !== playerId)

: [...prev, playerId]

);

};


const getInitials = (player)=>{

const first = player.name?.[0] || "";

const last = player.surname?.[0] || "";

return (first + last).toUpperCase();

};


return(

<section className="scout-dashboard">


{/* ---------------- SIDEBAR ---------------- */}

<aside className="scout-sidebar">


<div className="scout-sidebar-top">


<h2 className="scout-logo">

Foot<span>baz</span>

</h2>


<div className="scout-user">

<div className="scout-user-avatar">

{currentUser ? getInitials(currentUser) : "AS"}

</div>


<div>

<p className="scout-user-name">

{currentUser ? `${currentUser.name} ${currentUser.surname}` : "Arben Strakosha"}

</p>

<p className="scout-user-role">

Scout <span className="scout-user-dot" />

</p>

</div>

</div>


</div>


<nav className="scout-nav">

<ul>

<li className="active">

<span className="scout-nav-icon">🏠</span> Dashboard

</li>

<li onClick={()=>navigate("/players")}>

<span className="scout-nav-icon">👥</span> Players

</li>

<li onClick={()=>navigate("/favorites")}>

<span className="scout-nav-icon">⭐</span> Favorites

</li>

<li onClick={()=>navigate("/messages")}>

<span className="scout-nav-icon">💬</span> Messages

{true && <span className="scout-nav-badge">3</span>}

</li>

<li onClick={()=>navigate("/shortlist")}>

<span className="scout-nav-icon">📋</span> Shortlist

</li>

<li onClick={()=>navigate("/settings")}>

<span className="scout-nav-icon">⚙</span> Settings

</li>

</ul>

</nav>


<button 
className="scout-logout" 
onClick={logout}
>

<span className="scout-nav-icon">

⏻

</span>

Logout

</button>


</aside>


{/* ---------------- MAIN CONTENT ---------------- */}

<div className="scout-content">


<div className="scout-header">

<div>

<h1>Scout Dashboard</h1>

<p>Zbulo talentet e së ardhmes.</p>

</div>


<div className="scout-header-actions">

<div className="scout-search-input">

<span>🔍</span>

<input

type="text"

placeholder="Search players..."

value={search}

onChange={(e)=>setSearch(e.target.value)}

/>

</div>


<button className="scout-bell">🔔</button>

</div>

</div>


<div className="scout-stats">


<div className="scout-stat-card">

<div className="scout-stat-icon green">👥</div>

<div>

<p className="scout-stat-label">Total Players</p>

<h2>{players.length}</h2>

<p className="scout-stat-sub">+120 këtë javë</p>

</div>

</div>


<div className="scout-stat-card">

<div className="scout-stat-icon yellow">⭐</div>

<div>

<p className="scout-stat-label">Favorites</p>

<h2>{favorites.length}</h2>

<p className="scout-stat-sub">Lojtarë të favorizuar</p>

</div>

</div>


<div className="scout-stat-card">

<div className="scout-stat-icon blue">💬</div>

<div>

<p className="scout-stat-label">Messages</p>

<h2>3</h2>

<p className="scout-stat-sub">Biseda aktive</p>

</div>

</div>


</div>


<div className="scout-filter-panel">


<h3>Kërkim &amp; Filtër</h3>


<div className="scout-filter-search">

<span>🔍</span>

<input

type="text"

placeholder="Kërko lojtarë sipas emrit..."

value={search}

onChange={(e)=>setSearch(e.target.value)}

/>

<button>🔍 Kërko</button>

</div>


<div className="scout-filter-row">


<div className="scout-filter-field">

<label>Pozicioni</label>

<select

value={filters.position}

onChange={(e)=>setFilters({...filters, position:e.target.value})}

>

<option value="all">Të gjitha</option>

{positionOptions.map((pos)=>(

<option key={pos} value={pos}>{pos}</option>

))}

</select>

</div>


<div className="scout-filter-field">

<label>Mosha</label>

<select

value={filters.age}

onChange={(e)=>setFilters({...filters, age:e.target.value})}

>

<option value="all">Të gjitha</option>

<option value="u18">Nën 18</option>

<option value="18-21">18 - 21</option>

<option value="22-25">22 - 25</option>

<option value="25+">Mbi 25</option>

</select>

</div>


<div className="scout-filter-field">

<label>Vendi</label>

<select

value={filters.city}

onChange={(e)=>setFilters({...filters, city:e.target.value})}

>

<option value="all">Të gjitha</option>

{cityOptions.map((city)=>(

<option key={city} value={city}>{city}</option>

))}

</select>

</div>


<div className="scout-filter-field">

<label>Klubi</label>

<select

value={filters.club}

onChange={(e)=>setFilters({...filters, club:e.target.value})}

>

<option value="all">Të gjitha</option>

{clubOptions.map((club)=>(

<option key={club} value={club}>{club}</option>

))}

</select>

</div>


<div className="scout-filter-field">

<label>Lartësia</label>

<select

value={filters.height}

onChange={(e)=>setFilters({...filters, height:e.target.value})}

>

<option value="all">Të gjitha</option>

<option value="u175">Nën 1.75m</option>

<option value="175-185">1.75m - 1.85m</option>

<option value="185+">Mbi 1.85m</option>

</select>

</div>


<button className="scout-more-filters">

Më shumë filtra ⇅

</button>


</div>


</div>


<div className="players-list">


<div className="players-list-header">

<h2>Lojtarët</h2>


<div className="scout-sort">

<span>Rendit sipas:</span>

<select value={sortBy} onChange={(e)=>setSortBy(e.target.value)}>

<option value="recent">Së fundmi</option>

<option value="name">Emri</option>

<option value="age">Mosha</option>

<option value="height">Lartësia</option>

</select>

</div>

</div>


{paginatedPlayers.length === 0 && (

<p className="scout-empty">Nuk u gjet asnjë lojtar me këto kritere.</p>

)}


{paginatedPlayers.map((player)=>(

<div className="scout-player-card" key={player.id}>


<div className="player-photo">

{player.profile?.photoURL ? (

<img src={player.profile.photoURL} alt={player.name} />

) : (

<span>{getInitials(player)}</span>

)}

</div>


<div className="player-main">

<h3>{player.name} {player.surname}</h3>

<p className="player-club">

🛡 {player.profile?.club || "—"}

</p>

<p className="player-league">

🇦🇱 {player.profile?.league || "Superliga Shqiptare U-19"}

</p>

</div>


<div className="player-col">

<span className="player-col-label">Mosha</span>

<span className="player-col-value">{player.profile?.age ?? "—"}</span>

<span className="player-col-sub">{player.profile?.birthdate || ""}</span>

</div>


<div className="player-col">

<span className="player-col-label">Pozicioni</span>

<span className="player-col-value">

<span className="scout-dot" /> {player.profile?.position || "—"}

</span>

</div>


<div className="player-col">

<span className="player-col-label">Lartësia</span>

<span className="player-col-value">{player.profile?.height ? `${player.profile.height} m` : "—"}</span>

</div>


<div className="player-actions">

<button

className={`scout-icon-btn ${favorites.includes(player.id) ? "active" : ""}`}

onClick={()=>toggleFavorite(player.id)}

title="Shto tek favoritet"

>

⭐

</button>


<button

className="scout-icon-btn"

onClick={()=>navigate(`/messages/${player.id}`)}

title="Dërgo mesazh"

>

💬

</button>

</div>


<button

className="scout-view-btn"

onClick={()=>navigate(`/players/${player.id}`)}

>

Shiko Profilin

</button>


</div>

))}


{sortedPlayers.length > 0 && (

<div className="scout-pagination">

<button

disabled={page === 1}

onClick={()=>setPage((p)=>Math.max(1, p - 1))}

>

‹

</button>


{Array.from({length: Math.min(totalPages, 5)}, (_, i)=> i + 1).map((num)=>(

<button

key={num}

className={page === num ? "active" : ""}

onClick={()=>setPage(num)}

>

{num}

</button>

))}


{totalPages > 5 && <span className="scout-pagination-dots">...</span>}


{totalPages > 5 && (

<button

className={page === totalPages ? "active" : ""}

onClick={()=>setPage(totalPages)}

>

{totalPages}

</button>

)}


<button

disabled={page === totalPages}

onClick={()=>setPage((p)=>Math.min(totalPages, p + 1))}

>

›

</button>

</div>

)}


</div>


</div>


</section>


)


}


export default Scout_Dashboard;