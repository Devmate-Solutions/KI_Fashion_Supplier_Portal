"use client";

import Link from "next/link";
import { Plus, Package, TrendingUp, ArrowDownCircle, CreditCard, AlertCircle, Receipt, RefreshCcwDot, Banknote } from "lucide-react";
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

  // Transaction count
  const recentTransactionsCount = entries.length;

  // Totals from backend
  const totalCashPayment = ledgerData?.totalCashPayment || 0;
  const totalBankPayment = ledgerData?.totalBankPayment || 0;

  // Calculate total purchases (what supplier has sold)
  const totalPurchases = useMemo(() => {
    return entries
      .filter(entry => entry.transactionType === 'purchase')
      .reduce((sum, entry) => sum + (entry.debit || 0), 0);
  }, [entries]);

  // Remaining Balance from backend (sum of remaining balances across all confirmed dispatch orders)
  // This matches the CRM calculation: totalAmount - totalPaid for each order
  const totalRemainingBalance = ledgerData?.totalRemainingBalance || 0;

  // Outstanding Balance from backend (sum of overpayments across all confirmed dispatch orders)
  // When totalPaid > totalAmount, the difference is outstanding (supplier owes admin)
  const totalOutstandingBalance = ledgerData?.totalOutstandingBalance || 0;

  // Total Balance: Calculate directly from ledger entries (SUM(debit) - SUM(credit))
  // Positive = admin owes supplier, Negative = supplier owes admin
  const _totalBalance = useMemo(() => {
    if (!entries || entries.length === 0) return 0;
    
    // Calculate: SUM(debit) - SUM(credit) from all ledger entries
    const totalDebit = entries.reduce((sum, entry) => sum + (Number(entry.debit) || 0), 0);
    const totalCredit = entries.reduce((sum, entry) => sum + (Number(entry.credit)|| 0), 0);
    
    return totalDebit - totalCredit;
  }, [entries]);
  
  const isPositive = _totalBalance > 0;
  const isNegative = _totalBalance < 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900">Welcome back!</h1>
        <p className="mt-2 text-sm text-slate-600">
          Here's what's happening with your account today.
        </p>
      </div>

      {/* Error Alert */}
      {ledgerError && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 flex items-start gap-3" role="alert">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="font-semibold text-red-800 text-sm">Error loading dashboard data</p>
            <p className="text-sm text-red-700 mt-1">Ledger: {ledgerError.message}</p>
          </div>
        </div>
      )}

      {/* Financial Statistics - 3 Cards */}
      <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Cash Payment */}
        <Card className="overflow-hidden border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-5">
              <div className="h-11 w-11 rounded-md bg-blue-100 flex items-center justify-center shrink-0 border border-blue-200/50">
                <Banknote className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-700">Cash Payment</CardTitle>
              </div>
            </div>
            <div className="text-2xl md:text-3xl font-semibold text-slate-900 tabular-nums mb-2">
              {ledgerLoading ? (
                <div className="h-8 w-32 bg-slate-100 animate-pulse rounded-md"></div>
              ) : currency(totalCashPayment)}
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Total cash received
            </p>
          </CardContent>
        </Card>

        {/* Bank Payment */}
        <Card className="overflow-hidden border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-5">
              <div className="h-11 w-11 rounded-md bg-app-accent/15 flex items-center justify-center shrink-0 border border-app-accent/20">
                <CreditCard className="h-5 w-5 text-app-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-700">Bank Payment</CardTitle>
              </div>
            </div>
            <div className="text-2xl md:text-3xl font-semibold text-slate-900 tabular-nums mb-2">
              {ledgerLoading ? (
                <div className="h-8 w-32 bg-slate-100 animate-pulse rounded-md"></div>
              ) : currency(totalBankPayment)}
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Total bank transfers
            </p>
          </CardContent>
        </Card>

        {/* Total Balance - Combined Remaining and Outstanding */}
        <Card className={`overflow-hidden border transition-all duration-200 shadow-sm hover:shadow-md ${
          isNegative 
            ? 'border-red-200 bg-red-50/30 hover:border-red-300' 
            : isPositive 
              ? 'border-green-200 bg-green-50/30 hover:border-green-300'
              : 'border-slate-200 hover:border-slate-300'
        }`}>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-5">
              <div className={`h-11 w-11 rounded-md flex items-center justify-center shrink-0 ${
                isPositive
                  ? 'bg-green-100 border border-green-200/50'
                  : isNegative
                    ? 'bg-red-100 border border-red-200/50'
                    : 'bg-slate-100 border border-slate-200/50'
              }`}>
                {isPositive ? (
                  <TrendingUp className="h-5 w-5 text-green-600" />
                ) : isNegative ? (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                ) : (
                  <TrendingUp className="h-5 w-5 text-slate-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-700">Total Balance</CardTitle>
              </div>
            </div>
            <div className={`text-2xl md:text-3xl font-semibold tabular-nums mb-2 ${
              isPositive
                ? 'text-green-600'
                : isNegative
                  ? 'text-red-600'
                  : 'text-slate-400'
            }`}>
              {ledgerLoading ? (
                <div className="h-8 w-32 bg-slate-100 animate-pulse rounded-md"></div>
              ) : (
                <span>
                  {isNegative && '-'}
                  {currency(Math.abs(_totalBalance))}
                </span>
              )}
            </div>
            <p className={`text-xs font-medium flex items-center gap-1.5 ${
              isPositive
                ? 'text-green-600'
                : isNegative
                  ? 'text-red-600'
                  : 'text-slate-500'
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${
                isPositive
                  ? 'bg-green-500'
                  : isNegative
                    ? 'bg-red-500'
                    : 'bg-slate-300'
              }`}></span>
              {isPositive
                ? 'Admin owes you'
                : isNegative
                  ? 'You owe admin'
                  : 'No balance'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold text-slate-900">Quick Actions</CardTitle>
          <CardDescription className="text-sm text-slate-600 mt-1.5">Commonly used shortcuts</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild className="w-full sm:flex-1 sm:min-w-[200px] justify-start h-12 px-4 bg-app-accent hover:bg-app-accent/90 shadow-sm hover:shadow-md transition-all min-h-[44px] text-left">
              <Link href="/dispatch-orders/create" className="flex items-center gap-3 w-full justify-start text-left">
                <div className="h-8 w-8 rounded-md bg-white/20 flex items-center justify-center shrink-0">
                  <Plus className="h-4 w-4 text-white" />
                </div>
                <span className="font-semibold text-sm whitespace-nowrap text-left">Create Dispatch Order</span>
                <div className="h-6 w-6 rounded-full bg-white/25 flex items-center justify-center text-[11px] font-semibold text-white shrink-0 ml-auto">
                  1
                </div>
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full sm:flex-1 sm:min-w-[160px] justify-start h-12 px-4 hover:bg-app-accent/10 hover:border-app-accent hover:text-app-accent border-slate-200 transition-all min-h-[44px] group text-left">
              <Link href="/dispatch-orders" className="flex items-center gap-3 w-full justify-start text-left">
                <div className="h-8 w-8 rounded-md bg-slate-100 group-hover:bg-app-accent/15 flex items-center justify-center shrink-0 transition-colors">
                  <Package className="h-4 w-4 text-slate-600 group-hover:text-app-accent transition-colors" />
                </div>
                <span className="font-medium text-sm whitespace-nowrap group-hover:text-app-accent transition-colors text-left">Track All Shipments</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full sm:flex-1 sm:min-w-[160px] justify-start h-12 px-4 hover:bg-app-accent/10 hover:border-app-accent hover:text-app-accent border-slate-200 transition-all min-h-[44px] group text-left">
              <Link href="/supplier-ledger" className="flex items-center gap-3 w-full justify-start text-left">
                <div className="h-8 w-8 rounded-md bg-slate-100 group-hover:bg-app-accent/15 flex items-center justify-center shrink-0 transition-colors">
                  <Receipt className="h-4 w-4 text-slate-600 group-hover:text-app-accent transition-colors" />
                </div>
                <span className="font-medium text-sm whitespace-nowrap group-hover:text-app-accent transition-colors text-left">Check Payments</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full sm:flex-1 sm:min-w-[160px] justify-start h-12 px-4 hover:bg-app-accent/10 hover:border-app-accent hover:text-app-accent border-slate-200 transition-all min-h-[44px] group text-left">
              <Link href="/returns" className="flex items-center gap-3 w-full justify-start text-left">
                <div className="h-8 w-8 rounded-md bg-slate-100 group-hover:bg-app-accent/15 flex items-center justify-center shrink-0 transition-colors">
                  <RefreshCcwDot className="h-4 w-4 text-slate-600 group-hover:text-app-accent transition-colors" />
                </div>
                <span className="font-medium text-sm whitespace-nowrap group-hover:text-app-accent transition-colors text-left">Monitor Returns</span>
              </Link>
            </Button>
          </div>
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
                        {Array.isArray(product.season) && product.season.length > 0 
                          ? product.season.join(", ") 
                          : product.category}
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

        {/* <Card className="border-none shadow-md shadow-slate-200/50 flex flex-col h-full overflow-hidden">
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
                <div className="flex items-center justify-between p-3 rounded-xl bg-app-accent/5 border border-app-accent/10 transition-colors hover:border-app-accent/20">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-app-accent">
                      <LayoutDashboard className="h-4 w-4" />
                    </div>
                    <span className="text-app-accent font-medium">Company</span>
                  </div>
                  <span className="font-bold text-app-accent">{user.supplier.company}</span>
                </div>
              )}
            </div>

            <div className="mt-8">
              <Button asChild variant="outline" className="w-full h-10 border-slate-200 hover:bg-slate-50 text-slate-600 text-xs uppercase font-bold tracking-widest">
                <Link href="/settings">Account Settings</Link>
              </Button>
            </div>
          </CardContent>
        </Card> */}

    </div>
  );
}
