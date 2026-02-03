import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    const res = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/api/auth/login`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      },
    );

    const data = await res.json();

    if (data.success) {
      localStorage.setItem("adminToken", data.token);
      navigate("/admin");
    } else {
      alert("Invalid login");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="bg-zinc-900 p-8 rounded-xl w-96">
        <h2 className="text-white text-xl mb-4">Admin Login</h2>
        <input
          className="w-full p-2 mb-3 bg-zinc-800 text-white"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          className="w-full p-2 mb-4 bg-zinc-800 text-white"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          onClick={handleLogin}
          className="w-full bg-white text-black py-2 rounded">
          Login
        </button>
      </div>
    </div>
  );
}
