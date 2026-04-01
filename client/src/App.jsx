import { useEffect, useState } from "react";
import api from "./api/axios";
import { connectSocket } from "./api/socket";

function isMyTurn(fight, username) {
  if (!fight || fight.state !== "active") return false;
  return fight.currentTurn === username.toLowerCase();
}

export default function App() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [socket, setSocket] = useState(null);
  const [fight, setFight] = useState(null);
  const [targetUsername, setTargetUsername] = useState("");
  const [betAmount, setBetAmount] = useState("");
  const [claimStatus, setClaimStatus] = useState({
    canClaim: false,
    remainingTime: 0,
  });

  function sendChallenge() {
    if (!targetUsername.trim()) return;

    socket.emit("send_challenge", {
      toUser: targetUsername.trim(),
      betAmount: Number(betAmount) || 0,
    });

    setTargetUsername("");
    setBetAmount("");
  }

  function setupSocketListeners(s) {
    s.on("error_message", ({ message }) => {
      console.error("Server error:", message);
      alert(message);
    });

    s.on("connected", (data) => {
      setOnlineUsers(data.onlineUsers);
    });

    s.on("online_users", (users) => {
      setOnlineUsers(users);
    });

    s.on("receive_challenge", ({ challengeId, fromUser, betAmount }) => {
      const accept = window.confirm(
        `${fromUser} has challenged you for ${betAmount} coins! Accept?`
      );

      if (accept) {
        s.emit("accept_challenge", { challengeId });
      } else {
        s.emit("reject_challenge", { challengeId });
      }
    });

    s.on("challenge_accepted", ({ by }) => {
      alert(`${by} accepted your challenge!`);
    });

    s.on("challenge_rejected", ({ by }) => {
      alert(`${by} rejected your challenge.`);
    });

    s.on("fight_started", (data) => {
      setFight(data);
    });

    s.on("fight_update", (data) => {
      setFight(data);
    });

    s.on("force_disconnect", () => {
      alert("You logged in from another session.");
      s.disconnect();
      location.reload();
    });
  }

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUsername = localStorage.getItem("username");

    if (!storedToken || !storedUsername) {
      return;
    }

    setToken(storedToken);
    setUsername(storedUsername);

    const s = connectSocket(storedToken);
    setSocket(s);

    setupSocketListeners(s);
  }, []);

  async function register() {
    setLoading(true);
    setError("");

    try {
      await api.post("/auth/register", { username, password });
      alert("Registered successfully");
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  async function login() {
    setLoading(true);
    setError("");

    try {
      const res = await api.post("/auth/login", { username, password });
      const token = res.data.token;
      const uname = res.data.username;

      localStorage.setItem("token", token);
      localStorage.setItem("username", uname);

      setToken(token);
      setUsername(uname);

      const s = connectSocket(token);
      setSocket(s);

      setupSocketListeners(s);

      await fetchClaimStatus(token);
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("username");

    if (socket) {
      socket.disconnect();
    }

    setToken(null);
    setSocket(null);
    setFight(null);
    setOnlineUsers([]);

    location.reload();
  }

  async function fetchClaimStatus() {
    const res = await api.get("/claim/status");
    setClaimStatus(res.data);
  }

  async function claimCoins() {
    try {
      const res = await api.post("/claim");
      alert(`+100 coins! Total: ${res.data.coins}`);

      fetchClaimStatus();
    } catch (err) {
      const remaining = err.response?.data?.remainingTime;

      if (remaining) {
        alert(`Available in ${formatTime(remaining)}`);
      }
    }
  }

  function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    return `${hours}h ${minutes}m`;
  }

  // ===== WIN SCREEN =====
  if (fight && fight.state === "finished") {
    const didIWin = fight.winner === username;
    const opponent =
      fight.playerA === username ? fight.playerB : fight.playerA;

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-gray-100">
        <div className="bg-gray-900 p-6 rounded-xl shadow-lg border border-gray-800 w-96">
          <h2 className="text-lg font-semibold mb-2">
            {didIWin ? "You Won 🎉" : "You Lost 💀"}
          </h2>

          <p className="text-sm text-gray-400 mb-3">
            Winner:{" "}
            <span className="text-green-400">{fight.winner}</span>
          </p>

          <h3 className="text-sm text-gray-400">Final Fight Log:</h3>
          <ul className="mt-2 space-y-1 text-sm">
            {fight.log.map((entry, i) => (
              <li key={i}>• {entry}</li>
            ))}
          </ul>

          <button
            className="mt-4 w-full px-3 py-2 bg-green-600 text-black font-medium rounded"
            onClick={() => {
              setFight(null);
              socket.emit("send_challenge", { toUser: opponent, betAmount: fight.betAmount || 0 });
            }}
          >
            Rematch
          </button>

          <button
            className="mt-4 w-full px-3 py-2 bg-green-600 text-black font-medium rounded"
            onClick={() => setFight(null)}
          >
            Back to Lobby
          </button>
        </div>
      </div >
    );
  }

  // ===== ACTIVE FIGHT UI =====
  if (fight) {
    const myTurn = isMyTurn(fight, username);
    const opponent =
      fight.playerA === username ? fight.playerB : fight.playerA;

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-gray-100">
        <div className="bg-gray-900 p-6 rounded-xl shadow-lg border border-gray-800 w-96">
          <h2 className="text-lg font-semibold mb-2">Fight in Progress</h2>

          <div className="mt-2 text-sm">
            <p>
              <span className="text-green-400">You:</span>{" "}
              {fight.playerA === username
                ? fight.healthA
                : fight.healthB}
              %
            </p>

            <p>
              <span className="text-red-400">
                Opponent ({opponent}):
              </span>{" "}
              {fight.playerA === username
                ? fight.healthB
                : fight.healthA}
              %
            </p>
          </div>

          <p className="mt-3 text-sm">
            Turn:{" "}
            <span className={myTurn ? "text-green-400" : "text-gray-400"}>
              {myTurn ? "Your turn" : `${opponent}'s turn`}
            </span>
          </p>

          <p className="text-yellow-400">
            Bet: {fight.betAmount} coins (Winner takes all)
          </p>

          <div className="mt-4 flex gap-2">
            <button
              disabled={!myTurn || fight.state !== "active"}
              onClick={() =>
                socket.emit("fight_action", {
                  fightId: fight.fightId || fight._id,
                  action: "PUNCH",
                })
              }
              className="px-3 py-2 bg-gray-800 rounded disabled:opacity-50"
            >
              Punch
            </button>

            <button
              disabled={!myTurn || fight.state !== "active"}
              onClick={() =>
                socket.emit("fight_action", {
                  fightId: fight.fightId || fight._id,
                  action: "KICK",
                })
              }
              className="px-3 py-2 bg-gray-800 rounded disabled:opacity-50"
            >
              Kick
            </button>

            <button
              disabled={!myTurn || fight.state !== "active"}
              onClick={() =>
                socket.emit("fight_action", {
                  fightId: fight.fightId || fight._id,
                  action: "FLEE",
                })
              }
              className="px-3 py-2 bg-red-700 rounded disabled:opacity-50"
            >
              Flee
            </button>
          </div>

          <div className="mt-4 text-sm">
            <h3 className="text-gray-400">Fight Log:</h3>
            <ul className="mt-2 space-y-1">
              {fight.log.map((entry, i) => (
                <li key={i}>• {entry}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // ===== LOBBY (LOGGED IN, NO FIGHT) =====
  if (token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-gray-100">
        <div className="bg-gray-900 p-6 rounded-xl shadow-lg border border-gray-800 w-96">
          <h1 className="text-xl font-semibold mb-2">
            Logged in as:{" "}
            <span className="text-green-400">{username}</span>
          </h1>

          <h3 className="mt-4 text-sm text-gray-400">Online Users:</h3>
          <ul className="mt-2 text-sm">
            {onlineUsers.map((u) => (
              <li key={u} className="text-green-300">
                • {u}
              </li>
            ))}
          </ul>

          <div className="mt-6 space-y-3">
            <input
              type="text"
              value={targetUsername}
              onChange={(e) => setTargetUsername(e.target.value)}
              placeholder="Challenge username..."
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded"
              onKeyDown={(e) => {
                if (e.key === "Enter") sendChallenge();
              }}
            />

            <input
              type="number"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              placeholder="Bet amount"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded"
              onKeyDown={(e) => {
                if (e.key === "Enter") sendChallenge();
              }}
            />

            <button
              onClick={sendChallenge}
              className="w-full px-3 py-2 bg-green-600 text-black font-medium rounded hover:bg-green-500"
            >
              Send Challenge
            </button>
          </div>

          <div className="mt-4 text-sm text-yellow-400">
            (Press Enter to send challenge)
          </div>

          <button
            onClick={logout}
            className="mt-2 w-full px-3 py-2 bg-red-600 text-black rounded"
          >
            Logout
          </button>

          <div className="mt-4">
            {claimStatus.canClaim ? (
              <button
                onClick={claimCoins}
                className="w-full px-3 py-2 bg-green-600 text-black rounded"
              >
                Claim Available (+100 coins)
              </button>
            ) : (
              <div className="text-sm text-gray-400 text-center">
                Available in {formatTime(claimStatus.remainingTime)}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ===== AUTH SCREEN =====
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 text-gray-100">
      <div className="bg-gray-900 p-6 rounded-xl shadow-lg border border-gray-800 w-96">
        <h2 className="text-xl font-semibold mb-4">Fight Game — Auth</h2>

        {error && (
          <div className="mb-4 p-2 text-sm text-red-400 bg-red-900/20 border border-red-800 rounded">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <input
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
            placeholder="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            type="password"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
            placeholder="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="flex gap-3 mt-5">
          <button
            onClick={register}
            disabled={loading}
            className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded hover:bg-gray-700 disabled:opacity-50"
          >
            Register
          </button>

          <button
            onClick={login}
            disabled={loading}
            className="flex-1 px-3 py-2 bg-green-600 text-black font-medium rounded hover:bg-green-500 disabled:opacity-50"
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
}

