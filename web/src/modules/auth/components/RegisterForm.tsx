"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LocalizedLink } from "@/common/components/ui";
import { Button } from "@/common/components/ui/button";
import { Input } from "@/common/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/common/components/ui/form";
import {
  registerSchema,
  type RegisterFormData,
} from "@/modules/auth/common/schema/auth";
import { useLocalizedRouter } from "@/common/hooks/useLocalizedRouter";
import { APP_ROUTES } from "@/lib/appRoutes";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { useAuth } from "@/modules/auth/common/hooks/useAuth";
import { showError, showSuccess } from "@/lib/Notification";
import { useAppDispatch } from "@/hooks/useRedux";
import { loginWithGoogleCode } from "@/modules/auth/common/slices/authSlice";
import { useTranslations } from "next-intl";

const RegisterForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useLocalizedRouter();
  const { register } = useAuth();
  const dispatch = useAppDispatch();
  const tAuth = useTranslations("auth");
  const tCommon = useTranslations("common");

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      full_name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    console.log("Form submitted:", data);
    try {
      const result = await register(data);
      if (result.success) {
        console.log("Registration successful:", result.data);
        router.push(APP_ROUTES.HOME);
      } else {
        console.error("Registration failed:", result);
        showError(result || tAuth("registrationFailed"));
      }
    } catch (error) {
      console.error("Error during registration:", error);
    }
    setIsLoading(false);
  };

  const handleGoogleRegister = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const baseAuthUrl = APP_ROUTES.AUTH.GOOGLE_AUTH_URL;
    const redirectUri =
      process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI ||
      `${window.location.origin}${APP_ROUTES.AUTH.GOOGLE_CALLBACK}`;

    if (!clientId) {
      showError(tAuth("missingGoogleClientId"));
      return;
    }

    const state = self.crypto?.randomUUID?.() || `${Date.now()}`;
    try {
      sessionStorage.setItem("google_oauth_state", state);
    } catch { }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      prompt: "consent",
      access_type: "offline",
      include_granted_scopes: "true",
      state,
    });

    const url = `${baseAuthUrl}?${params.toString()}`;

    const width = 520;
    const height = 620;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      url,
      "google_oauth_popup",
      `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,status=no,resizable=yes,scrollbars=yes`
    );

    if (!popup) {
      window.location.href = url;
      return;
    }

    const messageHandler = (event: MessageEvent) => {
      try {
        const allowedOrigin = window.location.origin;
        if (event.origin !== allowedOrigin) return;

        const {
          type,
          code,
          error,
          state: returnedState,
        } = (event.data || {}) as {
          type?: string;
          code?: string;
          error?: string;
          state?: string;
        };

        if (type !== "google_oauth_code") return;

        try {
          const savedState = sessionStorage.getItem("google_oauth_state");
          if (!savedState || savedState !== returnedState) {
            showError(tAuth("invalidState"));
            return;
          }
        } catch { }

        window.removeEventListener("message", messageHandler);
        try {
          popup.close();
        } catch { }

        if (error) {
          showError(error);
          return;
        }
        if (!code) {
          showError(tAuth("missingGoogleCode"));
          return;
        }

        setIsLoading(true);
        const redirectUri =
          process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI ||
          `${window.location.origin}${APP_ROUTES.AUTH.GOOGLE_CALLBACK}`;
        const payload = { code, state: returnedState, redirectUri };
        dispatch(loginWithGoogleCode(payload))
          .unwrap()
          .then((result) => {
            const hasError = !!(
              result &&
              (result.error || result?.data?.error)
            );
            if (hasError) {
              const msg =
                result?.error?.message ||
                result?.data?.error?.message ||
                tAuth("googleLoginFailed");
              showError(msg);
            } else {
              showSuccess(tAuth("googleLoginSuccess"));
              router.push(APP_ROUTES.HOME);
            }
          })
          .catch(() => showError(tAuth("googleLoginFailed")))
          .finally(() => setIsLoading(false));
      } catch {
        // ignore
      }
    };

    window.addEventListener("message", messageHandler);

    const timeout = setTimeout(() => {
      try {
        window.removeEventListener("message", messageHandler);
        if (!popup.closed) popup.close();
      } catch { }
      showError(tAuth("googleLoginTimeout"));
    }, 120000);

    const clear = () => clearTimeout(timeout);
    window.addEventListener("beforeunload", clear, { once: true });
  };

  return (
    <div className="flex-1 flex items-start justify-start lg:items-center lg:justify-center p-4 lg:p-8 bg-background">
      <div className="w-full max-w-md">
        {/* Top Section */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-8">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 cursor-pointer hover:shadow-lg"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <span className="text-xl font-bold text-foreground">QuizMe</span>
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-2">
            {tAuth("createAccount")}
          </h1>
          <p className="text-muted-foreground text-sm">
            {tAuth("registerSubtitle")}
          </p>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Name */}
              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        placeholder={tAuth("fullNamePlaceholder")}
                        type="text"
                        className="h-11 border-0 bg-muted rounded-lg text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-ring transition-all"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-red-500 text-xs" />
                  </FormItem>
                )}
              />

              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        placeholder={tAuth("emailPlaceholder")}
                        type="email"
                        className="h-11 border-0 bg-muted rounded-lg text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-ring transition-all"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-red-500 text-xs" />
                  </FormItem>
                )}
              />

              {/* Password */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="relative">
                        <Input
                          placeholder={tAuth("passwordPlaceholder")}
                          type={showPassword ? "text" : "password"}
                          className="h-11 border-0 bg-muted rounded-lg text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-ring transition-all pr-10"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage className="text-red-500 text-xs" />
                  </FormItem>
                )}
              />

              {/* Confirm Password */}
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="relative">
                        <Input
                          placeholder={tAuth("confirmPasswordPlaceholder")}
                          type={showConfirmPassword ? "text" : "password"}
                          className="h-11 border-0 bg-muted rounded-lg text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-ring transition-all pr-10"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage className="text-red-500 text-xs" />
                  </FormItem>
                )}
              />

              {/* Sign Up Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg font-medium hover:cursor-pointer transition-colors duration-200"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-1 border-current border-t-transparent rounded-full animate-spin" />
                    {tAuth("creatingAccount")}
                  </div>
                ) : (
                  tAuth("createAccountButton")
                )}
              </Button>
            </form>
          </Form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-background px-2 text-muted-foreground">
                {tCommon("or")}
              </span>
            </div>
          </div>

          {/* Google Button */}
          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleRegister}
            className="w-full h-11 border  border-border bg-blue hover:bg-accent hover:text-accent-foreground rounded-lg font-medium transition-colors"
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {tAuth("continueWithGoogle")}
          </Button>

          {/* Bottom Text */}
          <p className="text-center text-xs text-muted-foreground mt-6">
            {tAuth("alreadyHaveAccount")}{" "}
            <LocalizedLink
              href={APP_ROUTES.AUTH.LOGIN}
              className="text-foreground font-medium hover:underline"
            >
              {tAuth("signIn")}
            </LocalizedLink>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;
