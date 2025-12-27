"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { getSupplierLedger } from "@/lib/api/ledger";
import { getPendingBalances } from "@/lib/api/balances";
import { TrendingUp, TrendingDown, RefreshCcw } from "lucide-react";
import Tabs from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { currency } from "@/lib/utils/currency";

export default function LedgerPage() {
  const { user } = useAuth();
  const router = useRouter();
  // Note: Backend returns supplier.id (not _id), and supplierId at top level
  const supplierId = user?.supplierId || user?.supplier?.id || user?.supplier?._id || user?.supplier;

  const [activeTab, setActiveTab] = useState(0);

  // Fetch ledger entries
  const { data: ledgerData, isLoading: ledgerLoading } = useSWR(
    supplierId ? ["supplier-ledger", supplierId] : null,
    () => getSupplierLedger(supplierId, { limit: 1000 })
  );

  // Fetch pending balances (always load for summary cards)
  const { data: pendingBalancesData, isLoading: pendingBalancesLoading } = useSWR(
    supplierId ? ["pending-balances", supplierId] : null,
    () => getPendingBalances(supplierId)
  );

  const pendingBalances = pendingBalancesData?.balances || [];
  const pendingTotals = pendingBalancesData?.totals || { cashPending: 0, bankPending: 0, totalPending: 0 };

  // Calculate totals from displayed rows (receivables - supplier is on receiving end)
  const calculatedReceivables = pendingBalances.reduce((sum, balance) => {
    return sum + (balance.amount || 0);
  }, 0);

  // Calculate total payables (returns and deductions)
  const totalPayables = useMemo(() => {
    const entries = ledgerData?.entries || ledgerData?.data?.entries || (Array.isArray(ledgerData) ? ledgerData : []);
    return entries
      .filter(entry => entry.transactionType === 'return')
      .reduce((sum, entry) => sum + (entry.debit || 0), 0);
  }, [ledgerData]);

  // Count of return transactions
  const payablesCount = useMemo(() => {
    const entries = ledgerData?.entries || ledgerData?.data?.entries || (Array.isArray(ledgerData) ? ledgerData : []);
    return entries.filter(entry => entry.transactionType === 'return').length;
  }, [ledgerData]);

  // Calculate total received so far (payments received from admin)
  const totalReceived = useMemo(() => {
    return pendingBalances.reduce((sum, balance) => sum + (balance.totalPaid || 0), 0);
  }, [pendingBalances]);

  // Calculate total paid so far (from ledger payment entries)
  const totalPaid = useMemo(() => {
    const entries = ledgerData?.entries || ledgerData?.data?.entries || (Array.isArray(ledgerData) ? ledgerData : []);
    return entries
      .filter(entry => entry.transactionType === 'payment')
      .reduce((sum, entry) => sum + (entry.credit || 0), 0);
  }, [ledgerData]);

  // Transform ledger entries for Tab 1
  // Show all ledger entries (purchases, payments, etc.)
  const allLedgerTransactions = useMemo(() => {
    // Handle different response structures
    const entries = ledgerData?.entries || ledgerData?.data?.entries || (Array.isArray(ledgerData) ? ledgerData : []);

    if (!entries || entries.length === 0) {
      return [];
    }

    // Show all entries - don't filter by transaction type
    // This allows viewing purchases, payments, and other transaction types
    const filteredEntries = entries;

    return filteredEntries.map(entry => {
      const supplier = entry.entityId || {};
      let typeLabel = entry.transactionType || '-';
      if (entry.transactionType === 'purchase') {
        if (entry.referenceModel === 'DispatchOrder') {
          typeLabel = 'Dispatch Order Confirmation';
        } else if (entry.referenceModel === 'Purchase') {
          typeLabel = 'Manual Purchase';
        } else {
          typeLabel = 'Purchase';
        }
      } else if (entry.transactionType === 'payment') {
        typeLabel = 'Payment';
      } else if (entry.transactionType === 'adjustment') {
        typeLabel = 'Adjustment';
      } else if (entry.transactionType === 'return') {
        typeLabel = 'Return';
      }

      // Get readable reference
      let readableReference = '-';
      if (entry.referenceId) {
        if (typeof entry.referenceId === 'object' && entry.referenceId !== null) {
          readableReference = entry.referenceId.orderNumber || entry.referenceId.purchaseNumber || entry.referenceId._id || '-';
        } else {
          readableReference = entry.referenceId.toString();
        }
      } else if (entry.reference || entry.referenceNumber) {
        readableReference = entry.reference || entry.referenceNumber;
      }

      return {
        id: entry._id || entry.id,
        date: entry.date || entry.createdAt,
        supplier: supplier.name || supplier.company || 'Unknown Supplier',
        supplierId: supplier._id || supplier.id,
        type: typeLabel,
        transactionType: entry.transactionType || entry.type,
        description: entry.description || entry.notes || '-',
        debit: entry.debit || 0,
        credit: entry.credit || 0,
        balance: entry.balance || 0,
        reference: readableReference,
        referenceId: (entry.referenceId && typeof entry.referenceId === 'object' && entry.referenceId._id)
          ? entry.referenceId._id.toString()
          : (entry.referenceId ? entry.referenceId.toString() : null),
        referenceModel: entry.referenceModel || '-',
        paymentMethod: entry.paymentMethod || null,
        paymentDetails: entry.paymentDetails || null,
        raw: entry
      };
    });
  }, [ledgerData]);

  if (!supplierId) {
    return (
      <div className="space-y-6">
        <Alert
          variant="warning"
          title="Supplier link required"
          description="Please contact support to link your login to a supplier record before accessing ledger."
        />
      </div>
    );
  }

  const ledgerTabContent = (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Ledger Entries</CardTitle>
          <CardDescription>View all your transactions and payments</CardDescription>
        </CardHeader>
        <CardContent>
          {ledgerLoading ? (
            <div className="p-12 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-app-accent"></div>
              <span className="ml-2 text-slate-600">Loading ledger entries...</span>
            </div>
          ) : allLedgerTransactions.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <p>No ledger entries found</p>
            </div>
          ) : (
            <>
              <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-50 rounded-lg p-6 space-y-1">
                  <p className="text-sm text-slate-600">Total Entries</p>
                  <p className="text-2xl font-bold">{allLedgerTransactions.length}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-6 space-y-1">
                  <p className="text-sm text-slate-600">Supplier Balance</p>
                  <p className={`text-2xl font-bold ${(ledgerData?.totalBalance || 0) >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {currency(Math.abs(ledgerData?.totalBalance || 0))} {(ledgerData?.totalBalance || 0) >= 0 ? 'DR' : 'CR'}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-lg p-6 space-y-1">
                  <p className="text-sm text-slate-600">Current Balance</p>
                  <p className={`text-2xl font-bold ${(ledgerData?.currentBalance || 0) >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {currency(Math.abs(ledgerData?.currentBalance || 0))} {(ledgerData?.currentBalance || 0) >= 0 ? 'DR' : 'CR'}
                  </p>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-app-border">
                <table className="min-w-full divide-y divide-app-border text-sm">
                  <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Qty</th>
                      <th className="px-4 py-3 text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-app-border bg-white">
                    {allLedgerTransactions.map((row) => {
                      // Calculate quantity
                      let quantity = '-';
                      if ((row.referenceModel === 'DispatchOrder' || row.referenceModel === 'Purchase') && row.raw?.referenceId) {
                        const dispatchOrder = typeof row.raw.referenceId === 'object' && row.raw.referenceId !== null
                          ? row.raw.referenceId
                          : null;
                        if (dispatchOrder?.items && Array.isArray(dispatchOrder.items)) {
                          const totalQty = dispatchOrder.items.reduce((sum, item, index) => {
                            const confirmedQty = dispatchOrder.confirmedQuantities?.find(
                              cq => cq.itemIndex === index
                            )?.quantity;
                            return sum + (confirmedQty || item.quantity || 0);
                          }, 0);
                          quantity = totalQty.toString();
                        }
                      }

                      return (
                        <tr key={row.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 whitespace-nowrap">
                            {row.date ? new Date(row.date).toLocaleDateString('en-GB') : "-"}
                          </td>
                          <td className="px-4 py-3">
                            <span>{row.type}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="tabular-nums">{quantity}</span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="tabular-nums font-semibold">{currency(row.balance)}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const paymentDetails = (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Payment</CardTitle>
        </CardHeader>
        <CardContent>
          {pendingBalancesLoading ? (
            <div className="p-8 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-app-accent"></div>
              <span className="ml-2 text-slate-600">Loading pending balances...</span>
            </div>
          ) : pendingBalances.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <p>No pending balances found.</p>
              <p className="text-xs mt-2">All orders have been fully paid.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-app-border">
              <table className="min-w-full divide-y divide-app-border text-sm">
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Reference</th>
                    <th className="px-4 py-3 text-right">Total Amount</th>
                    <th className="px-4 py-3 text-right">Paid Amount</th>
                    <th className="px-4 py-3 text-right">Remaining</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-app-border bg-white">
                  {pendingBalances.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        {row.date ? new Date(row.date).toLocaleDateString('en-GB') : "-"}
                      </td>
                      <td className="px-4 py-3">
                        {row.referenceId && row.referenceModel === 'DispatchOrder' ? (
                          <button
                            onClick={() => router.push(`/dispatch-orders/${row.referenceId}`)}
                            className="font-medium text-blue-600 hover:underline cursor-pointer text-left"
                          >
                            {row.reference || '-'}
                          </button>
                        ) : (
                          <span className="font-medium text-blue-600">{row.reference || '-'}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-semibold">{currency(row.totalAmount || row.amount || 0)}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="tabular-nums text-green-600 font-medium">
                          {currency(row.totalPaid || 0)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`tabular-nums font-semibold ${(row.amount || 0) > 0 ? 'text-green-600' : 'text-slate-400'}`}>
                          {currency(row.amount || 0)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {row.status === 'paid' ? (
                          <Badge className="bg-green-100 text-green-800">Paid</Badge>
                        ) : row.status === 'partial' ? (
                          <Badge className="bg-orange-100 text-orange-800">Partial</Badge>
                        ) : (
                          <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );

  const tabs = [
    {
      label: "Payment",
      content: paymentDetails,
    },
    {
      label: "Ledger",
      content: ledgerTabContent,
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Financial Ledger</h1>
          <p className="mt-2 text-slate-500">
            Monitor your transaction history, outstanding balances, and settlement status.
          </p>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-none shadow-md shadow-slate-200/50 overflow-hidden bg-white">
          <div className="absolute top-0 left-0 w-full h-1 bg-green-500"></div>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-9 w-9 rounded-xl bg-green-50 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Receivables</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {currency(calculatedReceivables)}
            </p>
            <p className="text-[11px] font-medium text-green-600 mt-2 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
              {pendingBalances.length} pending shipments
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md shadow-slate-200/50 overflow-hidden bg-white">
          <div className="absolute top-0 left-0 w-full h-1 bg-orange-500"></div>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-9 w-9 rounded-xl bg-orange-50 flex items-center justify-center">
                <TrendingDown className="h-5 w-5 text-orange-600" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Payables</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {currency(totalPayables)}
            </p>
            <p className="text-[11px] font-medium text-orange-600 mt-2 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-500"></span>
              {payablesCount} recorded returns
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md shadow-slate-200/50 overflow-hidden bg-white">
          <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center">
                <div className="h-5 w-5 text-blue-600 font-bold flex items-center justify-center">৳</div>
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Settled to Date</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {currency(totalReceived)}
            </p>
            <p className="text-[11px] font-medium text-blue-600 mt-2">
              Payments from KL Fashion
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md shadow-slate-200/50 overflow-hidden bg-white">
          <div className="absolute top-0 left-0 w-full h-1 bg-slate-900"></div>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center">
                <RefreshCcw className="h-5 w-5 text-slate-600" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Current Balance</span>
            </div>
            <p className={`text-2xl font-bold ${(ledgerData?.currentBalance || 0) >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              {currency(Math.abs(ledgerData?.currentBalance || 0))}
            </p>
            <p className="text-[11px] font-medium text-slate-400 mt-2 uppercase tracking-tighter">
              Account Status: <span className="text-slate-900 font-bold">{(ledgerData?.currentBalance || 0) >= 0 ? 'Debit' : 'Credit'}</span>
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white rounded-3xl shadow-md shadow-slate-200/50 overflow-hidden">
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          className="p-1"
        />
      </div>
    </div>
  );
}
