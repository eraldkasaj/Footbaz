import "./Player_Settings.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  EmailAuthProvider,
  deleteUser,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  signOut,
  updateEmail,
  updateProfile,
} from "firebase/auth";
import { get, ref, remove, set, update } from "firebase/database";
import { LuArrowLeft, LuKeyRound, LuSave, LuShieldAlert, LuTrash2 } from "react-icons/lu";
import { auth, db } from "../../firebase/firebase";

function Player_Settings() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [accountData, setAccountData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const loadAccount = async () => {
      const user = auth.currentUser;

      if (!user) {
        navigate("/login");
        return;
      }

      try {
          const [userSnapshot, playerSnapshot] = await Promise.all([
          get(ref(db, `users/${user.uid}`)),
          get(ref(db, `players/${user.uid}`)),
        ]);

        const userData = userSnapshot.val() || {};
        const playerData = playerSnapshot.val() || {};
        const profile = playerData.profile || {};

        setName(profile.name || "");
        setSurname(profile.surname || "");
        setEmail(user.email || userData.email || "");

        setAccountData({
          user: userData,
          player: playerData,
        });
      
      } catch {
        setError("Nuk mundëm të ngarkojmë të dhënat e llogarisë.");
      } finally {
        setLoading(false);
      }
    };

    loadAccount();
  }, [navigate]);

  const reauthenticate = async (user) => {
    if (!currentPassword) {
      throw new Error("Për këtë veprim jep password-in aktual.");
    }

    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
  };

  const saveAccount = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    const user = auth.currentUser;
    const nextEmail = email.trim();

    if (!user || !name.trim() || !surname.trim() || !nextEmail) {
      setError("Plotëso emrin, mbiemrin dhe email-in.");
      return;
    }

    setSaving(true);

    try {
      if (nextEmail !== user.email) {
        await reauthenticate(user);
        await updateEmail(user, nextEmail);
      }

      await updateProfile(user, { displayName: `${name.trim()} ${surname.trim()}` });
      await update(ref(db, `users/${user.uid}`), {
       email: nextEmail,});

      await update(ref(db, `players/${user.uid}/profile`), {
      name: name.trim(),
      surname: surname.trim(),
    }); 

     setAccountData((previous) => ({
  ...previous,
  user: {
    ...previous.user,
    email: nextEmail,
  },
  player: {
    ...previous.player,
    profile: {
      ...previous.player?.profile,
      name: name.trim(),
      surname: surname.trim(),
    },
  },
}));
      setCurrentPassword("");
      setMessage("Të dhënat e llogarisë u përditësuan.");
    } catch (saveError) {
      if (saveError.code === "auth/requires-recent-login") {
        setError("Për ndryshimin e email-it, hyni përsëri në llogari dhe provo përsëri.");
      } else {
        setError(saveError.message || "Përditësimi nuk u krye.");
      }
    } finally {
      setSaving(false);
    }
  };

  const resetPassword = async () => {
    const user = auth.currentUser;
    if (!user?.email) return;

    setMessage("");
    setError("");

    try {
      await sendPasswordResetEmail(auth, user.email);
      setMessage("Linku për ndryshimin e password-it u dërgua në email-in tënd.");
    } catch (resetError) {
      setError(resetError.message || "Nuk mundëm të dërgojmë email-in.");
    }
  };

  const deleteAccount = async () => {
    const user = auth.currentUser;
    if (!user) return;

    setMessage("");
    setError("");

    if (!window.confirm("Je i sigurt që dëshiron të fshish përgjithmonë llogarinë dhe profilin tënd?")) {
      return;
    }

    try {
      await reauthenticate(user);
      const userRef = ref(db, `users/${user.uid}`);
      const playerRef = ref(db, `players/${user.uid}`);

      await remove(userRef);
      await remove(playerRef);

      try {
        await deleteUser(user);
      } catch (deleteError) {
       if (accountData?.user) {
  await set(userRef, accountData.user);
}

if (accountData?.player) {
  await set(playerRef, accountData.player);
}
        throw deleteError;
      }

      navigate("/");
    } catch (deleteError) {
      if (deleteError.code === "auth/requires-recent-login") {
        setError("Hyni përsëri në llogari dhe provo përsëri për ta fshirë.");
      } else {
        setError(deleteError.message || "Llogaria nuk u fshi.");
      }
    }
  };

  const logout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  return (
    <main className="player-settings-page">
      <section className="player-settings-panel">
        <button type="button" className="player-settings-back" onClick={() => navigate("/player-dashboard")}>
          <LuArrowLeft /> Kthehu te profili
        </button>

        <header className="player-settings-header">
          <p>Cilësimet e llogarisë</p>
          <h1>Menaxho profilin tënd</h1>
          <span>Ndrysho të dhënat personale dhe sigurinë e llogarisë.</span>
        </header>

        {message && <p className="player-settings-message is-success">{message}</p>}
        {error && <p className="player-settings-message is-error">{error}</p>}

        {loading ? (
          <p className="player-settings-loading">Duke ngarkuar cilësimet...</p>
        ) : (
          <div className="player-settings-grid">
            <form className="player-settings-card" onSubmit={saveAccount}>
              <h2>Të dhënat personale</h2>
              <p>Emri dhe mbiemri shfaqen në profilin e lojtarit.</p>

              <div className="player-settings-fields">
                <label>Emri<input value={name} onChange={(event) => setName(event.target.value)} /></label>
                <label>Mbiemri<input value={surname} onChange={(event) => setSurname(event.target.value)} /></label>
                <label className="player-settings-full-field">Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
                <label className="player-settings-full-field">
                  Password-i aktual <small>Nevojitet vetëm për ndryshimin e email-it ose fshirjen e llogarisë.</small>
                  <input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} autoComplete="current-password" />
                </label>
              </div>

              <button className="player-settings-save" type="submit" disabled={saving}><LuSave /> {saving ? "Duke ruajtur..." : "Ruaj ndryshimet"}</button>
            </form>

            <section className="player-settings-card">
              <h2>Siguria e llogarisë</h2>
              <p>Mbaje llogarinë të mbrojtur dhe kontrollo aksesin e saj.</p>

              <button type="button" className="player-settings-action" onClick={resetPassword}>
                <LuKeyRound /><span><strong>Ndrysho password-in</strong><small>Dërgo linkun e ndryshimit në email.</small></span>
              </button>
              <button type="button" className="player-settings-action" onClick={logout}>
                <LuArrowLeft /><span><strong>Dil nga llogaria</strong><small>Mbyll sesionin në këtë pajisje.</small></span>
              </button>
              <button type="button" className="player-settings-action is-danger" onClick={deleteAccount}>
                <LuTrash2 /><span><strong>Fshi llogarinë</strong><small>Ky veprim fshin profilin dhe nuk kthehet pas.</small></span>
              </button>

              <div className="player-settings-warning"><LuShieldAlert /> Për fshirjen e llogarisë kërkohet password-i aktual.</div>
            </section>
          </div>
        )}
      </section>
    </main>
  );
}

export default Player_Settings;
