import { useEffect, useState, ReactNode } from "react";
import { Navigate } from "react-router-dom";

type Props = {
  children: ReactNode;
};

export default function ProtectedRoute({ children }: Props) {
  const [loading, setLoading] = useState(true);
  const [isAuth, setIsAuth] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/auth/me`,
          { credentials: "include" }
        );

        setIsAuth(res.status === 200);
      } catch {
        setIsAuth(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // ⏳ While checking
  if (loading || isAuth === null) return null;

  // ❌ Not logged in → redirect ONCE
  if (!isAuth) return <Navigate to="/login" replace />;

  // ✅ Logged in
  return <>{children}</>;
}
