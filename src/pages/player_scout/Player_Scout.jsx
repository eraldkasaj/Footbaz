import "./Player_Scout.css";

import Navbar from "../../components/navbar/Navbar";

import { Link } from "react-router-dom";

import { LuUsers, LuShield, LuArrowRight } from "react-icons/lu";


function Player_Scout() {

  return (

    <>

      <Navbar />


      <section className="player-scout">


        <div className="player-scout-header">

          <span className="player-scout-eyebrow">Zgjidh rrugën tënde</span>

          <h1>Lojtarë & Klube</h1>

          <p>

            Zgjidh kategorinë që dëshiron të eksplorosh.

          </p>

        </div>


        <div className="player-scout-cards">


          <div className="category-card">

            <div className="category-icon">

              <LuUsers />

            </div>


            <h2>Lojtarët</h2>


            <p>

              Shiko profilet e lojtarëve,

              statistikat dhe videot e tyre.

            </p>


            <Link to="/players" className="category-btn">

              Shiko Lojtarët

              <LuArrowRight className="category-btn-icon" />

            </Link>


          </div>


          <div className="category-card">

            <div className="category-icon">

              <LuShield />

            </div>


            <h2>Klubet</h2>


            <p>

              Zbulo klubet e platformës

              dhe profilet e tyre.

            </p>


            <Link to="/clubs" className="category-btn">

              Shiko Klubet

              <LuArrowRight className="category-btn-icon" />

            </Link>


          </div>


        </div>


      </section>

    </>

  );

}


export default Player_Scout;