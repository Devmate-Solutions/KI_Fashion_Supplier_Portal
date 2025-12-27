"use client";

import Link from "next/link";
import { Plus, Package, TrendingUp, ArrowDownCircle, CreditCard, AlertCircle, Receipt, RefreshCcwDot } from "lucide-react";
import useSWR from "swr";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/components/providers/AuthProvider";
import { getSupplierLedger } from "@/lib/api/ledger";
import { getProducts } from "@/lib/api/products";
import { currency } from "@/lib/utils/currency";

export default function DashboardPage() {
  const { user } = useAuth();

  // Note: Backend returns supplier.id (not _id), and supplierId at top level
  const supplierId = user?.supplierId || user?.supplier?.id || user?.supplier?._id || user?.supplier;

  // SINGLE SOURCE OF TRUTH: Fetch ledger data for all statistics
  const { data: ledgerData, isLoading: ledgerLoading, error: ledgerError } = useSWR(
    supplierId ? ["supplier-ledger-stats", supplierId] : null,
    () => getSupplierLedger(supplierId, { limit: 1000 }),
    { onError: (err) => console.error('Ledger fetch error:', err) }
  );

  // Fetch recent products (separate concern, OK to keep)
  const { data: productsData, isLoading: productsLoading, error: productsError } = useSWR(
    supplierId ? ["recent-products", supplierId] : null,
    () => getProducts({ limit: 5, supplier: supplierId }),
    { onError: (err) => console.error('Products fetch error:', err) }
  );

  // ===== DERIVED VALUES FROM LEDGER DATA (Single Source of Truth) =====
  const entries = ledgerData?.entries || [];

  // Current balance from backend (already calculated)
  const currentBalance = ledgerData?.currentBalance || ledgerData?.totalBalance || 0;

  // Transaction count
  const recentTransactionsCount = entries.length;

  // Calculate total purchases (what supplier has sold)
  const totalPurchases = useMemo(() => {
    return entries
      .filter(entry => entry.transactionType === 'purchase')
      .reduce((sum, entry) => sum + (entry.debit || 0), 0);
  }, [entries]);

  // Calculate total payments received
  const totalPaymentsReceived = useMemo(() => {
    return entries
      .filter(entry => entry.transactionType === 'payment')
      .reduce((sum, entry) => sum + (entry.credit || 0), 0);
  }, [entries]);

  // Calculate total returns/adjustments (deducted from supplier)
  const totalReturnedAmount = useMemo(() => {
    return entries
      .filter(entry => entry.transactionType === 'return')
      .reduce((sum, entry) => sum + (entry.credit || 0), 0);
  }, [entries]);

  // Pending Receivables: If currentBalance > 0, admin owes supplier
  // If currentBalance <= 0, nothing pending (or supplier owes admin)
  const pendingReceivables = Math.max(0, currentBalance);

  // Amount supplier owes admin (if any)
  const supplierOwesAdmin = currentBalance < 0;
  const amountOwed = Math.abs(Math.min(0, currentBalance));

  return (
    <div className="mx-auto max-w-7xl space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Welcome back!</h1>
        <p className="mt-2 text-slate-500">
          Here's what's happening with your account today.
        </p>
      </div>

      {/* Debug: Show errors if any API fails */}
      {ledgerError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="font-semibold text-red-800">Error loading dashboard data</p>
          <p className="text-sm text-red-700">Ledger: {ledgerError.message}</p>
          <p className="text-xs text-red-600 mt-2">Supplier ID: {supplierId || 'Not found'}</p>
        </div>
      )}

      {/* Alert Banner - Show when supplier owes admin */}
      {supplierOwesAdmin && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-800">Outstanding Balance</p>
            <p className="text-sm text-amber-700 mt-1">
              Your account shows a balance of <strong>{currency(amountOwed)}</strong> owed to admin.
              This may be from overpayments or returns on paid items. This amount will be adjusted from future payments.
            </p>
          </div>
        </div>
      )}





      {/* Financial Statistics - 3 Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Remaining Balance - What Admin Owes Supplier */}
        <Card className="overflow-hidden border-none shadow-md shadow-slate-200/50 hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-br from-white to-green-50/30">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">Remaining Balance</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">
              {ledgerLoading ? (
                <div className="h-8 w-24 bg-slate-100 animate-pulse rounded"></div>
              ) : currency(pendingReceivables)}
            </div>
            <p className={`mt-1 text-xs font-medium flex items-center gap-1 ${pendingReceivables > 0 ? 'text-green-600' : 'text-slate-500'}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${pendingReceivables > 0 ? 'bg-green-500' : 'bg-slate-300'}`}></span>
              {pendingReceivables > 0 ? 'Admin owes you this amount' : 'No pending balance'}
            </p>
          </CardContent>
        </Card>

        {/* Outstanding Balance - What Supplier Owes Admin */}
        <Card className={`overflow-hidden border-none shadow-md shadow-slate-200/50 hover:shadow-lg transition-shadow duration-300 ${supplierOwesAdmin ? 'ring-2 ring-amber-400/50' : ''}`}>
          <CardHeader className={`flex flex-row items-center justify-between space-y-0 pb-2 ${supplierOwesAdmin ? 'bg-gradient-to-br from-white to-amber-50/50' : 'bg-gradient-to-br from-white to-slate-50/30'}`}>
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">Outstanding Balance</CardTitle>
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${supplierOwesAdmin ? 'bg-amber-50' : 'bg-slate-100'}`}>
              <CreditCard className={`h-4 w-4 ${supplierOwesAdmin ? 'text-amber-600' : 'text-slate-400'}`} />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className={`text-2xl font-bold ${supplierOwesAdmin ? 'text-amber-600' : 'text-slate-400'}`}>
              {ledgerLoading ? (
                <div className="h-8 w-24 bg-slate-100 animate-pulse rounded"></div>
              ) : currency(amountOwed)}
            </div>
            <p className={`mt-1 text-xs font-medium flex items-center gap-1 ${supplierOwesAdmin ? 'text-amber-600' : 'text-slate-500'}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${supplierOwesAdmin ? 'bg-amber-500' : 'bg-slate-300'}`}></span>
              {supplierOwesAdmin ? 'You owe admin this amount' : 'No outstanding balance'}
            </p>
          </CardContent>
        </Card>

        {/* Returns & Adjustments */}
        <Card className="overflow-hidden border-none shadow-md shadow-slate-200/50 hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-br from-white to-orange-50/30">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">Returns & Adjustments</CardTitle>
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
              {totalReturnedAmount > 0 ? 'Total returns processed' : 'No returns'}
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
                <RefreshCcwDot className="h-4.5 w-4.5 text-slate-400" />
                Monitor Returns
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* <Card className="border-none shadow-md shadow-slate-200/50">
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
        </Card> */}

        <Card className="border-none shadow-md shadow-slate-200/50 flex flex-col h-full overflow-hidden">
          <CardHeader className="bg-slate-900 text-white pb-6">
            <CardTitle className="text-lg">Account Summary</CardTitle>
            <CardDescription className="text-slate-400">Supplier identification</CardDescription>
          </CardHeader>
          {/* <CardContent className="pt-6 flex-1 bg-white relative -mt-4 rounded-t-2xl shadow-inner">
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
          </CardContent> */}
        </Card>
      </div>
    </div>
  );
}
