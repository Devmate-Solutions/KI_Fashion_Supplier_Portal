"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Eye, EyeOff, LogIn } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuth();
  const [authError, setAuthError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values) => {
    try {
      setAuthError("");
      await login(values);
      router.push("/dashboard");
    } catch (error) {
      setAuthError(error.message || "Unable to sign in. Try again later.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50 px-4 py-8 md:py-12 relative overflow-hidden">
      {/* Subtle Background Decor */}
      <div className="absolute top-0 left-0 w-full h-1 bg-app-accent"></div>
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-app-accent/3 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-app-accent/3 rounded-full blur-3xl"></div>

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-8 md:mb-10">
          <div className="inline-flex h-14 w-14 md:h-16 md:w-16 items-center justify-center rounded-lg bg-app-accent shadow-sm shadow-app-accent/20 mb-5">
            <span className="text-xl md:text-2xl font-semibold text-white">KL</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900">Supplier Portal</h1>
          <p className="text-sm md:text-base text-slate-600 mt-2 font-medium">Manage your KI Fashion inventory and settlements</p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white shadow-lg shadow-slate-200/30 p-6 md:p-8">
          <div className="mb-6 md:mb-8">
            <h2 className="text-lg md:text-xl font-semibold text-slate-900">Welcome back</h2>
            <p className="text-sm text-slate-600 mt-1.5 font-medium">Please enter your credentials to continue</p>
          </div>

          {/* Error Alert */}
          {authError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 animate-in fade-in duration-200" role="alert">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-sm font-medium text-red-700">{authError}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            {/* Email Field */}
            <div className="space-y-2">
              <label 
                htmlFor="email" 
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
              >
                Email Address
              </label>
              <div className="relative">
                <input
                  {...register('email')}
                  type="email"
                  id="email"
                  placeholder="name@company.com"
                  autoComplete="email"
                  aria-invalid={errors.email ? "true" : "false"}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  className={`
                    w-full px-4 py-3 rounded-md border bg-white text-slate-900 text-sm font-medium
                    min-h-[44px]
                    ${errors.email 
                      ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' 
                      : 'border-slate-300 focus:border-app-accent focus:ring-2 focus:ring-app-accent/20'
                    }
                    focus:outline-none transition-all duration-200
                    placeholder:text-slate-400
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                  disabled={isSubmitting || isLoading}
                />
              </div>
              {errors.email && (
                <p id="email-error" className="text-xs font-medium text-red-600 mt-1.5" role="alert">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label 
                  htmlFor="password" 
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
                >
                  Password
                </label>
                <Link 
                  href="/forgot-password" 
                  className="text-xs font-medium text-app-accent hover:text-app-accent/80 transition-colors focus:outline-none focus:ring-2 focus:ring-app-accent focus:ring-offset-2 rounded"
                >
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  aria-invalid={errors.password ? "true" : "false"}
                  aria-describedby={errors.password ? "password-error" : undefined}
                  className={`
                    w-full px-4 py-3 rounded-lg border pr-12 bg-white text-slate-900 text-sm font-medium
                    min-h-[44px]
                    ${errors.password 
                      ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' 
                      : 'border-slate-300 focus:border-app-accent focus:ring-2 focus:ring-app-accent/20'
                    }
                    focus:outline-none transition-all duration-200
                    placeholder:text-slate-400
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                  disabled={isSubmitting || isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded focus:outline-none focus:ring-2 focus:ring-app-accent focus:ring-offset-2"
                  disabled={isSubmitting || isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" aria-hidden="true" />
                  ) : (
                    <Eye className="w-5 h-5" aria-hidden="true" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p id="password-error" className="text-xs font-medium text-red-600 mt-1.5" role="alert">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Remember Me */}
            <div className="flex items-center">
              <label className="flex items-center cursor-pointer group min-h-[44px]">
                <div className="relative">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    aria-label="Keep me signed in"
                  />
                  <div className="h-5 w-5 rounded border-2 border-slate-300 peer-checked:bg-app-accent peer-checked:border-app-accent transition-all duration-200 bg-white peer-focus:ring-2 peer-focus:ring-app-accent peer-focus:ring-offset-2"></div>
                  <svg className="absolute top-0.5 left-0.5 h-3.5 w-3.5 text-white scale-0 peer-checked:scale-100 transition-transform duration-200 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="ml-3 text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors">Keep me signed in</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="
                w-full bg-app-accent hover:bg-app-accent/90 text-white font-semibold 
                py-3.5 px-6 rounded-md transition-all duration-200 text-sm
                disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center justify-center shadow-sm shadow-app-accent/20
                hover:shadow-md hover:shadow-app-accent/30 active:scale-[0.98]
                focus:outline-none focus:ring-2 focus:ring-app-accent focus:ring-offset-2
                min-h-[44px]
              "
            >
              {isSubmitting || isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white mr-2.5" aria-hidden="true" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5 mr-2" aria-hidden="true" />
                  <span>Sign in</span>
                </>
              )}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-8 pt-6 border-t border-slate-200 text-center">
            <p className="text-sm font-medium text-slate-600">
              New to KI Fashion?{" "}
              <Link 
                href="/register" 
                className="text-app-accent hover:text-app-accent/80 transition-colors font-semibold focus:outline-none focus:ring-2 focus:ring-app-accent focus:ring-offset-2 rounded"
              >
                Create an account
              </Link>
            </p>
          </div>
        </div>

        <p className="mt-8 text-center text-xs font-medium text-slate-500">
          © 2025 KI Fashion CRM • Secure Access
        </p>
      </div>
    </div>
  );
}
