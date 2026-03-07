"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { LogOut, Menu, X } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { NAV_ITEMS } from "./Sidebar";

export function Topbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const toggleMobileNav = () => setIsMobileNavOpen((prev) => !prev);

  // Get current page label
  const currentPage = NAV_ITEMS.find(item => 
    pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`))
  );

  return (
    <>
      <header className="shrink-0 z-30 border-b border-app-border bg-white/95 backdrop-blur-sm">
        <div className="flex h-16 items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-4 min-w-0">
            <Button
              aria-label={isMobileNavOpen ? "Close navigation" : "Open navigation"}
              aria-expanded={isMobileNavOpen}
              className="md:hidden shrink-0"
              variant="ghost"
              size="icon"
              onClick={toggleMobileNav}
            >
              {isMobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            
            <div className="hidden md:block min-w-0">
              <h1 className="text-lg font-semibold text-slate-900 capitalize truncate">
                {currentPage?.label || "Dashboard"}
              </h1>
            </div>
            <span className="text-base font-semibold text-slate-900 md:hidden truncate">KL Supplier</span>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="hidden h-8 w-[1px] bg-slate-200 md:block"></div>
            
            <div className="flex items-center gap-3">
              <div className="hidden text-right md:flex md:flex-col leading-tight min-w-0">
                <span className="text-sm font-semibold text-slate-900 truncate">{user?.name}</span>
                <span className="text-[10px] font-medium text-slate-500 uppercase tracking-tight">Supplier</span>
              </div>
              
              <Button
                className="h-9 w-9 rounded-full bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-red-600 border border-slate-200 shrink-0"
                variant="ghost"
                size="icon"
                title="Sign out"
                aria-label="Sign out"
                onClick={() => logout(true)}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {isMobileNavOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/20 z-40 md:hidden"
            onClick={() => setIsMobileNavOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 left-0 w-64 bg-white border-r border-app-border shadow-xl z-50 md:hidden animate-in slide-in-from-left duration-200">
            <div className="flex flex-col h-full">
              <div className="flex h-16 items-center border-b border-app-border px-6 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-app-accent shadow-sm shadow-app-accent/20">
                    <span className="text-sm font-bold text-app-accent-foreground">KL</span>
                  </div>
                  <div className="flex flex-col leading-tight">
                    <span className="text-sm font-semibold text-slate-900">Supplier Portal</span>
                    <span className="text-[10px] font-medium text-slate-400">Powered by KL CRM</span>
                  </div>
                </div>
              </div>
              <nav className="flex flex-col gap-1 p-4 overflow-y-auto" aria-label="Mobile navigation">
                {NAV_ITEMS.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={isActive ? "page" : undefined}
                      className={clsx(
                        "flex items-center gap-3 rounded-lg px-4 py-3 font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-app-accent focus:ring-offset-2 min-h-[44px]",
                        isActive 
                          ? "bg-app-accent/10 text-app-accent font-semibold" 
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      )}
                      onClick={() => setIsMobileNavOpen(false)}
                    >
                      <Icon className={clsx("h-5 w-5 shrink-0", isActive ? "text-app-accent" : "text-slate-400")} />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
              <div className="mt-auto border-t border-app-border p-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-app-accent/10 flex items-center justify-center text-app-accent font-semibold text-xs uppercase shrink-0">
                    {user?.name?.charAt(0) || "S"}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold text-slate-900 truncate">{user?.name}</span>
                    <span className="text-[10px] text-slate-500 truncate">{user?.email}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
