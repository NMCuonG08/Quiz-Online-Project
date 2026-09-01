"use client";

import { FormEvent, useState } from "react";
import { ArrowLeft, Mail } from "lucide-react";
import { Button } from "@/common/components/ui/button";
import { Input } from "@/common/components/ui/input";
import { LocalizedLink } from "@/common/components/ui";
import { useLocalizedRouter } from "@/common/hooks/useLocalizedRouter";
import { APP_ROUTES } from "@/lib/appRoutes";
import { AuthenticationService } from "../common/services/auth.service";

export default function ForgotPasswordPage() {
  const router = useLocalizedRouter();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setError(null);
    setSubmitting(true);
    try {
      const response = await AuthenticationService.forgotPassword(email);
      if (response?.success === false || response?.error) {
        setError(response?.error?.message || response?.message || "Không thể gửi yêu cầu.");
      } else {
        setMessage(response?.message || "Nếu email tồn tại, hướng dẫn đặt lại mật khẩu đã được gửi.");
      }
    } catch {
      setError("Không thể kết nối máy chủ. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl sm:p-8">
        <button type="button" onClick={() => router.back()} className="mb-8 grid size-10 place-items-center rounded-xl bg-muted text-muted-foreground hover:bg-accent" aria-label="Quay lại">
          <ArrowLeft className="size-5" />
        </button>
        <div className="mb-8">
          <div className="mb-3 grid size-12 place-items-center rounded-2xl bg-[#FDD239] text-slate-950"><Mail className="size-6" /></div>
          <h1 className="text-2xl font-bold">Quên mật khẩu?</h1>
          <p className="mt-2 text-sm text-muted-foreground">Nhập email để nhận hướng dẫn đặt lại mật khẩu.</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <Input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Địa chỉ email" className="h-11" />
          {message && <p className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700">{message}</p>}
          {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={submitting} className="h-11 w-full">{submitting ? "Đang gửi..." : "Gửi hướng dẫn"}</Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Nhớ mật khẩu? <LocalizedLink href={APP_ROUTES.AUTH.LOGIN} className="font-semibold text-foreground hover:underline">Đăng nhập</LocalizedLink>
        </p>
      </div>
    </div>
  );
}
