// kl-supplier-portal/app/(auth)/register/page.jsx
"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Mail, MapPin, Phone, User, Eye, EyeOff, AlertCircle } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Registration schema with new fields
const registerSchema = z.object({
  name: z.string()
    .min(1, "Name is required")
    .min(2, "Name must be at least 2 characters"),
  company: z.string().min(1, "Company name is required"),
  phone: z.string()
    .min(1, "Phone number is required")
    .min(6, "Phone number must be at least 6 characters"),
  phoneAreaCode: z.string().min(1, "Area code is required").max(5),
  additionalPhone: z.string()
    .min(1, "Additional phone is required")
    .min(6, "Additional phone must be at least 6 characters"),
  email: z.string()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
  companyAddress: z.string().min(1, "Company address is required"),
  password: z.string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string()
    .min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const inputClasses = "flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

const labelClasses = "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70";

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerAccount, refreshProfile } = useAuth();
  const [serverError, setServerError] = useState("");
  const phoneInputRef = useRef(null);
  const additionalPhoneInputRef = useRef(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
    watch,
    setFocus,
  } = useForm({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      company: "",
      phone: "",
      phoneAreaCode: "",
      additionalPhone: "",
      additionalPhoneAreaCode: "",
      email: "",
      companyAddress: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Watch form values for debugging
  const formValues = watch();


  const onSubmit = async (values) => {
    setServerError("");

    try {
      // Clean the values before sending
      const cleanValues = {
        name: values.name?.trim() || "",
        company: values.company?.trim() || "",
        phone: values.phone?.trim() || "",
        phoneAreaCode: values.phoneAreaCode?.trim() || "",
        additionalPhone: values.additionalPhone?.trim() || "",
        additionalPhoneAreaCode: values.additionalPhoneAreaCode?.trim() || "",
        email: values.email?.trim() || "",
        country: values.country?.trim() || "",
        password: values.password || "",
      };

      // Build supplier profile
      const supplierProfile = {
        name: cleanValues.company || cleanValues.name, // Use company name or fallback to user name
        company: cleanValues.company || undefined,
        email: cleanValues.email,
        phone: cleanValues.phone,
        phoneAreaCode: cleanValues.phoneAreaCode || undefined,
        address: cleanValues.companyAddress
          ? {
              fullAddress: cleanValues.companyAddress,
            }
          : undefined,
        paymentTerms: "net30",
        notes: "Self-registered via supplier portal",
      };

      // Add alternate phone if provided (backend may accept it even if not in validation schema)
      if (cleanValues.additionalPhone) {
        supplierProfile.alternatePhone = cleanValues.additionalPhone;
        supplierProfile.alternatePhoneAreaCode = cleanValues.additionalPhoneAreaCode || undefined;
      }

      await registerAccount({
        name: cleanValues.name,
        email: cleanValues.email,
        password: cleanValues.password,
        phone: cleanValues.phone,
        supplierProfile,
      });

      await refreshProfile();
      router.replace("/dashboard");
    } catch (error) {
      setServerError(error.message || "Unable to create account right now.");
    }
  };

  const onError = (errors) => {
    // Silent fail for form errors as they are shown in UI
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4 py-12 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-1 bg-app-accent"></div>
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-app-accent/5 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl"></div>

      <div className="w-full max-w-2xl z-10">
        <div className="text-center mb-10">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-app-accent shadow-xl shadow-app-accent/20 mb-6">
            <span className="text-2xl font-black text-white">KL</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Partner with KL Fashion</h1>
          <p className="text-slate-800 mt-3 font-semibold">Create your supplier account to start your journey with us</p>
        </div>

        <Card className="rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-200/50 overflow-hidden">
          <CardHeader className="p-8 border-b border-slate-200">
            <CardTitle>Supplier Onboarding</CardTitle>
            <CardDescription className="font-semibold mt-1 text-slate-700">We'll use these details to create your secure login and business profile.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 md:p-10">
            <form className="space-y-8" onSubmit={handleSubmit(onSubmit, onError)}>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-xs font-bold uppercase tracking-widest text-slate-900 ml-1">
                    Your Full Name *
                  </label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                      {...register("name")}
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      className={`
                        w-full px-4 py-3.5 rounded-2xl border bg-white text-slate-900 pl-11
                        ${errors.name ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-300 focus:border-app-accent focus:ring-app-accent/10'}
                        focus:ring-4 focus:outline-none transition-all duration-200 text-sm font-semibold
                        placeholder:text-slate-500
                      `}
                      autoComplete="name"
                    />
                  </div>
                  {errors.name && (
                    <p className="mt-1.5 text-xs font-bold text-red-500 ml-1">{errors.name.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="company" className="text-xs font-bold uppercase tracking-widest text-slate-900 ml-1">
                    Company Name *
                  </label>
                  <div className="relative">
                    <Building2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                      {...register("company")}
                      id="company"
                      type="text"
                      placeholder="Acme Textiles Ltd."
                      className={`
                        w-full px-4 py-3.5 rounded-2xl border bg-white text-slate-900 pl-11
                        ${errors.company ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-300 focus:border-app-accent focus:ring-app-accent/10'}
                        focus:ring-4 focus:outline-none transition-all duration-200 text-sm font-semibold
                        placeholder:text-slate-500
                      `}
                      autoComplete="organization"
                    />
                  </div>
                  {errors.company && (
                    <p className="mt-1.5 text-xs font-bold text-red-500 ml-1">{errors.company.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="phone" className="text-xs font-bold uppercase tracking-widest text-slate-900 ml-1">
                    Primary Phone *
                  </label>
                  <div className="flex gap-3">
                    <div className="relative w-28 flex-shrink-0">
                      <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                      <input
                        {...register("phoneAreaCode")}
                        id="phoneAreaCode"
                        type="tel"
                        placeholder="+88"
                        className={`
                          w-full px-4 py-3.5 rounded-2xl border bg-white text-slate-900 pl-11
                          ${errors.phoneAreaCode ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-300 focus:border-app-accent focus:ring-app-accent/10'}
                          focus:ring-4 focus:outline-none transition-all duration-200 text-sm font-semibold
                          placeholder:text-slate-500
                        `}
                        maxLength={5}
                        onChange={(e) => {
                          register("phoneAreaCode").onChange(e);
                          if (e.target.value.length >= 5) {
                            setFocus("phone");
                          }
                        }}
                      />
                    </div>
                    <div className="relative flex-1">
                      <input
                        {...register("phone")}
                        id="phone"
                        type="tel"
                        placeholder="01712345678"
                        className={`
                          w-full px-4 py-3.5 rounded-2xl border bg-white text-slate-900
                          ${errors.phone ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-300 focus:border-app-accent focus:ring-app-accent/10'}
                          focus:ring-4 focus:outline-none transition-all duration-200 text-sm font-semibold
                          placeholder:text-slate-500
                        `}
                        autoComplete="tel"
                      />
                    </div>
                  </div>
                  {errors.phone && (
                    <p className="mt-1.5 text-xs font-bold text-red-500 ml-1">{errors.phone.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="additionalPhone" className="text-xs font-bold uppercase tracking-widest text-slate-900 ml-1">
                    Secondary Phone
                  </label>
                  <div className="flex gap-3">
                    <div className="relative w-28 flex-shrink-0">
                      <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                      <input
                        {...register("additionalPhoneAreaCode")}
                        id="additionalPhoneAreaCode"
                        type="tel"
                        placeholder="+88"
                        className={`
                          w-full px-4 py-3.5 rounded-2xl border bg-white text-slate-900 pl-11
                          ${errors.additionalPhoneAreaCode ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-300 focus:border-app-accent focus:ring-app-accent/10'}
                          focus:ring-4 focus:outline-none transition-all duration-200 text-sm font-semibold
                          placeholder:text-slate-500
                        `}
                        maxLength={5}
                        onChange={(e) => {
                          register("additionalPhoneAreaCode").onChange(e);
                          if (e.target.value.length >= 5) {
                            setFocus("additionalPhone");
                          }
                        }}
                      />
                    </div>
                    <div className="relative flex-1">
                      <input
                        {...register("additionalPhone")}
                        id="additionalPhone"
                        type="tel"
                        placeholder="01812345678"
                        className={`
                          w-full px-4 py-3.5 rounded-2xl border bg-white text-slate-900
                          ${errors.additionalPhone ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-300 focus:border-app-accent focus:ring-app-accent/10'}
                          focus:ring-4 focus:outline-none transition-all duration-200 text-sm font-semibold
                          placeholder:text-slate-500
                        `}
                        autoComplete="tel"
                      />
                    </div>
                  </div>
                  {errors.additionalPhone && (
                    <p className="mt-1.5 text-xs font-bold text-red-500 ml-1">{errors.additionalPhone.message}</p>
                  )}
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-slate-900 ml-1">
                    Business Email *
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                      {...register("email")}
                      id="email"
                      type="email"
                      placeholder="supplier@company.com"
                      className={`
                        w-full px-4 py-3.5 rounded-2xl border bg-white text-slate-900 pl-11
                        ${errors.email ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-300 focus:border-app-accent focus:ring-app-accent/10'}
                        focus:ring-4 focus:outline-none transition-all duration-200 text-sm font-semibold
                        placeholder:text-slate-500
                      `}
                      autoComplete="email"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1.5 text-xs font-bold text-red-500 ml-1">{errors.email.message}</p>
                  )}
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <label htmlFor="companyAddress" className="text-xs font-bold uppercase tracking-widest text-slate-900 ml-1">
                    Company Registered Address *
                  </label>
                  <div className="relative">
                    <MapPin className="pointer-events-none absolute left-4 top-4 h-4 w-4 text-slate-500" />
                    <textarea
                      {...register("companyAddress")}
                      id="companyAddress"
                      rows={3}
                      placeholder="123 Textile Ave, Dhaka, Bangladesh"
                      className={`
                        w-full px-4 py-3.5 rounded-2xl border bg-white text-slate-900 pl-11
                        ${errors.companyAddress ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-300 focus:border-app-accent focus:ring-app-accent/10'}
                        focus:ring-4 focus:outline-none transition-all duration-200 text-sm font-semibold resize-none
                        placeholder:text-slate-500
                      `}
                    />
                  </div>
                  {errors.companyAddress && (
                    <p className="mt-1.5 text-xs font-bold text-red-500 ml-1">{errors.companyAddress.message}</p>
                  )}
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-slate-900 ml-1">
                    Create Password *
                  </label>
                  <div className="relative">
                    <input
                      {...register("password")}
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className={`
                        w-full px-4 py-3.5 rounded-2xl border pr-12 bg-white text-slate-900
                        ${errors.password ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-300 focus:border-app-accent focus:ring-app-accent/10'}
                        focus:ring-4 focus:outline-none transition-all duration-200 text-sm font-semibold
                        placeholder:text-slate-500
                      `}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 focus:outline-none"
                      tabIndex={-1}
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

                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="text-xs font-bold uppercase tracking-widest text-slate-900 ml-1">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <input
                      {...register("confirmPassword")}
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className={`
                        w-full px-4 py-3.5 rounded-2xl border pr-12 bg-white text-slate-900
                        ${errors.confirmPassword ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-300 focus:border-app-accent focus:ring-app-accent/10'}
                        focus:ring-4 focus:outline-none transition-all duration-200 text-sm font-semibold
                        placeholder:text-slate-500
                      `}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 focus:outline-none"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1.5 text-xs font-bold text-red-500 ml-1">{errors.confirmPassword.message}</p>
                  )}
                </div>
              </div>

              {serverError && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start animate-in shake duration-300">
                  <AlertCircle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-semibold text-red-600">{serverError}</p>
                </div>
              )}

              <button 
                type="submit" 
                className="
                  w-full bg-app-accent hover:bg-app-accent/90 text-white font-bold 
                  py-4 px-6 rounded-2xl transition-all duration-200 text-sm
                  disabled:opacity-50 disabled:cursor-not-allowed
                  flex items-center justify-center shadow-lg shadow-app-accent/25
                  hover:shadow-app-accent/40 active:scale-[0.98]
                "
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white mr-3" />
                    Processing Registration...
                  </>
                ) : (
                  "Complete Business Registration"
                )}
              </button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-10 pt-8 text-center border-t border-slate-200">
          <p className="text-sm font-semibold text-slate-900">
            Already have a partner account?{" "}
            <Link className="text-app-accent hover:text-indigo-700 transition-colors font-bold" href="/login">
              Sign in here
            </Link>
          </p>
        </div>

        <p className="mt-10 text-center text-xs font-bold text-slate-800 uppercase tracking-widest pb-10">
          © 2025 KL Fashion CRM • Partner Network
        </p>
      </div>
    </div>
  );
}