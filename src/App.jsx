import './App.css'
import Home from "./pages/home_page/Home";
import Player_Scout from "./pages/player_scout/Player_Scout";
import Players from "./pages/players/Players";
import Player_Profile from "./pages/player_profile/Player_Profile";
import Clubs from "./pages/clubs/Clubs";
import Club_Profile from "./pages/club_profile/Club_Profile";
import Login from "./pages/login/Login";
import Register from "./pages/register/Register";
import Dashboard from "./pages/dashboard/Dashboard";
import Player_Dashboard from "./pages/player_dashboard/Player_Dashboard";
import Club_Dashboard from "./pages/club_dashboard/Club_Dashboard";
import Edit_Club_Profile from "./pages/edit_club_profile/Edit_Club_Profile";
import My_Profile from "./pages/my_profile/My_Profile";
import Edit_Profile from "./pages/edit_profile/Edit_Profile";
import Statistics from "./pages/statistics/Statistics";
import Messages from "./pages/messages/Messages";
import Visits from "./pages/visits/Visits";
import Settings from "./pages/settings/Settings";
import Player_Settings from "./pages/player_settings/Player_Settings";
import Forgot_Password from "./pages/forgot_password/Forgot_Password";
import {Routes ,Route} from 'react-router-dom'


function App() {

  return (
   <Routes>
    <Route path='/' element={<Home/>} />
    <Route path='player-scout' element={<Player_Scout/>} />
    <Route path="/players" element={<Players />} />
    <Route path="/players/:id" element={<Player_Profile />} />
    <Route path="/clubs" element={<Clubs />} />
    <Route path="/clubs/:id" element={<Club_Profile />} />
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/player-dashboard" element={<Player_Dashboard />}/>
    <Route path="/club-dashboard" element={<Club_Dashboard/>}/>
    <Route path="/edit-club-profile" element={<Edit_Club_Profile />} />
    <Route path="/my-profile" element={<My_Profile />} />
    <Route path="/edit-profile" element={<Edit_Profile />} />
    <Route path="/statistics" element={<Statistics />} />
    <Route path="/messages" element={<Messages />} />
    <Route path="/visits" element={<Visits />} />
    <Route path="/settings" element={<Settings />} />
    <Route path="/player-settings" element={<Player_Settings />} />
    <Route path="/forgot-password" element={<Forgot_Password/>} />

   </Routes>
      
    
  )
}

export default App
