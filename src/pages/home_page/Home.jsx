import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "../../components/navbar/Navbar";
import Hero from "../../components/hero/Hero";
import Pse_Talento11 from "../../components/pseTalento11/Pse_Talento11";
import Si_Funksionon from "../../components/siFunksionon/Si_Funksiono";
import Lojtaret_Ne_Fokus from "../../components/lojtaret_ne_fokus/Lojtaret_Ne_Fokus";
import Footer from "../../components/footer/Footer";

function Home() {

  const { hash } = useLocation();

  useEffect(() => {
    if (!hash) return;

    const section = document.querySelector(hash);
    if (!section) return;

    requestAnimationFrame(() => {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [hash]);

  return (
    <>
      <Navbar/>
      <Hero/>
      <Pse_Talento11/>
      <Si_Funksionon/>
      <Lojtaret_Ne_Fokus/>
      <Footer/>
    </>
  )
}

export default Home
