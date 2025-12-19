"use client";

import Link from "next/link";
import { Plus, Package, Receipt, RefreshCcw, TrendingUp, ArrowDownCircle, CreditCard, LayoutDashboard } from "lucide-react";
import useSWR from "swr";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/components/providers/AuthProvider";
import { getSupplierLedger } from "@/lib/api/ledger";
import { getPendingBalances } from "@/lib/api/balances";
import { getProducts } from "@/lib/api/products";
import { currency } from "@/lib/utils/currency";

export default function DashboardPage() {
  const { user } = useAuth();
  const supplierId = user?.supplier?._id || user?.supplier || user?.supplierId;

  // Fetch ledger data for statistics
  const { data: ledgerData, isLoading: ledgerLoading } = useSWR(
    supplierId ? ["supplier-ledger-stats", supplierId] : null,
    () => getSupplierLedger(supplierId, { limit: 1000 })
  );

  // Fetch pending balances
  const { data: pendingBalancesData, isLoading: pendingLoading } = useSWR(
    supplierId ? ["pending-balances-stats", supplierId] : null,
    () => getPendingBalances(supplierId)
  );

  // Fetch recent products
  const { data: productsData, isLoading: productsLoading } = useSWR(
    supplierId ? ["recent-products", supplierId] : null,
    () => getProducts({ limit: 5, supplier: supplierId })
  );

  const pendingBalances = pendingBalancesData?.balances || [];
  const totalReceivables = pendingBalances.reduce((sum, balance) => sum + (balance.amount || 0), 0);
  const currentBalance = ledgerData?.currentBalance || ledgerData?.totalBalance || 0;
  const recentTransactionsCount = ledgerData?.entries?.length || 0;

  // Calculate total returned amount from ledger entries (confirmed returns)
  const totalReturnedAmount = useMemo(() => {
    const entries = ledgerData?.entries || ledgerData?.data?.entries || [];
    return entries
      .filter(entry => entry.transactionType === 'return' && entry.referenceModel === 'Return')
      .reduce((sum, entry) => sum + (entry.credit || 0), 0);
  }, [ledgerData]);

  return (
    <div className="mx-auto max-w-7xl space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Welcome back!</h1>
        <p className="mt-2 text-slate-500">
          Here's what's happening with your account today.
        </p>
      </div>

      {/* Financial Statistics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="overflow-hidden border-none shadow-md shadow-slate-200/50 hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-br from-white to-green-50/30">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Receivables</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-slate-900">
              {pendingLoading ? (
                <div className="h-8 w-24 bg-slate-100 animate-pulse rounded"></div>
              ) : currency(totalReceivables)}
            </div>
            <p className="mt-1 text-xs text-green-600 font-medium flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
              Payment pending from admin
            </p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-none shadow-md shadow-slate-200/50 hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-br from-white to-orange-50/30">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">Returned Value</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-orange-50 flex items-center justify-center">
              <ArrowDownCircle className="h-4 w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-slate-900">
              {ledgerLoading ? (
                <div className="h-8 w-24 bg-slate-100 animate-pulse rounded"></div>
              ) : currency(totalReturnedAmount)}
            </div>
            <p className="mt-1 text-xs text-orange-600 font-medium flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-500"></span>
              Total adjusted value
            </p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-none shadow-md shadow-slate-200/50 hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-br from-white to-indigo-50/30">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">Ledger Balance</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center">
              <CreditCard className="h-4 w-4 text-indigo-600" />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className={`text-2xl font-bold ${currentBalance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              {ledgerLoading ? (
                <div className="h-8 w-24 bg-slate-100 animate-pulse rounded"></div>
              ) : currency(Math.abs(currentBalance))}
            </div>
            <p className="mt-1 text-xs font-medium text-slate-500">
              Current status: <span className={currentBalance >= 0 ? 'text-red-500' : 'text-green-500'}>{currentBalance >= 0 ? 'Debit' : 'Credit'}</span>
            </p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-none shadow-md shadow-slate-200/50 hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-br from-white to-slate-50/30">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">Recent Activity</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center">
              <Receipt className="h-4 w-4 text-slate-600" />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-slate-900">
              {ledgerLoading ? (
                <div className="h-8 w-24 bg-slate-100 animate-pulse rounded"></div>
              ) : recentTransactionsCount}
            </div>
            <p className="mt-1 text-xs text-slate-500 font-medium">
              Transactions recorded
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-none shadow-md shadow-slate-200/50 flex flex-col">
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
            <CardDescription>Commonly used shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 pt-2">
            <Button asChild className="w-full justify-between h-11 px-4 bg-app-accent hover:bg-app-accent/90 shadow-sm shadow-app-accent/20">
              <Link href="/dispatch-orders/create">
                <span className="flex items-center gap-3">
                  <Plus className="h-4.5 w-4.5" />
                  Create Dispatch Order
                </span>
                <div className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center text-[10px]">1</div>
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start h-11 px-4 hover:bg-slate-50 border-slate-200">
              <Link href="/dispatch-orders" className="flex items-center gap-3">
                <Package className="h-4.5 w-4.5 text-slate-400" />
                Track All Shipments
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start h-11 px-4 hover:bg-slate-50 border-slate-200">
              <Link href="/ledger" className="flex items-center gap-3">
                <Receipt className="h-4.5 w-4.5 text-slate-400" />
                Check Payments
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start h-11 px-4 hover:bg-slate-50 border-slate-200">
              <Link href="/returns" className="flex items-center gap-3">
                <RefreshCcw className="h-4.5 w-4.5 text-slate-400" />
                Monitor Returns
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md shadow-slate-200/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div className="space-y-1">
              <CardTitle className="text-lg">Recent Products</CardTitle>
              <CardDescription>Latest catalog entries</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm" className="text-app-accent font-semibold h-8">
              <Link href="/products">View All</Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-2">
            {productsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="h-10 w-10 rounded-lg bg-slate-100"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-2/3 bg-slate-100 rounded"></div>
                      <div className="h-2 w-1/3 bg-slate-100 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : productsData && productsData.length > 0 ? (
              <div className="space-y-4">
                {productsData.map((product) => (
                  <div key={product._id} className="flex items-center gap-3 group">
                    <div className="h-10 w-10 rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-center overflow-hidden flex-shrink-0 group-hover:border-app-accent/30 transition-colors">
                      {product.images?.[0] ? (
                        <img src={product.images[0]} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110" />
                      ) : (
                        <Package className="h-5 w-5 text-slate-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate group-hover:text-app-accent transition-colors">{product.name}</p>
                      <p className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 leading-none">{product.sku}</span>
                        {product.productType?.name || product.category}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <Package className="h-8 w-8 text-slate-200 mb-2" />
                <p className="text-sm text-slate-500">No products yet.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-md shadow-slate-200/50 flex flex-col h-full overflow-hidden">
          <CardHeader className="bg-slate-900 text-white pb-6">
            <CardTitle className="text-lg">Account Summary</CardTitle>
            <CardDescription className="text-slate-400">Supplier identification</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 flex-1 bg-white relative -mt-4 rounded-t-2xl shadow-inner">
            <div className="space-y-5 text-sm">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 transition-colors hover:border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-slate-400">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <span className="text-slate-600 font-medium">Account Name</span>
                </div>
                <span className="font-bold text-slate-900">{user?.name || "—"}</span>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 transition-colors hover:border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-slate-400">
                    <CreditCard className="h-4 w-4" />
                  </div>
                  <span className="text-slate-600 font-medium">Email</span>
                </div>
                <span className="font-bold text-slate-900 truncate max-w-[150px]">{user?.email || "—"}</span>
              </div>

              {user?.supplier?.company && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-50/50 border border-indigo-100/50 transition-colors hover:border-indigo-200">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-indigo-400">
                      <LayoutDashboard className="h-4 w-4" />
                    </div>
                    <span className="text-indigo-700 font-medium">Company</span>
                  </div>
                  <span className="font-bold text-indigo-900">{user.supplier.company}</span>
                </div>
              )}
            </div>
            
            <div className="mt-8">
              <Button asChild variant="outline" className="w-full h-10 border-slate-200 hover:bg-slate-50 text-slate-600 text-xs uppercase font-bold tracking-widest">
                <Link href="/settings">Account Settings</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
