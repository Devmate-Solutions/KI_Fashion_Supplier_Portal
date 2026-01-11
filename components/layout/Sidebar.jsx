"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  LayoutDashboard,
  Settings,
  Truck,
  RefreshCcw,
  Package,
  ClipboardList,
  BookOpen,
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dispatch-orders", label: "Dispatch Orders", icon: Truck },
  // { href: "/products", label: "Products", icon: Package },
  // { href: "/purchase-orders", label: "Purchase Orders", icon: ClipboardList },
  { href: "/returns", label: "Returns", icon: RefreshCcw },
  { href: "/supplier-ledger", label: "Supplier Ledger", icon: BookOpen },
  { href: "/settings", label: "Settings", icon: Settings },
];


export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <aside className="hidden w-64 flex-col border-r border-app-border bg-white md:flex">
      <div className="flex h-16 items-center border-b border-app-border px-6">
        <Link className="flex items-center gap-2.5" href="/dashboard">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-app-accent shadow-sm shadow-app-accent/20">
            <span className="text-sm font-bold text-app-accent-foreground">KL</span>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-bold text-slate-900">Supplier Portal</span>
            <span className="text-[10px] font-medium text-slate-400">Powered by KL CRM</span>
          </div>
        </Link>
      </div>

      <div className="flex flex-1 flex-col justify-between overflow-y-auto p-4">
        <nav className="flex flex-col gap-1">
          <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Main Menu</p>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-app-accent/10 text-app-accent shadow-sm shadow-app-accent/5"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <Icon className={clsx("h-4.5 w-4.5", isActive ? "text-app-accent" : "text-slate-400")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-4">
          <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
            <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-slate-200/50">
              <RefreshCcw className="h-4 w-4 text-app-accent" />
            </div>
            <p className="text-xs font-semibold text-slate-900">Need assistance?</p>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-500">Our support team is available for any questions about your orders.</p>
            <a
              href="mailto:suppliers@klfashion.com"
              className="mt-3 block text-center rounded-lg bg-white py-1.5 text-[11px] font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50 transition-colors"
            >
              Contact Support
            </a>
          </div>

          <div className="flex items-center gap-3 border-t border-app-border pt-4 px-2">
            <div className="h-8 w-8 rounded-full bg-app-accent/10 flex items-center justify-center text-app-accent font-bold text-xs uppercase">
              {user?.name?.charAt(0) || "S"}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-slate-900 truncate">{user?.name}</span>
              <span className="text-[10px] text-slate-500 truncate">{user?.email}</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
