"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CheckCircle, Mail } from "lucide-react";
import { forgotPassword } from "@/lib/api/auth";

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address"),
});

export default function ForgotPasswordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (values) => {
    try {
      setIsSubmitting(true);
      setError("");
      setSuccess(false);
      
      await forgotPassword(values.email, "supplier-portal");
      
      setSuccess(true);
    } catch (err) {
      setError(err.message || "Unable to submit password reset request. Try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-200/50 px-8 pt-8 pb-8">
          {/* Header */}
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-slate-900">Forgot Password</h2>
            <p className="text-sm text-slate-800 mt-2 font-semibold">
              Enter your email address and we'll create a password reset request for you
            </p>
          </div>

          {/* Success Alert */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-[4px] flex items-start">
              <CheckCircle className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-green-800 font-medium">Request Submitted</p>
                <p className="text-sm text-green-700 mt-1">
                  If an account with that email exists, a password reset request has been created. 
                  An administrator will process your request shortly.
                </p>
              </div>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-[4px] flex items-start">
              <AlertCircle className="w-5 h-5 text-destructive mr-3 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Form */}
          {!success && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Email Field */}
              <div>
                <label 
                  htmlFor="email" 
                  className="block text-xs font-bold uppercase tracking-widest text-slate-900 mb-2 ml-1"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    {...register('email')}
                    type="email"
                    id="email"
                    className={`
                      w-full pl-11 pr-4 py-3.5 rounded-2xl border bg-white text-slate-900
                      ${errors.email ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-300 focus:border-app-accent focus:ring-app-accent/10'}
                      focus:ring-4 focus:outline-none transition-all duration-200 text-sm font-semibold
                      placeholder:text-slate-500
                      disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                    placeholder="you@supplier.com"
                    disabled={isSubmitting}
                    autoComplete="email"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1.5 text-xs font-bold text-red-500 ml-1">{errors.email.message}</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="
                  w-full bg-app-accent hover:bg-app-accent/90 text-white font-bold 
                  py-4 px-6 rounded-2xl transition-all duration-200 text-sm
                  disabled:opacity-50 disabled:cursor-not-allowed
                  flex items-center justify-center shadow-lg shadow-app-accent/25
                  hover:shadow-app-accent/40 active:scale-[0.98]
                "
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white mr-3" />
                    Submitting...
                  </>
                ) : (
                  "Submit Request"
                )}
              </button>
            </form>
          )}

          {/* Back to Login Link */}
          <div className="mt-6 text-center">
            <Link 
              href="/login" 
              className="text-sm text-app-accent hover:text-indigo-700 transition-colors font-bold"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

