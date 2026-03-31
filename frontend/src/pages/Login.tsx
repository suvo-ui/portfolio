import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Eye, EyeOff, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const controlClassName =
  "admin-control !h-14 !w-full !rounded-none !border-white/12 !bg-zinc-950/95 !px-4 !text-white !shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] !placeholder:text-zinc-500 focus-visible:!border-primary/50 focus-visible:!ring-0 focus-visible:!ring-offset-0";

const statusCards = [
  {
    label: "Protected Access",
    value: "Admin-only",
    detail: "Secure entry for publishing, content updates, and workshop control.",
  },
  {
    label: "Studio Session",
    value: "Live",
    detail: "Designed to match the premium control-room visual language.",
  },
];

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { isAdmin, isLoading, refreshAuth } = useAuth();

  if (isLoading) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.18),transparent_24%),linear-gradient(180deg,hsl(var(--background))_0%,hsl(15_10%_8%)_100%)]" />
        <motion.div
          className="h-16 w-16 rounded-full border border-primary/30 border-t-primary"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
        />
      </div>
    );
  }

  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  const handleLogin = async (event?: React.FormEvent) => {
    event?.preventDefault();

    if (!email || !password) {
      alert("Email and password required");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Login failed");
      }

      await refreshAuth();
      navigate("/admin", { replace: true });
    } catch (err: any) {
      alert(err.message || "Invalid login");
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.18),transparent_24%),radial-gradient(circle_at_82%_18%,hsl(22_85%_48%/0.12),transparent_20%),linear-gradient(180deg,hsl(var(--background))_0%,hsl(15_10%_8%)_100%)]" />
      <motion.div
        className="absolute -left-24 top-0 h-80 w-80 rounded-full bg-primary/15 blur-3xl"
        animate={{ x: [0, 54, -18, 0], y: [0, 42, 8, 0], scale: [1, 1.12, 0.96, 1] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute right-[-8rem] top-24 h-[28rem] w-[28rem] rounded-full bg-orange-500/10 blur-3xl"
        animate={{ x: [0, -36, 18, 0], y: [0, -24, 12, 0], scale: [0.95, 1.06, 1, 0.95] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(hsl(var(--foreground)/0.14)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--foreground)/0.14)_1px,transparent_1px)] [background-size:120px_120px]" />

      <div className="relative mx-auto flex min-h-screen max-w-7xl items-center px-6 py-8 lg:px-10">
        <div className="grid w-full gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)] lg:items-center">
          <motion.div initial="hidden" animate="visible" variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}>
            <motion.div variants={itemVariants}>
              <Badge
                variant="outline"
                className="mb-6 inline-flex items-center gap-2 border-primary/30 bg-primary/10 px-4 py-2 font-display uppercase tracking-[0.28em] text-primary"
              >
                <motion.span
                  className="h-2 w-2 rounded-full bg-primary"
                  animate={{ opacity: [0.35, 1, 0.35], scale: [0.9, 1.15, 0.9] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                />
                Secure Entry
              </Badge>
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="max-w-4xl font-display text-4xl font-bold leading-[0.95] text-foreground sm:text-5xl lg:text-7xl"
            >
              Beautiful access
              <span className="block text-gradient">for the control room.</span>
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg"
            >
              Sign in to manage artwork launches, course updates, and workshop releases inside the
              same premium studio environment as the admin dashboard.
            </motion.p>

            <motion.div variants={itemVariants} className="mt-10 grid gap-4 sm:grid-cols-2">
              {statusCards.map((card) => (
                <div
                  key={card.label}
                  className="border border-white/10 bg-black/20 p-5 backdrop-blur-xl"
                >
                  <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
                    {card.label}
                  </p>
                  <p className="mt-4 font-display text-3xl font-bold text-foreground">
                    {card.value}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {card.detail}
                  </p>
                </div>
              ))}
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
            className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,hsl(var(--card)/0.88),hsl(var(--background)/0.96))] shadow-[0_28px_90px_rgba(0,0,0,0.42)] backdrop-blur-2xl"
          >
            <motion.div
              className="absolute left-0 top-0 h-px w-40 bg-gradient-to-r from-primary via-white/70 to-transparent"
              animate={{ x: ["-10%", "120%"] }}
              transition={{ duration: 5.5, repeat: Infinity, ease: "linear" }}
            />

            <form onSubmit={handleLogin} className="relative p-6 sm:p-8 lg:p-10">
              <div className="mb-8">
                <div className="mb-4 inline-flex items-center gap-3 border border-primary/20 bg-primary/10 px-4 py-2 backdrop-blur-md">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <span className="font-display text-[11px] uppercase tracking-[0.3em] text-primary">
                    Admin Login
                  </span>
                </div>

                <h2 className="font-display text-3xl font-bold leading-tight text-foreground md:text-4xl">
                  Enter the studio.
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
                  Use your admin credentials to unlock the publishing and content management tools.
                </p>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <Label className="font-display text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
                    Email
                  </Label>
                  <Input
                    type="email"
                    className={controlClassName}
                    placeholder="you@studio.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-3">
                  <Label className="font-display text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      className={`${controlClassName} pr-14`}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 transition-colors hover:text-white"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3 border border-white/10 bg-white/5 px-4 py-3 text-sm text-muted-foreground">
                  <LockKeyhole className="h-4 w-4 text-primary" />
                  Protected route. Session is stored with secure cookies.
                </div>

                <Button
                  type="submit"
                  variant="gold"
                  size="xl"
                  disabled={loading}
                  className="w-full shadow-[0_18px_50px_hsl(var(--primary)/0.22)]"
                >
                  {loading ? "Logging in..." : "Enter Admin"}
                  {!loading && <ArrowRight className="h-4 w-4" />}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
