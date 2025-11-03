"use client";
import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppDispatch } from "@/hooks/useRedux";
import { loginWithGoogleCode } from "@/modules/auth/common/slices/authSlice";
import { showError, showSuccess } from "@/lib/Notification";

function GoogleCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();

  useEffect(() => {
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const returnedState = searchParams.get("state");

    // If the page is opened in a popup, post message back and close
    const isPopup =
      typeof window !== "undefined" &&
      (window.opener || window.parent !== window);
    if (isPopup) {
      const payload = error
        ? { type: "google_oauth_code", error, state: returnedState }
        : { type: "google_oauth_code", code, state: returnedState };
      try {
        window.opener?.postMessage(payload, window.location.origin);
      } catch {
        try {
          window.opener?.postMessage(payload, "*");
        } catch {}
      }
      setTimeout(() => window.close(), 50);
      return;
    }

    if (error) {
      showError(error);
      router.replace("/auth/login");
      return;
    }

    if (!code) {
      showError("Thiếu mã xác thực từ Google");
      router.replace("/auth/login");
      return;
    }

    // Non-popup flow: exchange code on this page
    const stateForExchange = returnedState || "";
    const redirectUri =
      process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI ||
      `${window.location.origin}/auth/google/callback`;
    dispatch(
      loginWithGoogleCode({ code, state: stateForExchange, redirectUri })
    )
      .unwrap()
      .then((res) => {
        const ok = !(res && (res.error || res?.data?.error));
        if (ok) {
          showSuccess("Đăng nhập Google thành công");
          router.replace("/");
        } else {
          const msg =
            res?.error?.message ||
            res?.data?.error?.message ||
            "Đăng nhập Google thất bại";
          showError(msg);
          router.replace("/auth/login");
        }
      })
      .catch(() => {
        showError("Đăng nhập Google thất bại");
        router.replace("/auth/login");
      });
  }, [dispatch, router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <div className="w-5 h-5 border-1 border-current border-t-transparent rounded-full animate-spin" />
        Đang xử lý đăng nhập Google...
      </div>
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <div className="w-5 h-5 border-1 border-current border-t-transparent rounded-full animate-spin" />
            Đang tải...
          </div>
        </div>
      }
    >
      <GoogleCallbackContent />
    </Suspense>
  );
}
