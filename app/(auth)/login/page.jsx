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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-1 bg-app-accent"></div>
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-app-accent/5 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl"></div>

      <div className="w-full max-w-[440px] z-10">
        <div className="text-center mb-10">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-app-accent shadow-xl shadow-app-accent/20 mb-6">
            <span className="text-2xl font-black text-white">KL</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Supplier Portal</h2>
          <p className="text-slate-800 mt-3 font-semibold">Manage your KL Fashion inventory and settlements</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-200/50 p-8 md:p-10">
          <div className="mb-8">
            <h3 className="text-xl font-bold text-slate-900">Welcome back</h3>
            <p className="text-sm text-slate-800 mt-1 font-semibold">Please enter your credentials to continue</p>
          </div>

          {/* Error Alert */}
          {authError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start animate-in shake duration-300">
              <AlertCircle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
              <p className="text-sm font-semibold text-red-600">{authError}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <label 
                htmlFor="email" 
                className="text-xs font-bold uppercase tracking-widest text-slate-900 ml-1"
              >
                Email Address
              </label>
              <div className="relative">
                <input
                  {...register('email')}
                  type="email"
                  id="email"
                  placeholder="name@company.com"
                  className={`
                    w-full px-4 py-3.5 rounded-2xl border bg-white text-slate-900
                    ${errors.email ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-300 focus:border-app-accent focus:ring-app-accent/10'}
                    focus:ring-4 focus:outline-none transition-all duration-200 text-sm font-semibold
                    placeholder:text-slate-500
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                  disabled={isSubmitting || isLoading}
                  autoComplete="email"
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-xs font-bold text-red-500 ml-1">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <label 
                  htmlFor="password" 
                  className="text-xs font-bold uppercase tracking-widest text-slate-900"
                >
                  Password
                </label>
                <Link href="/forgot-password" hidden className="text-xs font-bold text-app-accent hover:text-indigo-700 transition-colors">
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  placeholder="••••••••"
                  className={`
                    w-full px-4 py-3.5 rounded-2xl border pr-12 bg-white text-slate-900
                    ${errors.password ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-300 focus:border-app-accent focus:ring-app-accent/10'}
                    focus:ring-4 focus:outline-none transition-all duration-200 text-sm font-semibold
                    placeholder:text-slate-500
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                  disabled={isSubmitting || isLoading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  disabled={isSubmitting || isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs font-bold text-red-500 ml-1">{errors.password.message}</p>
              )}
            </div>

            {/* Remember Me */}
            <div className="flex items-center ml-1">
              <label className="flex items-center cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                  />
                  <div className="h-5 w-5 rounded-md border-2 border-slate-300 peer-checked:bg-app-accent peer-checked:border-app-accent transition-all duration-200 bg-white"></div>
                  <svg className="absolute top-1 left-1 h-3 w-3 text-white scale-0 peer-checked:scale-100 transition-transform duration-200 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="ml-3 text-sm font-semibold text-slate-900 group-hover:text-slate-950 transition-colors">Keep me signed in</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="
                w-full bg-app-accent hover:bg-app-accent/90 text-white font-bold 
                py-4 px-6 rounded-2xl transition-all duration-200 text-sm
                disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center justify-center shadow-lg shadow-app-accent/25
                hover:shadow-app-accent/40 active:scale-[0.98]
              "
            >
              {isSubmitting || isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white mr-3" />
                  Authenticating...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5 mr-3" />
                  Sign into Portal
                </>
              )}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-10 pt-8 border-t border-slate-200 text-center">
            <p className="text-sm font-semibold text-slate-900">
              New to KL Fashion?{" "}
              <Link href="/register" className="text-app-accent hover:text-indigo-700 transition-colors font-bold">
                Create an account
              </Link>
            </p>
          </div>
        </div>

        <p className="mt-10 text-center text-xs font-bold text-slate-800 uppercase tracking-widest">
          © 2025 KL Fashion CRM • Secure Access
        </p>
      </div>
    </div>
  );
}
