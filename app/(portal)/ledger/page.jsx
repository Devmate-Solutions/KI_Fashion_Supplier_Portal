"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { getSupplierLedger } from "@/lib/api/ledger";
import { getPendingBalances } from "@/lib/api/balances";
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

  // Fetch pending balances
  const { data: pendingBalancesData, isLoading: pendingBalancesLoading } = useSWR(
    supplierId ? ["pending-balances", supplierId] : null,
    () => getPendingBalances(supplierId)
  );

  const pendingBalances = pendingBalancesData?.balances || [];

  // Debug: Log the first balance to see what data we're receiving
  if (pendingBalances.length > 0 && !pendingBalancesLoading) {
    console.log('First pending balance data:', pendingBalances[0]);
  }

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


              <div className="overflow-hidden rounded-xl border border-app-border">
                <table className="min-w-full divide-y divide-app-border text-sm">
                  {JSON.stringify(allLedgerTransactions)}
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
          <CardTitle>Ledger</CardTitle>
        </CardHeader>
        <CardContent>
          {pendingBalancesLoading ? (
            <div className="p-8 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-app-accent"></div>
              <span className="ml-2 text-slate-600">Loading pending balances...</span>
            </div>
          ) : pendingBalances.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <p>No payment records found.</p>
              <p className="text-xs mt-2">No confirmed dispatch orders available.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-app-border">
              <table className="min-w-full divide-y divide-app-border text-sm">
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Reference</th>
                    <th className="px-4 py-3 text-right">Total Amount</th>
                    <th className="px-4 py-3 text-right">Discount</th>
                    <th className="px-4 py-3 text-right">Bank Paid</th>
                    <th className="px-4 py-3 text-right">Cash Paid</th>
                    <th className="px-4 py-3 text-right">Return Items Amount</th>
                    <th className="px-4 py-3 text-right">Remaining</th>
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
                          <a
                            href={`/dispatch-orders/${row.referenceId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-blue-600 hover:underline cursor-pointer text-left"
                          >
                            {row.reference || '-'}
                          </a>
                        ) : (
                          <span className="font-medium text-blue-600">{row.reference || '-'}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-semibold tabular-nums">{currency(row.grossTotal || row.totalValue || ((row.totalAmount || 0) + (row.discount || 0) + (row.returnAmount || 0)))}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="tabular-nums text-slate-600">{currency(row.discount || 0)}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="tabular-nums text-green-600 font-medium">
                          {currency(row.bankPaid || 0)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="tabular-nums text-green-600 font-medium">
                          {currency(row.cashPaid || 0)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="tabular-nums text-orange-600 font-medium">
                          {currency(row.returnAmount || 0)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`tabular-nums font-semibold ${(row.amount || 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {currency(Math.abs(row.amount || 0))}
                        </span>
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
      label: "Ledger",
      content: paymentDetails,
    },
    // {
    //   label: "Ledger",
    //   content: ledgerTabContent,
    // },
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


      <div className="">
        <>
          <Card>
            <CardHeader>
              <CardTitle>Ledger</CardTitle>
            </CardHeader>
            <CardContent>
              {pendingBalancesLoading ? (
                <div className="p-8 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-app-accent"></div>
                  <span className="ml-2 text-slate-600">Loading pending balances...</span>
                </div>
              ) : pendingBalances.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  <p>No payment records found.</p>
                  <p className="text-xs mt-2">No confirmed dispatch orders available.</p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-app-border">
                  <table className="min-w-full divide-y divide-app-border text-sm">
                    <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Reference</th>
                        <th className="px-4 py-3 text-right">Total Amount</th>
                        <th className="px-4 py-3 text-right">Discount</th>
                        <th className="px-4 py-3 text-right">Bank Paid</th>
                        <th className="px-4 py-3 text-right">Cash Paid</th>
                        <th className="px-4 py-3 text-right">Return Items Amount</th>
                        <th className="px-4 py-3 text-right">Remaining</th>
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
                            <span className="font-semibold tabular-nums">{currency(row.grossTotal || row.totalValue || ((row.totalAmount || 0) + (row.discount || 0) + (row.returnAmount || 0)))}</span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="tabular-nums text-slate-600">{currency(row.discount || 0)}</span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="tabular-nums text-green-600 font-medium">
                              {currency(row.bankPaid || 0)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="tabular-nums text-green-600 font-medium">
                              {currency(row.cashPaid || 0)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="tabular-nums text-orange-600 font-medium">
                              {currency(row.returnAmount || 0)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={`tabular-nums font-semibold ${(row.amount || 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {currency(Math.abs(row.amount || 0))}
                            </span>
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
        {/* <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          className="p-1"
        /> */}

        {/* <Card>
          <CardHeader>
            <CardTitle>Ledger</CardTitle>
          </CardHeader>
          <CardContent>
            {pendingBalancesLoading ? (
              <div className="p-8 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-app-accent"></div>
                <span className="ml-2 text-slate-600">Loading pending balances...</span>
              </div>
            ) : pendingBalances.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <p>No payment records found.</p>
                <p className="text-xs mt-2">No confirmed dispatch orders available.</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-app-border">
                <table className="min-w-full divide-y divide-app-border text-sm">
                  <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Date dddxc</th>
                      <th className="px-4 py-3">Reference</th>
                      <th className="px-4 py-3 text-right">Total Amount</th>
                      <th className="px-4 py-3 text-right">Discount</th>
                      <th className="px-4 py-3 text-right">Bank Paid</th>
                      <th className="px-4 py-3 text-right">Cash Paid</th>
                      <th className="px-4 py-3 text-right">Return Items Amount</th>
                      <th className="px-4 py-3 text-right">Remaining</th>
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
                          <span className="font-semibold tabular-nums">{currency(row.totalAmount || 0)}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="tabular-nums text-slate-600">{currency(row.discount || 0)}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="tabular-nums text-green-600 font-medium">
                            {currency(row.bankPaid || 0)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="tabular-nums text-green-600 font-medium">
                            {currency(row.cashPaid || 0)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="tabular-nums text-orange-600 font-medium">
                            {currency(row.returnAmount || 0)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`tabular-nums font-semibold ${(row.amount || 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {currency(Math.abs(row.amount || 0))}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card> */}
      </div>
    </div>
  );
}
