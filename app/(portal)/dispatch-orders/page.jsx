"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import clsx from "clsx";
// QR Code functionality temporarily disabled - QrCode icon commented out
import { Filter, RefreshCcw, Plus, /* QrCode, */ Pencil, Trash2, Eye, Truck, Search, Package, Clock, CheckCircle2 } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { getDispatchOrders, deleteDispatchOrder, updateDispatchOrder } from "@/lib/api/dispatchOrders";
import { useRouter } from "next/navigation";
import { handleApiError, showSuccess } from "@/lib/utils/toast";

const STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
];

const STATUS_VARIANTS = {
  pending: "warning",
  confirmed: "info",
  picked_up: "info",
  in_transit: "info",
  delivered: "success",
  cancelled: "danger",
};

export default function DispatchOrdersPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [statusFilter, setStatusFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingOrderId, setDeletingOrderId] = useState(null);
  const [error, setError] = useState(null);

  const {
    data: dispatchOrdersResponse,
    isLoading,
    mutate,
  } = useSWR(
    "dispatch-orders",
    () => getDispatchOrders({ limit: 100 })
  );

  const dispatchOrders = dispatchOrdersResponse?.data || dispatchOrdersResponse || [];

  const statusMetrics = useMemo(() => {
    return dispatchOrders.reduce(
      (acc, order) => {
        acc.total += 1;
        const status = order.status?.toLowerCase() || 'pending';
        if (status === 'pending') {
          acc.pending += 1;
        } else if (status === 'confirmed') {
          acc.confirmed += 1;
        }
        return acc;
      },
      { total: 0, pending: 0, confirmed: 0 }
    );
  }, [dispatchOrders]);

  const filteredOrders = useMemo(() => {
    if (!dispatchOrders) return [];

    return dispatchOrders.filter((order) => {
      const statusMatch = statusFilter ? order.status === statusFilter : true;
      const term = searchTerm.trim().toLowerCase();
      const searchMatch = term
        ? [order.orderNumber, order.logisticsCompany?.name]
          .filter(Boolean)
          .some((field) => field.toLowerCase().includes(term))
        : true;

      return statusMatch && searchMatch;
    });
  }, [dispatchOrders, statusFilter, searchTerm]);

  const handleDelete = async (orderId) => {
    if (!confirm('Are you sure you want to delete this dispatch order? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingOrderId(orderId);
      await deleteDispatchOrder(orderId);
      await mutate();
      showSuccess('Dispatch order deleted successfully');
    } catch (err) {
      console.error('Error deleting dispatch order:', err);
      handleApiError(err, 'Failed to delete dispatch order');
    } finally {
      setDeletingOrderId(null);
    }
  };

  const handleEdit = (orderId) => {
    router.push(`/dispatch-orders/${orderId}/edit`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900">Dispatch Orders</h1>
          <p className="mt-2 text-sm text-slate-600">
            Monitor and manage your outbound shipments to KI Fashion.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Button asChild className="bg-app-accent hover:bg-app-accent/90 shadow-sm rounded-md min-h-[44px] px-5">
            <Link href="/dispatch-orders/create" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Dispatch Order
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card className="border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Total Orders</p>
                <p className="text-3xl font-bold text-slate-900">{statusMetrics.total}</p>
              </div>
              <div className="h-11 w-11 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                <Package className="h-5 w-5 text-slate-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-amber-200 bg-amber-50/50 shadow-sm hover:shadow-md transition-all duration-200">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 mb-2">Pending Approval</p>
                <p className="text-3xl font-bold text-amber-700">{statusMetrics.pending}</p>
              </div>
              <div className="h-11 w-11 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-app-accent/20 bg-app-accent/5 shadow-sm hover:shadow-md transition-all duration-200">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-app-accent mb-2">Confirmed</p>
                <p className="text-3xl font-bold text-app-accent">{statusMetrics.confirmed}</p>
              </div>
              <div className="h-11 w-11 rounded-lg bg-app-accent/15 border border-app-accent/20 flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-5 w-5 text-app-accent" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="border-b border-slate-100 bg-slate-50/30 pb-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg font-semibold text-slate-900">Order Registry</CardTitle>
              <CardDescription className="text-sm text-slate-600">Filter and search your order history</CardDescription>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search order number..."
                  className="pl-9 w-full sm:w-64 border-slate-200 focus:ring-app-accent focus:border-app-accent rounded-md"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1 sm:flex-initial">
                  <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <select
                    className="h-10 w-full rounded-md border border-slate-200 bg-white pl-9 pr-8 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-app-accent focus:border-app-accent md:w-auto cursor-pointer"
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
                  className="h-10 w-10 border-slate-200 text-slate-500 hover:text-app-accent hover:bg-app-accent/10 hover:border-app-accent rounded-md transition-colors"
                  onClick={() => mutate()}
                  disabled={isLoading}
                  title="Refresh data"
                >
                  <RefreshCcw className={clsx("h-4 w-4", isLoading && "animate-spin")} />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <RefreshCcw className="h-8 w-8 animate-spin text-app-accent" />
              <p className="mt-4 text-sm font-medium text-slate-600">Loading orders...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-20 w-20 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center mb-5">
                <Truck className="h-10 w-10 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No orders found</h3>
              <p className="text-sm text-slate-600 max-w-sm mb-6">
                {dispatchOrders.length === 0
                  ? "Get started by creating your first dispatch order to KI Fashion."
                  : "Try adjusting your search or filters to find what you're looking for."}
              </p>
              {dispatchOrders.length === 0 && (
                <Button asChild className="bg-app-accent hover:bg-app-accent/90 shadow-sm rounded-md min-h-[44px] px-6">
                  <Link href="/dispatch-orders/create" className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Create Your First Order
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-auto max-h-[calc(100vh-320px)] -mx-4 md:mx-0">
              <div className="inline-block min-w-full align-middle px-4 md:px-0">
                <table className="w-full text-left text-sm border-collapse">
                  <thead className="sticky top-0 z-10">
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="px-4 md:px-6 py-4 font-semibold text-slate-700 text-xs uppercase tracking-wider">Order Number</th>
                      <th className="px-4 md:px-6 py-4 font-semibold text-slate-700 text-xs uppercase tracking-wider">Product Name</th>
                      <th className="px-4 md:px-6 py-4 font-semibold text-slate-700 text-xs uppercase tracking-wider hidden sm:table-cell">Code</th>
                      <th className="px-4 md:px-6 py-4 font-semibold text-slate-700 text-xs uppercase tracking-wider">Date</th>
                      <th className="px-4 md:px-6 py-4 font-semibold text-slate-700 text-xs uppercase tracking-wider hidden md:table-cell">Logistics</th>
                      <th className="px-4 md:px-6 py-4 font-semibold text-slate-700 text-xs uppercase tracking-wider text-center">Items</th>
                      <th className="px-4 md:px-6 py-4 font-semibold text-slate-700 text-xs uppercase tracking-wider">Status</th>
                      <th className="px-4 md:px-6 py-4 font-semibold text-slate-700 text-xs uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredOrders.map((order) => (
                      <tr key={order._id || order.id} className="group transition-colors hover:bg-slate-50/50">
                        <td className="px-4 md:px-6 py-4">
                          <span className="font-mono font-semibold text-slate-900 group-hover:text-app-accent transition-colors text-sm">
                            {order.orderNumber || "—"}
                          </span>
                        </td>
                        <td className="px-4 md:px-6 py-4">
                          <span className="font-semibold text-slate-900">
                            {order.items?.[0]?.productName || "—"}
                          </span>
                          {order.items && order.items.length > 1 && (
                            <span className="text-xs text-slate-500 ml-1">
                              (+{order.items.length - 1} more)
                            </span>
                          )}
                        </td>
                        <td className="px-4 md:px-6 py-4 hidden sm:table-cell">
                          <span className="text-sm font-mono text-slate-600">
                            {order.items?.[0]?.productCode || "—"}
                          </span>
                        </td>
                        <td className="px-4 md:px-6 py-4 text-slate-600">
                          {order.createdAt
                            ? new Date(order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                            : order.dispatchDate
                              ? new Date(order.dispatchDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                              : "—"}
                        </td>
                        <td className="px-4 md:px-6 py-4 hidden md:table-cell">
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded bg-slate-100 flex items-center justify-center text-[10px] font-semibold text-slate-500 uppercase shrink-0">
                              {order.logisticsCompany?.name?.charAt(0) || "L"}
                            </div>
                            <span className="text-slate-700 font-medium truncate">{order.logisticsCompany?.name || "—"}</span>
                          </div>
                        </td>
                        <td className="px-4 md:px-6 py-4 text-center">
                          <div className="flex flex-col items-center">
                            <span className="text-slate-900 font-semibold">{order.totalQuantity || 0}</span>
                            <span className="text-[10px] text-slate-500 font-medium uppercase tracking-tighter">
                              {order.totalBoxes || 0} Boxes
                            </span>
                          </div>
                        </td>
                        <td className="px-4 md:px-6 py-4">
                          <Badge
                            variant={STATUS_VARIANTS[order.status] || "warning"}
                            className="capitalize py-1 px-2.5 rounded-full text-[11px] font-semibold tracking-wide"
                          >
                            {order.status || "pending"}
                          </Badge>
                        </td>
                        <td className="px-4 md:px-6 py-4">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-9 rounded-md px-3 text-xs font-semibold text-slate-600 hover:text-app-accent hover:bg-app-accent/10 min-w-[44px] transition-colors"
                              onClick={() => router.push(`/dispatch-orders/${order._id || order.id}`)}
                            >
                              <Eye className="h-3.5 w-3.5 mr-1.5" />
                              <span className="hidden sm:inline">View</span>
                            </Button>

                            {order.status === 'pending' && (
                              <>
                                <div className="h-4 w-[1px] bg-slate-200 mx-0.5"></div>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-9 w-9 rounded-md text-slate-400 hover:text-app-accent hover:bg-app-accent/10 min-w-[44px] transition-colors"
                                  onClick={() => handleEdit(order._id || order.id)}
                                  title="Edit order"
                                  aria-label="Edit order"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-9 w-9 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 min-w-[44px] transition-colors"
                                  onClick={() => handleDelete(order._id || order.id)}
                                  disabled={deletingOrderId === (order._id || order.id)}
                                  title="Delete order"
                                  aria-label="Delete order"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

