"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import clsx from "clsx";
import { Filter, RefreshCcw, Search, Eye, ClipboardList } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { getPurchaseOrders } from "@/lib/api/purchases";
import { currency } from "@/lib/utils/currency";

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "shipped", label: "Dispatched" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

const STATUS_VARIANTS = {
  pending: "warning",
  shipped: "info",
  delivered: "success",
  cancelled: "danger",
};

export default function PurchaseOrdersPage() {
  const { user } = useAuth();
  const supplierId = user?.supplierId || user?.supplier?.id;

  const [statusFilter, setStatusFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const {
    data: purchaseOrdersResponse,
    isLoading,
    mutate,
  } = useSWR(
    supplierId ? ["purchase-orders", supplierId] : null,
    () =>
      getPurchaseOrders({
        supplier: supplierId,
        limit: 100,
      })
  );

  const purchaseOrders = purchaseOrdersResponse?.data ?? [];
  const deliveryMetrics = useMemo(() => {
    if (purchaseOrdersResponse?.metrics) {
      const { pending = 0, shipped = 0, delivered = 0, cancelled = 0 } =
        purchaseOrdersResponse.metrics;
      return {
        pending,
        shipped,
        delivered,
        cancelled,
        total: pending + shipped + delivered + cancelled,
      };
    }

    return purchaseOrders.reduce(
      (acc, order) => {
        acc.total += 1;
        if (order.deliveryStatus && acc[order.deliveryStatus] !== undefined) {
          acc[order.deliveryStatus] += 1;
        }
        return acc;
      },
      { total: 0, pending: 0, shipped: 0, delivered: 0, cancelled: 0 }
    );
  }, [purchaseOrders, purchaseOrdersResponse]);

  const filteredOrders = useMemo(() => {
    if (!purchaseOrders) return [];

    return purchaseOrders.filter((order) => {
      const statusMatch = statusFilter ? order.deliveryStatus === statusFilter : true;
      const term = searchTerm.trim().toLowerCase();
      const searchMatch = term
        ? [order.purchaseNumber, order.invoiceNumber, order.supplier?.name]
            .filter(Boolean)
            .some((field) => field.toLowerCase().includes(term))
        : true;

      return statusMatch && searchMatch;
    });
  }, [purchaseOrders, statusFilter, searchTerm]);

  return (
    <div className="mx-auto max-w-7xl space-y-8 animate-in fade-in duration-500">
      {!supplierId && (
        <Alert
          variant="warning"
          title="Supplier link required"
          description="Please contact support to link your login to a supplier record before accessing purchase orders."
        />
      )}
      
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Purchase Orders</h1>
          <p className="mt-2 text-slate-500">
            Fulfill and track orders requested by KL Fashion.
          </p>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:shadow-md">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Awaiting Action</p>
          <p className="mt-1 text-2xl font-bold text-amber-600">{deliveryMetrics.pending}</p>
        </div>
        <div className="rounded-2xl border border-blue-100 bg-blue-50/30 p-5 shadow-sm transition-all hover:shadow-md">
          <p className="text-[10px] font-bold uppercase tracking-widest text-blue-500">In Transit</p>
          <p className="mt-1 text-2xl font-bold text-blue-600">{deliveryMetrics.shipped}</p>
        </div>
        <div className="rounded-2xl border border-green-100 bg-green-50/30 p-5 shadow-sm transition-all hover:shadow-md">
          <p className="text-[10px] font-bold uppercase tracking-widest text-green-500">Delivered</p>
          <p className="mt-1 text-2xl font-bold text-green-600">{deliveryMetrics.delivered}</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 shadow-sm transition-all hover:shadow-md">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Orders</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{deliveryMetrics.total}</p>
        </div>
      </div>

      <Card className="border-none shadow-md shadow-slate-200/50 overflow-hidden">
        <CardHeader className="border-b border-slate-50 bg-slate-50/50 pb-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg">Order Inbox</CardTitle>
              <CardDescription>Track and manage incoming purchase requests</CardDescription>
            </div>
            
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search PO number..."
                  className="pl-9 w-full sm:w-64 border-slate-200 focus:ring-app-accent/20"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex items-center gap-2">
                <div className="relative flex-1 sm:flex-initial">
                  <Filter className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <select
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-8 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-app-accent/20 md:w-auto"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 border-slate-200 text-slate-500 hover:text-app-accent hover:bg-slate-50"
                  onClick={() => mutate()}
                  disabled={isLoading}
                >
                  <RefreshCcw className={clsx("h-4 w-4", isLoading && "animate-spin")} />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <RefreshCcw className="h-8 w-8 animate-spin text-app-accent/20" />
              <p className="mt-4 text-sm font-medium text-slate-400">Syncing orders...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                <ClipboardList className="h-8 w-8 text-slate-200" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">No purchase orders</h3>
              <p className="mt-1 text-sm text-slate-500 max-w-xs">
                {purchaseOrders.length === 0 
                  ? "When KL Fashion requests inventory, they will appear here." 
                  : "Try adjusting your filters to find specific orders."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/30">
                    <th className="px-6 py-4 font-semibold text-slate-900">PO Number</th>
                    <th className="px-6 py-4 font-semibold text-slate-900">Dates</th>
                    <th className="px-6 py-4 font-semibold text-slate-900">Status</th>
                    <th className="px-6 py-4 font-semibold text-slate-900">Logistics</th>
                    <th className="px-6 py-4 font-semibold text-slate-900 text-right">Grand Total</th>
                    <th className="px-6 py-4 font-semibold text-slate-900 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredOrders.map((order) => (
                    <tr key={order._id} className="group transition-colors hover:bg-slate-50/50">
                      <td className="px-6 py-4">
                        <span className="font-mono font-bold text-slate-900 group-hover:text-app-accent transition-colors">
                          {order.purchaseNumber}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-slate-700 font-medium">
                            {order.purchaseDate ? new Date(order.purchaseDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : "—"}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">
                            Exp: {order.expectedDeliveryDate ? new Date(order.expectedDeliveryDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : "—"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge 
                          variant={STATUS_VARIANTS[order.deliveryStatus] || "warning"}
                          className="capitalize py-1 px-2.5 rounded-full text-[11px] font-bold tracking-wide shadow-sm ring-1 ring-inset ring-black/5"
                        >
                          {order.deliveryStatus || "pending"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        {order.fulfillment?.trackingNumber ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="text-slate-700 font-medium text-xs">{order.fulfillment.carrier}</span>
                            <span className="text-[10px] font-mono text-slate-400">{order.fulfillment.trackingNumber}</span>
                          </div>
                        ) : (
                          <span className="text-xs italic text-slate-400">Not dispatched</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-slate-900 font-bold">
                          {order.grandTotal ? currency(order.grandTotal) : "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button asChild size="sm" variant="ghost" className="h-8 rounded-lg px-3 text-xs font-semibold text-slate-600 hover:text-app-accent hover:bg-app-accent/5">
                          <Link href={`/purchase-orders/${order._id}`} className="flex items-center gap-1.5">
                            <Eye className="h-3.5 w-3.5" />
                            Open
                          </Link>
                        </Button>
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
}
