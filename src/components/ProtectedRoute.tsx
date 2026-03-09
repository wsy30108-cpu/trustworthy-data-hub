import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Outlet } from "react-router-dom";

export function ProtectedRoute() {
  const { isAuthenticated, openAuthModal } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      openAuthModal("login");
    }
  }, [isAuthenticated, openAuthModal]);

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <span className="text-primary text-2xl font-bold">可</span>
          </div>
          <h2 className="text-xl font-semibold text-foreground">请先登录</h2>
          <p className="text-sm text-muted-foreground">您需要登录后才能访问此页面</p>
          <button onClick={() => openAuthModal("login")} className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90">
            立即登录
          </button>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
