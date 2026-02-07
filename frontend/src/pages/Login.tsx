import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const navigate = useNavigate();

  // ✅ Check session ONLY once
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/auth/me`,
          { credentials: "include" }
        );

        if (res.status === 200) {
          navigate("/admin", { replace: true });
          return;
        }
      } catch {}

      setCheckingAuth(false);
    };

    checkAuth();
  }, [navigate]);

  const handleLogin = async () => {
    if (!email || !password) {
      alert("Email and password required");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, password }),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Login failed");
      }

      navigate("/admin", { replace: true });
    } catch (err: any) {
      alert(err.message || "Invalid login");
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="bg-zinc-900 p-8 rounded-xl w-96 border border-zinc-800">
        <h2 className="text-white text-xl mb-6 text-center">Admin Login</h2>

        <input
          type="email"
          className="w-full p-2 mb-3 bg-zinc-800 text-white rounded"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <div className="relative mb-5">
          <input
            type={showPassword ? "text" : "password"}
            className="w-full p-2 pr-10 bg-zinc-800 text-white rounded"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-white text-black py-2 rounded disabled:opacity-50"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </div>
    </div>
  );
}
