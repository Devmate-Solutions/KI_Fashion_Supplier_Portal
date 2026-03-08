"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { updateSupplierProfile } from "@/lib/api/suppliers";
import { updateUser, changePassword } from "@/lib/api/auth";
import { showSuccess, showError } from "@/lib/utils/toast";
import { Save, Lock, User, Mail, Phone, Building2, MapPin, Shield } from "lucide-react";

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
    if (field === 'phoneAreaCode') {
      value = value.replace(/[^\d+]/g, '');
    } else if (field === 'phone') {
      value = value.replace(/\D/g, '');
    }
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
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900">Settings & Profile</h1>
        <p className="mt-2 text-sm text-slate-600">
          Manage your account preferences and business identification.
        </p>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3 max-w-7xl">
          <Card className="border border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="p-6 border-b border-slate-100 bg-slate-50/30">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-app-accent/10 border border-app-accent/20 flex items-center justify-center">
                  <User className="h-5 w-5 text-app-accent" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-slate-900">Account Information</CardTitle>
                  <CardDescription className="text-sm text-slate-600 mt-1">Update your personal login details and contact info</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="account-name" className="text-xs font-semibold uppercase tracking-wider text-slate-700 block flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-slate-500" />
                    Account Name
                  </label>
                  <input
                    id="account-name"
                    type="text"
                    value={accountForm.name}
                    onChange={(e) => handleAccountChange("name", e.target.value)}
                    className="w-full px-4 py-3 text-sm font-medium text-slate-900 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-app-accent focus:border-app-accent transition-colors min-h-[44px]"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="account-email" className="text-xs font-semibold uppercase tracking-wider text-slate-700 block flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-slate-500" />
                    Email Address
                  </label>
                  <input
                    id="account-email"
                    type="email"
                    value={accountForm.email}
                    onChange={(e) => handleAccountChange("email", e.target.value)}
                    className="w-full px-4 py-3 text-sm font-medium text-slate-900 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-app-accent focus:border-app-accent transition-colors min-h-[44px]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 block flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-slate-500" />
                    Primary Phone
                  </label>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Area Code"
                        value={accountForm.phoneAreaCode}
                        onChange={(e) => handleAccountChange("phoneAreaCode", e.target.value)}
                        className="w-full px-4 py-3 text-sm font-medium text-slate-900 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-app-accent focus:border-app-accent transition-colors min-h-[44px]"
                      />
                    </div>
                    <div className="flex-[2]">
                      <input
                        type="tel"
                        placeholder="Phone Number"
                        value={accountForm.phone}
                        onChange={(e) => handleAccountChange("phone", e.target.value)}
                        className="w-full px-4 py-3 text-sm font-medium text-slate-900 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-app-accent focus:border-app-accent transition-colors min-h-[44px]"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-8 pt-6 border-t border-slate-100">
                <Button
                  onClick={handleSaveAccount}
                  disabled={isSavingAccount}
                  className="bg-app-accent hover:bg-app-accent/90 shadow-sm rounded-md gap-2 min-h-[44px] px-6"
                >
                  <Save className="h-4 w-4" />
                  {isSavingAccount ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="p-6 border-b border-slate-100 bg-slate-50/30">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-slate-900">Change Password</CardTitle>
                  <CardDescription className="text-sm text-slate-600 mt-1">Update your account password for better security</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="current-password" className="text-xs font-semibold uppercase tracking-wider text-slate-700 block">
                    Current Password
                  </label>
                  <input
                    id="current-password"
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => handlePasswordChange("currentPassword", e.target.value)}
                    className="w-full px-4 py-3 text-sm font-medium text-slate-900 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-app-accent focus:border-app-accent transition-colors min-h-[44px]"
                    placeholder="Enter current password"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="new-password" className="text-xs font-semibold uppercase tracking-wider text-slate-700 block">
                    New Password
                  </label>
                  <input
                    id="new-password"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => handlePasswordChange("newPassword", e.target.value)}
                    className="w-full px-4 py-3 text-sm font-medium text-slate-900 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-app-accent focus:border-app-accent transition-colors min-h-[44px]"
                    placeholder="Enter new password"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="confirm-password" className="text-xs font-semibold uppercase tracking-wider text-slate-700 block">
                    Confirm New Password
                  </label>
                  <input
                    id="confirm-password"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => handlePasswordChange("confirmPassword", e.target.value)}
                    className="w-full px-4 py-3 text-sm font-medium text-slate-900 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-app-accent focus:border-app-accent transition-colors min-h-[44px]"
                    placeholder="Confirm new password"
                  />
                </div>
              </div>
              <div className="mt-8 pt-6 border-t border-slate-100">
                <Button
                  onClick={handleChangePassword}
                  disabled={isChangingPassword}
                  className="bg-app-accent hover:bg-app-accent/90 shadow-sm rounded-md gap-2 min-h-[44px] px-6"
                >
                  <Lock className="h-4 w-4" />
                  {isChangingPassword ? "Changing..." : "Change Password"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {supplierProfile && (
            <Card className="border border-slate-200 shadow-sm overflow-hidden">
              <CardHeader className="p-6 border-b border-slate-100 bg-slate-50/30">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-green-100 border border-green-200 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-slate-900">Business Identification</CardTitle>
                    <CardDescription className="text-sm text-slate-600 mt-1">Verified supplier details linked to KL Fashion CRM</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label htmlFor="company-name" className="text-xs font-semibold uppercase tracking-wider text-slate-700 block flex items-center gap-2">
                      <Building2 className="h-3.5 w-3.5 text-slate-500" />
                      Legal Company Name
                    </label>
                    <input
                      id="company-name"
                      type="text"
                      value={businessForm.company}
                      onChange={(e) => handleBusinessChange("company", e.target.value)}
                      className="w-full px-4 py-3 text-sm font-medium text-slate-900 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-app-accent focus:border-app-accent transition-colors min-h-[44px]"
                    />
                  </div>
                  {supplierProfile.address && (
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 block flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-slate-500" />
                        Registered Office Address
                      </label>
                      <div className="text-sm font-medium text-slate-900 bg-slate-50 p-4 rounded-md border border-slate-200 leading-relaxed">
                        {supplierProfile.address}
                      </div>
                    </div>
                  )}
                </div>
                <div className="mt-8 pt-6 border-t border-slate-100">
                  <Button
                    onClick={handleSaveBusiness}
                    disabled={isSavingBusiness}
                    className="bg-app-accent hover:bg-app-accent/90 shadow-sm rounded-md gap-2 min-h-[44px] px-6"
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
