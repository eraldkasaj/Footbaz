import "./Video_E_Dites.css";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { LuChevronRight, LuShield, LuX } from "react-icons/lu";
import { db } from "../../firebase/firebase";
import { ref, get } from "firebase/database";
import defaultAvatar from "../../assets/images/avatar-player.png";
import Club_Crest from "../club_crest/Club_Crest";

// Zgjedh "video e ditës" në mënyrë deterministe nga dita e sotme — e njëjta
// video shfaqet gjithë ditën për të gjithë vizitorët (jo random në çdo
// ngarkim faqeje), dhe të nesërmen kalon te video-ja tjetër në listë, duke u
// rrotulluar nëpër të gjitha videot e ngarkuara nga lojtarët.
function pickVideoOfTheDay(videos) {
  if (videos.length === 0) return null;

  const dayIndex = Math.floor(Date.now() / 86400000);
  return videos[dayIndex % videos.length];
}

function Video_E_Dites() {
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    const getVideoOfTheDay = async () => {
      const playersRef = ref(db, "players");
      const snapshot = await get(playersRef);

      if (snapshot.exists()) {
        const data = snapshot.val();

        // Rrafshohen videot e të gjithë lojtarëve në një listë të vetme,
        // secila me referencë te lojtari që e ka ngarkuar (emër, klub, foto).
        // Klubi/liga bien fallback te zëri i fundit i Karrierës pa datë
        // mbarimi — njësoj si te Player_Card.jsx, që të mos dalë "pa klub"
        // për llogaritë e vjetra që s'e kishin fushën e dedikuar.
        const allVideos = Object.entries(data).flatMap(([uid, player]) => {
          const profile = player.profile || {};
          const careerEntries = Object.values(player.career || {});
          const currentCareerEntry =
            careerEntries.find((entry) => !entry.endYear) || careerEntries[careerEntries.length - 1];
          const videoEntries = player.videos ? Object.values(player.videos) : [];

          return videoEntries
            .filter((entry) => entry?.url)
            .map((entry) => ({
              uid,
              url: entry.url,
              name: `${profile.name || ""} ${profile.surname || ""}`.trim() || "Lojtar",
              club: profile.club || currentCareerEntry?.club || "",
              clubId: profile.clubId || currentCareerEntry?.clubId || "",
              photoURL: profile.photoURL || "",
            }));
        });

        setVideo(pickVideoOfTheDay(allVideos));
      }

      setLoading(false);
    };

    getVideoOfTheDay();
  }, []);

  // Video luan vetë (e heshtur, kërkesë e browser-ave për autoplay) kur
  // hyn në ekran gjatë scroll-it, dhe ndalon kur del jashtë — useri mund ta
  // ç'heshtë duke klikuar te kontrollet native të video-s.
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          videoEl.play().catch(() => {});
        } else {
          videoEl.pause();
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(videoEl);

    return () => observer.disconnect();
  }, [video]);

  if (dismissed || (!loading && !video)) {
    return null;
  }

  return (
    <section className="video-of-day">

      {loading ? (
        <p className="video-of-day-loading">Duke ngarkuar...</p>
      ) : (
        <div className="video-of-day-card">
          <button
            type="button"
            className="video-of-day-dismiss"
            onClick={() => setDismissed(true)}
            title="Mbylle"
            aria-label="Mbylle"
          >
            <LuX />
          </button>

          <div className="video-of-day-player">
            <video
              ref={videoRef}
              src={video.url}
              controls
              muted
              playsInline
            />
          </div>

          <div className="video-of-day-info">
            <img
              src={video.photoURL || defaultAvatar}
              alt={video.name}
              className="video-of-day-avatar"
            />

            <div className="video-of-day-text">
              <h3>{video.name}</h3>

              <p className="video-of-day-club">
                {video.club ? (
                  <>
                    <span className="video-of-day-club-icon">
                      <Club_Crest name={video.club} seed={video.clubId} size={16} />
                    </span>{" "}
                    {video.club}
                  </>
                ) : (
                  <><LuShield /> Klubi nuk është vendosur</>
                )}
              </p>
            </div>

            <Link
              to={`/players/${video.uid}`}
              className="video-of-day-link"
              title="Shiko Profilin"
              aria-label="Shiko Profilin"
            >
              <LuChevronRight />
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}

export default Video_E_Dites;
