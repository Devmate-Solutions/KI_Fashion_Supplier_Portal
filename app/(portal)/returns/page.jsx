"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { Filter, RefreshCcw, Search, Eye } from "lucide-react";
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
    <div className="mx-auto max-w-7xl space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Returns Management</h1>
          <p className="mt-2 text-slate-500">
            Monitor and review inventory returned from your dispatch orders.
          </p>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:shadow-md">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Return Shipments</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{filteredReturns.length}</p>
        </div>
        <div className="rounded-2xl border border-orange-100 bg-orange-50/30 p-5 shadow-sm transition-all hover:shadow-md">
          <p className="text-[10px] font-bold uppercase tracking-widest text-orange-500">Accumulated Return Value</p>
          <p className="mt-1 text-2xl font-bold text-orange-600">{currency(totalValue)}</p>
        </div>
      </div>

      <Card className="border-none shadow-md shadow-slate-200/50 overflow-hidden">
        <CardHeader className="border-b border-slate-50 bg-slate-50/50 pb-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg">Return History</CardTitle>
              <CardDescription>Detailed log of all returned items and values</CardDescription>
            </div>
            
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full sm:w-40 border-slate-200 pl-3 h-10 text-xs font-medium"
                  />
                  <span className="absolute -top-2 left-2 bg-white px-1 text-[10px] font-bold text-slate-400">From</span>
                </div>
                <div className="relative">
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full sm:w-40 border-slate-200 pl-3 h-10 text-xs font-medium"
                  />
                  <span className="absolute -top-2 left-2 bg-white px-1 text-[10px] font-bold text-slate-400">To</span>
                </div>
              </div>
              
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Order or Return ID..."
                  className="pl-9 w-full sm:w-56 border-slate-200 h-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
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
        </CardHeader>
        
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <RefreshCcw className="h-8 w-8 animate-spin text-app-accent/20" />
              <p className="mt-4 text-sm font-medium text-slate-400">Loading history...</p>
            </div>
          ) : filteredReturns.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                <RefreshCcw className="h-8 w-8 text-slate-200" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">No returns recorded</h3>
              <p className="mt-1 text-sm text-slate-500 max-w-xs">
                {returns.length === 0 
                  ? "Inventory returns from KL Fashion will be listed here." 
                  : "No returns match your current date range or search filters."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/30">
                    <th className="px-6 py-4 font-semibold text-slate-900">Return Ref</th>
                    <th className="px-6 py-4 font-semibold text-slate-900">Dispatch Order</th>
                    <th className="px-6 py-4 font-semibold text-slate-900">Date</th>
                    <th className="px-6 py-4 font-semibold text-slate-900">Items Count</th>
                    <th className="px-6 py-4 font-semibold text-slate-900 text-right">Return Value</th>
                    <th className="px-6 py-4 font-semibold text-slate-900 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredReturns.map((returnDoc) => (
                    <tr key={returnDoc._id} className="group transition-colors hover:bg-slate-50/50">
                      <td className="px-6 py-4">
                        <span className="font-mono text-[11px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                          #{returnDoc._id ? String(returnDoc._id).slice(-8).toUpperCase() : "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 group-hover:text-app-accent transition-colors">
                            {returnDoc.dispatchOrder?.orderNumber || "—"}
                          </span>
                          {returnDoc.dispatchOrder?._id && (
                            <Link
                              href={`/dispatch-orders/${returnDoc.dispatchOrder._id}`}
                              className="text-[10px] font-bold text-blue-500 hover:text-blue-700 uppercase tracking-tight mt-0.5"
                            >
                              View Dispatch →
                            </Link>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-medium">
                        {returnDoc.returnedAt
                          ? new Date(returnDoc.returnedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                          : "—"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-slate-900 font-bold">
                            {returnDoc.items?.reduce((sum, item) => sum + (item.returnedQuantity || 0), 0) || 0} units
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            Across {returnDoc.items?.length || 0} SKU(s)
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-orange-600 font-bold">
                          {currency(returnDoc.totalReturnValue || 0)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button asChild size="sm" variant="ghost" className="h-8 rounded-lg px-3 text-xs font-semibold text-slate-600 hover:text-app-accent hover:bg-app-accent/5">
                          <Link href={`/returns/${returnDoc._id}`} className="flex items-center gap-1.5">
                            <Eye className="h-3.5 w-3.5" />
                            Details
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

