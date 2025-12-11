// components/guards/AuthGuard.tsx
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { ReactNode } from "react";
import CreateLoading from "@/common/components/CreateLoading";
import { withLocalePrefix, detectLocaleFromPath } from "@/lib/locale";

interface AuthGuardProps {
  children: ReactNode;
  requiredRole?: string | null;
  redirectTo?: string;
  fallback?: ReactNode | null;
}

const AuthGuard = ({
  children,
  requiredRole = null,
  redirectTo = "/auth/login",
  fallback = null,
}: AuthGuardProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);
  const { isAuthenticated, user, loading } = useSelector((state) => state.auth);

  const localizedRedirect = useMemo(() => {
    const locale = detectLocaleFromPath(pathname ?? "/");
    return withLocalePrefix(redirectTo, { pathname, locale });
  }, [pathname, redirectTo]);

  useEffect(() => {
    const checkAuth = async () => {
      // Đợi auth loading xong
      if (loading) return;

      // Nếu chưa authenticate
      if (!isAuthenticated) {
        router.replace(localizedRedirect);
        return;
      }

      // Nếu cần role specific và user không có quyền
      if (requiredRole && user?.role !== requiredRole) {
        router.replace("/unauthorized");
        return;
      }

      setIsChecking(false);
    };

    checkAuth();
  }, [isAuthenticated, user, loading, requiredRole, router, localizedRedirect]);

  // Vẫn đang check auth status
  if (loading || isChecking) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center">
          <CreateLoading />
        </div>
      )
    );
  }

  // Nếu không authenticated hoặc không đủ quyền thì không render gì
  if (!isAuthenticated || (requiredRole && user?.role !== requiredRole)) {
    return null;
  }

  return children;
};

export default AuthGuard;
