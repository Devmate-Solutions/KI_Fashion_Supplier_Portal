'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { resetPassword } from '@/lib/api/auth';
import { AlertCircle, CheckCircle, Eye, EyeOff, Lock, Check } from 'lucide-react';

const resetPasswordSchema = z.object({
  password: z.string()
    .min(6, 'Password must be at least 6 characters long'),
  confirmPassword: z.string()
    .min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function ResetPasswordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  
  const router = useRouter();
  const params = useParams();
  const token = params.token;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onChange",
  });

  const onSubmit = async (values) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      await resetPassword(token, values.password);
      
      setSuccess(true);
      // Wait a few seconds then redirect to login
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err) {
      console.error("Reset password error:", err);
      setError(err.message || "Invalid or expired reset link. Please request a new one.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-lg border border-slate-200 bg-white shadow-lg shadow-slate-200/30 px-6 md:px-8 pt-6 md:pt-8 pb-6 md:pb-8">
          {/* Header */}
          <div className="mb-6 md:mb-8 text-center">
            <h1 className="text-xl md:text-2xl font-semibold text-slate-900">Reset Password</h1>
            <p className="text-sm text-slate-600 mt-2 font-medium">
              Please enter your new password below.
            </p>
          </div>

          {/* Success Alert */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div className="flex-1">
                <p className="text-sm text-green-800 font-medium">Password Reset Successfully</p>
                <p className="text-sm text-green-700 mt-1">
                  Your password has been updated. Redirecting you to the sign-in page...
                </p>
              </div>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-md flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-sm text-destructive font-medium">{error}</p>
            </div>
          )}

          {/* Form */}
          {!success && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* New Password */}
              <div>
                <label 
                  htmlFor="password" 
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2"
                >
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    className={`
                      w-full pl-11 pr-11 py-3 rounded-md border bg-white text-slate-900 text-sm font-medium
                      min-h-[44px]
                      ${errors.password ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' : 'border-slate-300 focus:border-app-accent focus:ring-2 focus:ring-app-accent/20'}
                      focus:outline-none transition-all duration-200
                      placeholder:text-slate-400
                      disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                    placeholder="••••••••"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1.5 text-xs font-medium text-red-600">{errors.password.message}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label 
                  htmlFor="confirmPassword" 
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2"
                >
                  Confirm New Password
                </label>
                <div className="relative">
                  <Check className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    {...register('confirmPassword')}
                    type={showPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    className={`
                      w-full pl-11 pr-4 py-3 rounded-md border bg-white text-slate-900 text-sm font-medium
                      min-h-[44px]
                      ${errors.confirmPassword ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' : 'border-slate-300 focus:border-app-accent focus:ring-2 focus:ring-app-accent/20'}
                      focus:outline-none transition-all duration-200
                      placeholder:text-slate-400
                      disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                    placeholder="••••••••"
                    disabled={isSubmitting}
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1.5 text-xs font-medium text-red-600">{errors.confirmPassword.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
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
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white mr-2.5" />
                    Resetting...
                  </>
                ) : (
                  "Reset Password"
                )}
              </button>
            </form>
          )}

          {/* Back to Login Link */}
          <div className="mt-6 text-center">
            <Link 
              href="/login" 
              className="text-sm text-slate-600 hover:text-app-accent transition-colors font-medium"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
