import { useState } from "react";
import { login } from "../api/auth";
import { connectSocket } from "../socket/socket";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    const data = await login(username, password);
    if (data.token) {
      localStorage.setItem("token", data.token);
      connectSocket(data.token);
      onLogin();
    }
  };

  return (
    <div>
      <h2>Login</h2>
      <input placeholder="username" onChange={e => setUsername(e.target.value)} />
      <input type="password" placeholder="password" onChange={e => setPassword(e.target.value)} />
      <button onClick={handleLogin}>Login</button>
    </div>
  );
}

