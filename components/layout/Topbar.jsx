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
    <header className="sticky top-0 z-30 border-b border-app-border bg-white/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-4">
          <Button
            aria-label="Open navigation"
            className="md:hidden"
            variant="ghost"
            size="icon"
            onClick={toggleMobileNav}
          >
            {isMobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          
          <div className="hidden md:block">
            <h2 className="text-lg font-semibold text-slate-900 capitalize">
              {currentPage?.label || "Dashboard"}
            </h2>
          </div>
          <span className="text-base font-semibold text-slate-900 md:hidden">KL Supplier</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden h-8 w-[1px] bg-slate-200 md:block"></div>
          
          <div className="flex items-center gap-3">
            <div className="hidden text-right md:flex md:flex-col leading-tight">
              <span className="text-sm font-semibold text-slate-900">{user?.name}</span>
              <span className="text-[10px] font-medium text-slate-500 uppercase tracking-tight">Supplier</span>
            </div>
            
            <Button
              className="h-9 w-9 rounded-full bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-red-600 border border-slate-200"
              variant="ghost"
              size="icon"
              title="Sign out"
              onClick={() => logout(true)}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {isMobileNavOpen && (
        <div className="border-t border-app-border bg-white p-4 shadow-xl md:hidden animate-in slide-in-from-top duration-200">
          <nav className="flex flex-col gap-1 text-sm">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    "flex items-center gap-3 rounded-lg px-4 py-3 font-medium transition-all duration-200",
                    isActive 
                      ? "bg-app-accent/10 text-app-accent" 
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                  onClick={() => setIsMobileNavOpen(false)}
                >
                  <Icon className={clsx("h-5 w-5", isActive ? "text-app-accent" : "text-slate-400")} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
