"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { updateSupplierProfile } from "@/lib/api/suppliers";
import { updateUser, changePassword } from "@/lib/api/auth";
import { showSuccess, showError } from "@/lib/utils/toast";
import { Save, Lock } from "lucide-react";

export default function SettingsPage() {
  const { user, refreshProfile } = useAuth();
  const supplierProfile = user?.supplier || user?.supplierProfile;
  const supplierId = user?.supplierId || user?.supplier?.id || user?.supplier?._id;

  // Account Information Form State
  const [accountForm, setAccountForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || supplierProfile?.phone || "",
    phoneAreaCode: user?.phoneAreaCode || supplierProfile?.phoneAreaCode || "",
  });

  // Business Information Form State
  const [businessForm, setBusinessForm] = useState({
    company: supplierProfile?.company || supplierProfile?.name || "",
  });

  // Password Change Form State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [isSavingAccount, setIsSavingAccount] = useState(false);
  const [isSavingBusiness, setIsSavingBusiness] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Update form state when user data changes
  useEffect(() => {
    if (user) {
      setAccountForm({
        name: user?.name || "",
        email: user?.email || "",
        phone: user?.phone || supplierProfile?.phone || "",
        phoneAreaCode: user?.phoneAreaCode || supplierProfile?.phoneAreaCode || "",
      });
    }
  }, [user, supplierProfile]);

  useEffect(() => {
    if (supplierProfile) {
      setBusinessForm({
        company: supplierProfile?.company || supplierProfile?.name || "",
      });
    }
  }, [supplierProfile]);

  const handleAccountChange = (field, value) => {
    setAccountForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleBusinessChange = (field, value) => {
    setBusinessForm((prev) => ({ ...prev, [field]: value }));
  };

  const handlePasswordChange = (field, value) => {
    setPasswordForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveAccount = async () => {
    try {
      setIsSavingAccount(true);
      
      // Update user account
      if (user?._id || user?.id) {
        await updateUser(user._id || user.id, {
          name: accountForm.name,
          email: accountForm.email,
          phone: accountForm.phone,
          phoneAreaCode: accountForm.phoneAreaCode,
        });
      }

      // Update supplier profile phone if supplier exists
      if (supplierId) {
        await updateSupplierProfile(supplierId, {
          phone: accountForm.phone,
          phoneAreaCode: accountForm.phoneAreaCode,
        });
      }

      await refreshProfile();
      showSuccess("Account information updated successfully");
    } catch (error) {
      showError(error.message || "Failed to update account information");
    } finally {
      setIsSavingAccount(false);
    }
  };

  const handleSaveBusiness = async () => {
    try {
      setIsSavingBusiness(true);
      
      if (supplierId) {
        await updateSupplierProfile(supplierId, {
          company: businessForm.company,
          name: businessForm.company,
        });
      }

      await refreshProfile();
      showSuccess("Business information updated successfully");
    } catch (error) {
      showError(error.message || "Failed to update business information");
    } finally {
      setIsSavingBusiness(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showError("New passwords do not match");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      showError("Password must be at least 6 characters long");
      return;
    }

    try {
      setIsChangingPassword(true);
      await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      showSuccess("Password changed successfully");
    } catch (error) {
      showError(error.message || "Failed to change password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Settings & Profile</h1>
        <p className="mt-2 text-slate-500">
          Manage your account preferences and business identification.
        </p>
      </div>

      <div className="space-y-6 max-w-4xl">
          <Card className="border-none shadow-md shadow-slate-200/50 overflow-hidden">
            <CardHeader className="p-8 border-b border-slate-50">
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Update your personal login details and contact info.</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Account Name</label>
                  <input
                    type="text"
                    value={accountForm.name}
                    onChange={(e) => handleAccountChange("name", e.target.value)}
                    className="w-full px-4 py-3 text-sm font-bold text-slate-900 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-app-accent focus:border-transparent"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Email Address</label>
                  <input
                    type="email"
                    value={accountForm.email}
                    onChange={(e) => handleAccountChange("email", e.target.value)}
                    className="w-full px-4 py-3 text-sm font-bold text-slate-900 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-app-accent focus:border-transparent"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Primary Phone</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Area Code"
                      value={accountForm.phoneAreaCode}
                      onChange={(e) => handleAccountChange("phoneAreaCode", e.target.value)}
                      className="w-24 px-4 py-3 text-sm font-bold text-slate-900 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-app-accent focus:border-transparent"
                    />
                    <input
                      type="tel"
                      placeholder="Phone Number"
                      value={accountForm.phone}
                      onChange={(e) => handleAccountChange("phone", e.target.value)}
                      className="flex-1 px-4 py-3 text-sm font-bold text-slate-900 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-app-accent focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <Button
                  onClick={handleSaveAccount}
                  disabled={isSavingAccount}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  {isSavingAccount ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md shadow-slate-200/50 overflow-hidden">
            <CardHeader className="p-8 border-b border-slate-50">
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your account password for better security.</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Current Password</label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => handlePasswordChange("currentPassword", e.target.value)}
                    className="w-full px-4 py-3 text-sm font-bold text-slate-900 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-app-accent focus:border-transparent"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400">New Password</label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => handlePasswordChange("newPassword", e.target.value)}
                    className="w-full px-4 py-3 text-sm font-bold text-slate-900 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-app-accent focus:border-transparent"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => handlePasswordChange("confirmPassword", e.target.value)}
                    className="w-full px-4 py-3 text-sm font-bold text-slate-900 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-app-accent focus:border-transparent"
                  />
                </div>
              </div>
              <div className="mt-6">
                <Button
                  onClick={handleChangePassword}
                  disabled={isChangingPassword}
                  className="gap-2"
                >
                  <Lock className="h-4 w-4" />
                  {isChangingPassword ? "Changing..." : "Change Password"}
                </Button>
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
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Legal Company Name</label>
                    <input
                      type="text"
                      value={businessForm.company}
                      onChange={(e) => handleBusinessChange("company", e.target.value)}
                      className="w-full px-4 py-3 text-sm font-bold text-slate-900 bg-white border border-indigo-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-app-accent focus:border-transparent"
                    />
                  </div>
                  {supplierProfile.address && (
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Registered Office Address</label>
                      <p className="text-sm font-bold text-slate-900 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                        {supplierProfile.address}
                      </p>
                    </div>
                  )}
                </div>
                <div className="mt-6">
                  <Button
                    onClick={handleSaveBusiness}
                    disabled={isSavingBusiness}
                    className="gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {isSavingBusiness ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
      </div>
    </div>
  );
}
