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
        <div className="rounded-lg border border-slate-200 bg-white shadow-lg shadow-slate-200/30 px-6 md:px-8 pt-6 md:pt-8 pb-6 md:pb-8">
          {/* Header */}
          <div className="mb-6 md:mb-8 text-center">
            <h1 className="text-xl md:text-2xl font-semibold text-slate-900">Forgot Password</h1>
            <p className="text-sm text-slate-600 mt-2 font-medium">
              Enter your email address and we'll create a password reset request for you
            </p>
          </div>

          {/* Success Alert */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
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
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-md flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-sm text-destructive font-medium">{error}</p>
            </div>
          )}

          {/* Form */}
          {!success && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Email Field */}
              <div>
                <label 
                  htmlFor="email" 
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2"
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
                      w-full pl-11 pr-4 py-3 rounded-md border bg-white text-slate-900 text-sm font-medium
                      min-h-[44px]
                      ${errors.email ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' : 'border-slate-300 focus:border-app-accent focus:ring-2 focus:ring-app-accent/20'}
                      focus:outline-none transition-all duration-200
                      placeholder:text-slate-400
                      disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                    placeholder="you@supplier.com"
                    disabled={isSubmitting}
                    autoComplete="email"
                  />
                </div>
                {errors.email && (
                  <p id="email-error" className="mt-1.5 text-xs font-medium text-red-600" role="alert">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Submit Button */}
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
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white mr-2.5" aria-hidden="true" />
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
              className="text-sm text-app-accent hover:text-app-accent/80 transition-colors font-semibold focus:outline-none focus:ring-2 focus:ring-app-accent focus:ring-offset-2 rounded"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

