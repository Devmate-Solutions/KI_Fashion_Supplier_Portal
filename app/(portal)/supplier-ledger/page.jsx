"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import { Search, Loader2 } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { getSupplierLedger } from "@/lib/api/ledger";
import { getPendingBalances } from "@/lib/api/balances";
import Tabs from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
const formatNumber = (n) => {
    const num = Number(n || 0);
    return num.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};



export default function SupplierLedgerPage() {
    const { user } = useAuth();
    const router = useRouter();
    // Note: Backend returns supplier.id (not _id), and supplierId at top level
    const supplierId = user?.supplierId || user?.supplier?.id || user?.supplier?._id || user?.supplier;

    const [activeTab, setActiveTab] = useState(0);
    const [searchTerm, setSearchTerm] = useState("");

    // Filters for Payment History tab
    const [paymentHistoryMethodFilter, setPaymentHistoryMethodFilter] = useState("all");

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

    // =====================================================
    // TAB 1: LEDGER - Complete Transaction History
    // =====================================================
    const allLedgerTransactions = useMemo(() => {
        const entries = ledgerData?.entries || ledgerData?.data?.entries || (Array.isArray(ledgerData) ? ledgerData : []);

        if (!entries || entries.length === 0) {
            return [];
        }

        // Filter to show purchases, payments, and returns (complete ledger history)
        const filteredEntries = entries.filter(entry =>
            entry.transactionType === 'purchase' ||
            entry.transactionType === 'payment' ||
            entry.transactionType === 'return'
        );

        const mappedItems = filteredEntries.map(entry => {
            const supplier = entry.entityId || {};
            let typeLabel = entry.transactionType || '-';

            // Determine type label
            if (entry.transactionType === 'payment') {
                if (entry.paymentMethod === 'cash') {
                    typeLabel = 'Payment - Cash';
                } else if (entry.paymentMethod === 'bank') {
                    typeLabel = 'Payment - Bank';
                } else {
                    typeLabel = 'Payment';
                }
            } else if (entry.transactionType === 'return') {
                typeLabel = 'Return (Credit)';
            } else if (entry.transactionType === 'purchase') {
                if (entry.referenceModel === 'DispatchOrder') {
                    typeLabel = 'Purchase (Dispatch Order)';
                } else if (entry.referenceModel === 'Purchase') {
                    typeLabel = 'Purchase (Manual)';
                } else {
                    typeLabel = 'Purchase';
                }
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

            // Calculate separate payment amounts
            const cashPaid = (entry.transactionType === 'payment' && entry.paymentMethod === 'cash') ? (entry.credit || 0) : 0;
            const bankPaid = (entry.transactionType === 'payment' && entry.paymentMethod === 'bank') ? (entry.credit || 0) : 0;

            // Calculate return amount
            const returnAmount = (entry.transactionType === 'return') ? (entry.credit || 0) : 0;

            // Get discount from reference
            let discountAmount = 0;
            if (entry.referenceId && typeof entry.referenceId === 'object') {
                discountAmount = entry.referenceId.totalDiscount || entry.referenceId.discount || 0;
            }

            return {
                id: entry._id || entry.id,
                date: entry.date || entry.createdAt,
                createdAt: entry.createdAt,
                supplier: supplier.name || supplier.company || 'Unknown Supplier',
                supplierId: supplier._id || supplier.id,
                type: typeLabel,
                transactionType: entry.transactionType || entry.type,
                description: entry.description || entry.notes || '-',
                debit: Number(entry.debit) || 0,
                credit: Number(entry.credit) || 0,
                cashPaid,
                bankPaid,
                returnAmount,
                discount: discountAmount,
                balance: 0, // Will be calculated below
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

        // Sort by createdAt ASCENDING (oldest first) for running balance calculation
        mappedItems.sort((a, b) => {
            const createdAtA = new Date(a.createdAt || a.date || 0).getTime();
            const createdAtB = new Date(b.createdAt || b.date || 0).getTime();
            return createdAtA - createdAtB;
        });

        // Calculate running balance client-side (debit increases, credit decreases)
        let runningBalance = 0;
        for (const entry of mappedItems) {
            runningBalance = runningBalance + entry.debit - entry.credit;
            entry.balance = runningBalance;
        }

        // Reverse to show newest first
        return mappedItems.reverse();
    }, [ledgerData]);

    // =====================================================
    // TAB 2: PENDING PAYMENTS - Orders needing payment
    // =====================================================
    const filteredPendingBalances = useMemo(() => {
        const sorted = [...pendingBalances].sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));

        if (!searchTerm.trim()) {
            return sorted;
        }
        const searchLower = searchTerm.toLowerCase().trim();
        return sorted.filter((row) => {
            const reference = (row.reference || "").toLowerCase();
            return reference.includes(searchLower);
        });
    }, [pendingBalances, searchTerm]);

    // =====================================================
    // TAB 3: PAYMENT HISTORY - Payment entries only
    // =====================================================
    const paymentHistoryTransactions = useMemo(() => {
        const entries = ledgerData?.entries || ledgerData?.data?.entries || (Array.isArray(ledgerData) ? ledgerData : []);

        if (!entries || entries.length === 0) {
            return [];
        }

        // Filter to only payment entries
        let paymentEntries = entries.filter(entry => entry.transactionType === 'payment');

        // Apply payment method filter
        if (paymentHistoryMethodFilter !== 'all') {
            paymentEntries = paymentEntries.filter(entry => entry.paymentMethod === paymentHistoryMethodFilter);
        }

        return paymentEntries.map(entry => {
            // Get order reference
            let reference = '-';
            if (entry.referenceId) {
                if (typeof entry.referenceId === 'object' && entry.referenceId !== null) {
                    reference = entry.referenceId.orderNumber || entry.referenceId.purchaseNumber || entry.referenceId._id || '-';
                } else {
                    reference = entry.referenceId.toString();
                }
            }

            return {
                id: entry._id || entry.id,
                date: entry.date || entry.createdAt,
                reference,
                referenceId: (entry.referenceId && typeof entry.referenceId === 'object' && entry.referenceId._id)
                    ? entry.referenceId._id.toString()
                    : (entry.referenceId ? entry.referenceId.toString() : null),
                paymentMethod: entry.paymentMethod || 'cash',
                amount: entry.credit || 0,
                notes: entry.description || entry.remarks || '-',
                raw: entry
            };
        }).sort((a, b) => new Date(b.raw.createdAt || b.date) - new Date(a.raw.createdAt || a.date));
    }, [ledgerData, paymentHistoryMethodFilter]);

    // Calculate payment summary for Tab 3
    const paymentSummary = useMemo(() => {
        const total = paymentHistoryTransactions.reduce((sum, txn) => sum + (txn.amount || 0), 0);
        const cash = paymentHistoryTransactions
            .filter(txn => txn.paymentMethod === 'cash')
            .reduce((sum, txn) => sum + (txn.amount || 0), 0);
        const bank = paymentHistoryTransactions
            .filter(txn => txn.paymentMethod === 'bank')
            .reduce((sum, txn) => sum + (txn.amount || 0), 0);

        // Count payments this month
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const countThisMonth = paymentHistoryTransactions.filter(txn => {
            const txnDate = new Date(txn.date);
            return txnDate >= firstDayOfMonth;
        }).length;

        return { total, cash, bank, countThisMonth };
    }, [paymentHistoryTransactions]);

    // Calculate totals for display
    const calculatedTotalBalance = ledgerData?.currentBalance || ledgerData?.totalBalance || 0;
    const calculatedTotalPending = filteredPendingBalances.reduce((sum, balance) => sum + (balance.amount || 0), 0);

    if (!supplierId) {
        return (
            <div className="space-y-6">
                <Alert
                    variant="warning"
                    title="Supplier link required"
                    description="Please contact support to link your login to a supplier record before accessing supplier ledger."
                />
            </div>
        );
    }

    // =====================================================
    // TAB 1 CONTENT: LEDGER
    // =====================================================
    const ledgerTabContent = (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Complete Ledger History</CardTitle>
                    <CardDescription>All purchases, payments, and returns - complete accounting record</CardDescription>
                </CardHeader>
                <CardContent>
                    {ledgerLoading ? (
                        <div className="p-12 flex items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                            <span className="ml-2 text-slate-600">Loading ledger entries...</span>
                        </div>
                    ) : allLedgerTransactions.length === 0 ? (
                        <div className="p-12 text-center text-slate-500">
                            <p>No ledger entries found</p>
                        </div>
                    ) : (
                        <>
                            {/* Summary Cards */}
                            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-slate-50 rounded-lg p-6 space-y-1">
                                    <p className="text-sm text-slate-500">Total Entries</p>
                                    <p className="text-2xl font-bold">{allLedgerTransactions.length}</p>
                                </div>
                                <div className="bg-slate-50 rounded-lg p-6 space-y-1">
                                    <p className="text-sm text-slate-500">Current Balance</p>
                                    <p className={`text-2xl font-bold ${calculatedTotalBalance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                                        {formatNumber(Math.abs(calculatedTotalBalance))}
                                    </p>

                                </div>
                            </div>

                            {/* Ledger Table */}
                            <div className="overflow-hidden rounded-xl border border-app-border">
                                <table className="min-w-full divide-y divide-app-border text-sm">
                                    <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        <tr>
                                            <th className="px-4 py-3">Date</th>
                                            <th className="px-4 py-3">Entry Number</th>
                                            <th className="px-4 py-3">Type</th>
                                            <th className="px-4 py-3">Reference</th>
                                            <th className="px-4 py-3 text-right">Debit (Owe)</th>
                                            <th className="px-4 py-3 text-right">Cash Paid</th>
                                            <th className="px-4 py-3 text-right">Bank Paid</th>
                                            <th className="px-4 py-3 text-right">Return</th>
                                            <th className="px-4 py-3 text-right">Balance</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-app-border bg-white">
                                        {allLedgerTransactions.map((row) => (
                                            <tr key={row.id} className="hover:bg-slate-50">
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    {row.date ? new Date(row.date).toLocaleDateString('en-GB') : "-"}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span>{row.type}</span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {row.referenceId ? (
                                                        <button
                                                            onClick={() => router.push(`/dispatch-orders/${row.referenceId}`)}
                                                            className="font-medium text-blue-600 hover:underline cursor-pointer text-left"
                                                        >
                                                            {row.reference || '-'}
                                                        </button>
                                                    ) : (
                                                        <span className="font-medium">{row.reference || '-'}</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <span className={`tabular-nums font-semibold ${row.debit > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                                                        {row.debit > 0 ? formatNumber(row.debit) : '-'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <span className={`tabular-nums font-semibold ${row.cashPaid > 0 ? 'text-blue-600' : 'text-slate-400'}`}>
                                                        {row.cashPaid > 0 ? formatNumber(row.cashPaid) : '-'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <span className={`tabular-nums font-semibold ${row.bankPaid > 0 ? 'text-purple-600' : 'text-slate-400'}`}>
                                                        {row.bankPaid > 0 ? formatNumber(row.bankPaid) : '-'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <span className={`tabular-nums font-semibold ${row.returnAmount > 0 ? 'text-orange-600' : 'text-slate-400'}`}>
                                                        {row.returnAmount > 0 ? formatNumber(row.returnAmount) : '-'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <span className="tabular-nums font-bold">{formatNumber(row.balance)}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );

    // =====================================================
    // TAB 2 CONTENT: PENDING PAYMENTS
    // =====================================================
    const pendingPaymentsTabContent = (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Total Pending</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                            {formatNumber(Math.abs(calculatedTotalPending))}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Pending Orders</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {filteredPendingBalances.filter(b => b.status !== 'paid').length}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <CardTitle>Pending Payments</CardTitle>
                            <CardDescription>Orders that need payment</CardDescription>
                        </div>
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <Input
                                placeholder="Search reference number..."
                                className="pl-9 w-full sm:w-64 border-slate-200 focus:ring-app-accent/20"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {pendingBalancesLoading ? (
                        <div className="p-8 flex items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                            <span className="ml-2 text-slate-600">Loading pending balances...</span>
                        </div>
                    ) : pendingBalances.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">
                            <p>No pending payment records found.</p>
                            <p className="text-xs mt-2">No confirmed dispatch orders available.</p>
                        </div>
                    ) : filteredPendingBalances.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">
                            <p>No results found for your search.</p>
                            <p className="text-xs mt-2">Try a different reference number.</p>
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
                                        <th className="px-4 py-3 text-right">Return</th>
                                        <th className="px-4 py-3 text-right">Remaining</th>
                                        <th className="px-4 py-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-app-border bg-white">
                                    {filteredPendingBalances.map((row) => {
                                        const statusConfig = {
                                            paid: { label: 'Paid', className: 'bg-green-100 text-green-800' },
                                            partial: { label: 'Partial', className: 'bg-orange-100 text-orange-800' },
                                            pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800' }
                                        };
                                        const config = statusConfig[row.status] || statusConfig.pending;

                                        return (
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
                                                    <span className="font-semibold tabular-nums">
                                                        {formatNumber(row.grossTotal || row.totalValue || ((row.totalAmount || 0) + (row.discount || 0) + (row.returnAmount || 0)))}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <span className="tabular-nums text-slate-600">{formatNumber(row.discount || 0)}</span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <span className="tabular-nums text-green-600 font-medium">
                                                        {formatNumber(row.bankPaid || 0)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <span className="tabular-nums text-green-600 font-medium">
                                                        {formatNumber(row.cashPaid || 0)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <span className="tabular-nums text-orange-600 font-medium">
                                                        {formatNumber(row.returnAmount || 0)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <span className={`tabular-nums font-semibold ${(row.amount || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                        {formatNumber(Math.abs(row.amount || 0))}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Badge className={config.className}>
                                                        {config.label}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );

    // =====================================================
    // TAB 3 CONTENT: PAYMENT HISTORY
    // =====================================================
    const paymentHistoryTabContent = (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Total Payments</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {formatNumber(paymentSummary.total)}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Cash Payments</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatNumber(paymentSummary.cash)}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Bank Payments</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatNumber(paymentSummary.bank)}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Payments This Month</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {paymentSummary.countThisMonth}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <CardTitle>Payment History</CardTitle>
                            <CardDescription>All payments received</CardDescription>
                        </div>
                        <div className="w-[200px]">
                            <Label htmlFor="payment-method-filter" className="sr-only">Payment Method</Label>
                            <Select
                                id="payment-method-filter"
                                value={paymentHistoryMethodFilter}
                                onChange={(e) => setPaymentHistoryMethodFilter(e.target.value)}
                            >
                                <option value="all">All Methods</option>
                                <option value="cash">Cash</option>
                                <option value="bank">Bank</option>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {ledgerLoading ? (
                        <div className="p-12 flex items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                            <span className="ml-2 text-slate-600">Loading payment history...</span>
                        </div>
                    ) : paymentHistoryTransactions.length === 0 ? (
                        <div className="p-12 text-center text-slate-500">
                            <p>No payment history found</p>
                            {paymentHistoryMethodFilter !== 'all' && (
                                <button
                                    className="mt-4 text-sm text-blue-600 hover:underline"
                                    onClick={() => setPaymentHistoryMethodFilter('all')}
                                >
                                    Clear Filter
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-hidden rounded-xl border border-app-border">
                            <table className="min-w-full divide-y divide-app-border text-sm">
                                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    <tr>
                                        <th className="px-4 py-3">Date</th>
                                        <th className="px-4 py-3">Reference</th>
                                        <th className="px-4 py-3">Method</th>
                                        <th className="px-4 py-3 text-right">Amount</th>
                                        <th className="px-4 py-3">Notes</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-app-border bg-white">
                                    {paymentHistoryTransactions.map((row) => (
                                        <tr key={row.id} className="hover:bg-slate-50">
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                {row.date ? new Date(row.date).toLocaleDateString('en-GB') : "-"}
                                            </td>
                                            <td className="px-4 py-3">
                                                {row.referenceId ? (
                                                    <button
                                                        onClick={() => router.push(`/dispatch-orders/${row.referenceId}`)}
                                                        className="font-medium text-blue-600 hover:underline cursor-pointer text-left"
                                                    >
                                                        {row.reference || '-'}
                                                    </button>
                                                ) : (
                                                    <span className="font-medium">{row.reference || '-'}</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge
                                                    variant="outline"
                                                    className={row.paymentMethod === 'cash' ? 'border-green-500 text-green-700' : 'border-blue-500 text-blue-700'}
                                                >
                                                    {row.paymentMethod === 'cash' ? 'Cash' : 'Bank'}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <span className="tabular-nums font-semibold text-green-600">
                                                    {formatNumber(row.amount)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-sm text-slate-600">
                                                    {row.notes && row.notes.length > 50 ? row.notes.substring(0, 50) + '...' : row.notes || '-'}
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
        </div>
    );

    // =====================================================
    // TABS CONFIGURATION
    // =====================================================
    const tabs = [
        {
            label: "Ledger",
            content: ledgerTabContent,
        },
        {
            label: "Pending Payments",
            content: pendingPaymentsTabContent,
        },
        {
            label: "Payment History",
            content: paymentHistoryTabContent,
        },
    ];

    return (
        <div className="mx-auto max-w-7xl space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Supplier Ledger</h1>
                    <p className="mt-2 text-slate-500">
                        View your complete transaction history, outstanding balances, and payment status.
                    </p>
                </div>
            </div>

            <Tabs
                tabs={tabs}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                className="p-1"
            />
        </div>
    );
}
