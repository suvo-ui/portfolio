import { ReactNode, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

type Props = {
  children: ReactNode;
};

export default function ProtectedRoute({ children }: Props) {
  const { isAdmin, isLoading } = useAuth();

  useEffect(() => {
    // If not admin and not loading, force redirect immediately
    if (!isLoading && !isAdmin) {
      window.location.href = "/login";
    }
  }, [isAdmin, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAdmin) {
    // Use window.location for immediate redirect instead of Navigate
    window.location.href = "/login";
    return null;
  }

  return <>{children}</>;
}
