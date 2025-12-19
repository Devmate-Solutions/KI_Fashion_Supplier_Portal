"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  const { user } = useAuth();
  const supplierProfile = user?.supplier || user?.supplierProfile;

  return (
    <div className="mx-auto max-w-7xl space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Settings & Profile</h1>
        <p className="mt-2 text-slate-500">
          Manage your account preferences and business identification.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-md shadow-slate-200/50 overflow-hidden">
            <CardHeader className="p-8 border-b border-slate-50">
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Update your personal login details and contact info.</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Account Name</span>
                  <p className="text-sm font-bold text-slate-900 bg-slate-50 p-3 rounded-xl border border-slate-100">{user?.name || "—"}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Email Address</span>
                  <p className="text-sm font-bold text-slate-900 bg-slate-50 p-3 rounded-xl border border-slate-100">{user?.email || "—"}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Primary Phone</span>
                  <p className="text-sm font-bold text-slate-900 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {supplierProfile?.phoneAreaCode || user?.phoneAreaCode ? `${supplierProfile?.phoneAreaCode || user?.phoneAreaCode}-` : ''}{user?.phone || supplierProfile?.phone || "—"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {supplierProfile && (
            <Card className="border-none shadow-md shadow-slate-200/50 overflow-hidden">
              <CardHeader className="p-8 border-b border-slate-50">
                <CardTitle>Business Identification</CardTitle>
                <CardDescription>Verified supplier details linked to KL Fashion CRM.</CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-1">
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Legal Company Name</span>
                    <p className="text-sm font-bold text-slate-900 bg-indigo-50/30 p-3 rounded-xl border border-indigo-100/50">
                      {supplierProfile.company || supplierProfile.name || "—"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Contractual Payment Terms</span>
                    <p className="text-sm font-bold text-slate-900 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      {supplierProfile.paymentTerms || "Standard Net 30"}
                    </p>
                  </div>
                  {supplierProfile.address && (
                    <div className="md:col-span-2 space-y-1">
                      <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Registered Office Address</span>
                      <p className="text-sm font-bold text-slate-900 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                        {supplierProfile.address}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-md shadow-slate-200/50 overflow-hidden bg-slate-900 text-white">
            <CardContent className="p-8">
              <h3 className="text-lg font-bold mb-2">Need help?</h3>
              <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                If you need to update your business name, address, or bank details, please contact our procurement team directly.
              </p>
              <a 
                href="mailto:procurement@klfashion.com" 
                className="inline-flex items-center justify-center w-full bg-white text-slate-900 font-bold py-3 px-4 rounded-xl hover:bg-slate-100 transition-colors"
              >
                Contact Procurement
              </a>
            </CardContent>
          </Card>
          
          <div className="rounded-3xl border border-dashed border-slate-200 p-8 text-center">
            <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-400">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h4 className="text-sm font-bold text-slate-900 mb-1">Secure Account</h4>
            <p className="text-xs text-slate-500">Your profile is protected with enterprise-grade encryption.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
