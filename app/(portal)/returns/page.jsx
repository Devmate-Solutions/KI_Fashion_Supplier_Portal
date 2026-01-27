"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { RefreshCcw, Search, Eye, Package, DollarSign } from "lucide-react";
import BritishDatePicker from "@/components/BritishDatePicker";
import { useAuth } from "@/components/providers/AuthProvider";
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
import { useReturns } from "@/lib/hooks/useReturns";
import { currency } from "@/lib/utils/currency";

export default function ReturnsPage() {
  const { user } = useAuth();
  const supplierId = user?.supplierId || user?.supplier?.id;

  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const params = useMemo(() => {
    const p = { limit: 100 };
    if (supplierId) {
      p.supplier = supplierId;
    }
    if (startDate) {
      p.startDate = startDate;
    }
    if (endDate) {
      p.endDate = endDate;
    }
    return p;
  }, [supplierId, startDate, endDate]);

  const { data: returns, isLoading, mutate } = useReturns(params);

  const filteredReturns = useMemo(() => {
    if (!returns) return [];

    return returns.filter((returnDoc) => {
      const term = searchTerm.trim().toLowerCase();
      const searchMatch = term
        ? [
          returnDoc.dispatchOrder?.orderNumber,
          returnDoc._id,
        ]
          .filter(Boolean)
          .some((field) => String(field).toLowerCase().includes(term))
        : true;

      return searchMatch;
    });
  }, [returns, searchTerm]);

  const totalValue = useMemo(() => {
    return filteredReturns.reduce(
      (sum, returnDoc) => sum + (returnDoc.totalReturnValue || 0),
      0
    );
  }, [filteredReturns]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900">Returns Management</h1>
          <p className="mt-2 text-sm text-slate-600">
            Monitor and review inventory returned from your dispatch orders.
          </p>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        <Card className="border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Total Return Shipments</p>
                <p className="text-3xl font-bold text-slate-900">{filteredReturns.length}</p>
              </div>
              <div className="h-11 w-11 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                <Package className="h-5 w-5 text-slate-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-orange-200 bg-orange-50/50 shadow-sm hover:shadow-md transition-all duration-200">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-orange-600 mb-2">Accumulated Return Value</p>
                <p className="text-3xl font-bold text-orange-700">{currency(totalValue)}</p>
              </div>
              <div className="h-11 w-11 rounded-lg bg-orange-100 border border-orange-200 flex items-center justify-center shrink-0">
                <DollarSign className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="border-b border-slate-100 bg-slate-50/30 pb-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg font-semibold text-slate-900">Return History</CardTitle>
              <CardDescription className="text-sm text-slate-600">Detailed log of all returned items and values</CardDescription>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex items-end gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">From</label>
                  <BritishDatePicker
                    value={startDate}
                    onChange={(date) => {
                      const dateString = date instanceof Date
                        ? date.toISOString().split('T')[0]
                        : date || "";
                      setStartDate(dateString);
                    }}
                    maxDate={new Date()}
                    className="w-full sm:w-44 border-slate-200 rounded-md h-10 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-app-accent focus:border-app-accent transition-colors"
                    placeholder="DD/MM/YYYY"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">To</label>
                  <BritishDatePicker
                    value={endDate}
                    onChange={(date) => {
                      const dateString = date instanceof Date
                        ? date.toISOString().split('T')[0]
                        : date || "";
                      setEndDate(dateString);
                    }}
                    maxDate={new Date()}
                    minDate={startDate ? new Date(startDate) : null}
                    className="w-full sm:w-44 border-slate-200 rounded-md h-10 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-app-accent focus:border-app-accent transition-colors"
                    placeholder="DD/MM/YYYY"
                  />
                </div>
              </div>

              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Order or Return ID..."
                  className="pl-9 w-full sm:w-56 border-slate-200 rounded-md h-10 focus:ring-app-accent focus:border-app-accent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
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
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <RefreshCcw className="h-8 w-8 animate-spin text-app-accent" />
              <p className="mt-4 text-sm font-medium text-slate-600">Loading history...</p>
            </div>
          ) : filteredReturns.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-20 w-20 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center mb-5">
                <RefreshCcw className="h-10 w-10 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No returns recorded</h3>
              <p className="text-sm text-slate-600 max-w-sm">
                {returns?.length === 0
                  ? "Inventory returns from KL Fashion will be listed here."
                  : "No returns match your current date range or search filters."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 md:mx-0">
              <div className="inline-block min-w-full align-middle px-4 md:px-0">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/50">
                      <th className="px-4 md:px-6 py-4 font-semibold text-slate-700 text-xs uppercase tracking-wider">Return Ref</th>
                      <th className="px-4 md:px-6 py-4 font-semibold text-slate-700 text-xs uppercase tracking-wider">Dispatch Order</th>
                      <th className="px-4 md:px-6 py-4 font-semibold text-slate-700 text-xs uppercase tracking-wider">Date</th>
                      <th className="px-4 md:px-6 py-4 font-semibold text-slate-700 text-xs uppercase tracking-wider hidden sm:table-cell">Items</th>
                      <th className="px-4 md:px-6 py-4 font-semibold text-slate-700 text-xs uppercase tracking-wider">Quantity</th>
                      <th className="px-4 md:px-6 py-4 font-semibold text-slate-700 text-xs uppercase tracking-wider text-right">Return Value</th>
                      <th className="px-4 md:px-6 py-4 font-semibold text-slate-700 text-xs uppercase tracking-wider text-right">Detail</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredReturns.map((returnDoc) => (
                      <tr key={returnDoc._id} className="group transition-colors hover:bg-slate-50/50">
                        <td className="px-4 md:px-6 py-4">
                          <span className="font-mono text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                            #{returnDoc._id ? String(returnDoc._id).slice(-8).toUpperCase() : "—"}
                          </span>
                        </td>
                        <td className="px-4 md:px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-900 group-hover:text-app-accent transition-colors">
                              {returnDoc.dispatchOrder?.orderNumber || "—"}
                            </span>
                            {returnDoc.dispatchOrder?._id && (
                              <Link
                                href={`/dispatch-orders/${returnDoc.dispatchOrder._id}`}
                                className="text-[10px] font-semibold text-app-accent hover:text-app-accent/80 uppercase tracking-tight mt-0.5"
                              >
                                View Dispatch →
                              </Link>
                            )}
                          </div>
                        </td>
                        <td className="px-4 md:px-6 py-4 text-slate-600 font-medium">
                          {returnDoc.returnedAt
                            ? new Date(returnDoc.returnedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                            : "—"}
                        </td>
                        <td className="px-4 md:px-6 py-4 hidden sm:table-cell">
                          <span className="text-slate-900 font-medium">
                            {returnDoc.items?.length || 0} SKU(s)
                          </span>
                        </td>
                        <td className="px-4 md:px-6 py-4">
                          <span className="text-slate-900 font-semibold">
                            {returnDoc.items?.reduce((sum, item) => sum + (item.returnedQuantity || 0), 0) || 0} units
                          </span>
                        </td>
                        <td className="px-4 md:px-6 py-4 text-right">
                          <span className="text-orange-700 font-bold text-sm">
                            {currency(returnDoc.totalReturnValue || 0)}
                          </span>
                        </td>
                        <td className="px-4 md:px-6 py-4 text-right">
                          <Button asChild size="sm" variant="ghost" className="h-9 rounded-md px-3 text-xs font-semibold text-slate-600 hover:text-app-accent hover:bg-app-accent/10 min-w-[44px] transition-colors">
                            <Link href={`/returns/${returnDoc._id}`} className="flex items-center gap-1.5">
                              <Eye className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">Details</span>
                            </Link>
                          </Button>
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

