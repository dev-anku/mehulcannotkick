import { useState } from "react";
import Login from "./pages/Login";
import Lobby from "./pages/Lobby";

export default function App() {
  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem("token"));

  return loggedIn ? <Lobby /> : <Login onLogin={() => setLoggedIn(true)} />;
}

