"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useReturn } from "@/lib/hooks/useReturns";
import Link from "next/link";
import { currency } from "@/lib/utils/currency";

export default function ReturnDetailPage() {
  const params = useParams();
  const router = useRouter();
  const returnId = params?.id;

  const { data: returnDoc, isLoading } = useReturn(returnId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Loading...</h1>
          </div>
        </div>
      </div>
    );
  }

  if (!returnDoc) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Return Not Found</h1>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <p className="text-slate-600">The return you're looking for doesn't exist.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Return Details</h1>
          <p className="mt-1 text-sm text-slate-600">
            Return ID: {returnDoc._id ? String(returnDoc._id).slice(-8) : "—"}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Return Information</CardTitle>
            <CardDescription>Basic details about this return</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-slate-500">Return ID</p>
              <p className="font-mono text-sm font-medium text-slate-900">
                {returnDoc._id ? String(returnDoc._id).slice(-8) : "—"}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Return Date</p>
              <p className="font-medium text-slate-900">
                {returnDoc.returnedAt
                  ? new Date(returnDoc.returnedAt).toLocaleDateString('en-GB')
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Return Value</p>
              <p className="text-lg font-semibold text-slate-900">
                {currency(returnDoc.totalReturnValue || 0)}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Returned By</p>
              <p className="font-medium text-slate-900">
                {returnDoc.returnedBy?.name || "—"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Related Dispatch Order</CardTitle>
            <CardDescription>Dispatch order this return is associated with</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {returnDoc.dispatchOrder?._id ? (
              <>
                <div>
                  <p className="text-sm text-slate-500">Order Number</p>
                  <p className="font-medium text-slate-900">
                    {returnDoc.dispatchOrder?.orderNumber || "—"}
                  </p>
                </div>
                <div>
                  <Button asChild>
                    <Link href={`/dispatch-orders/${returnDoc.dispatchOrder._id}`}>
                      View Dispatch Order
                    </Link>
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-slate-600">No dispatch order linked</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Returned Items</CardTitle>
          <CardDescription>
            {returnDoc.items && returnDoc.items.length > 0 ? (
              <>
                {returnDoc.items.length} item{returnDoc.items.length !== 1 ? "s" : ""} • Total Quantity:{" "}
                {returnDoc.items.reduce((sum, item) => sum + (item.returnedQuantity || 0), 0)}
              </>
            ) : (
              "Items included in this return"
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {returnDoc.items && returnDoc.items.length > 0 ? (
            <div className="overflow-hidden rounded-xl border border-app-border">
              <table className="min-w-full divide-y divide-app-border text-sm">
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Item Index</th>
                    <th className="px-4 py-3 text-right">Original Qty</th>
                    <th className="px-4 py-3 text-right">Returned Qty</th>
                    <th className="px-4 py-3 text-right">Cost Price</th>
                    <th className="px-4 py-3 text-right">Landed Price</th>
                    <th className="px-4 py-3 text-right">Line Total</th>
                    <th className="px-4 py-3">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-app-border bg-white">
                  {returnDoc.items.map((item, idx) => {
                    const lineTotal =
                      (item.landedPrice || item.costPrice || 0) *
                      (item.returnedQuantity || 0);
                    return (
                      <tr key={idx}>
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {item.itemIndex}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-600 tabular-nums">
                          {item.originalQuantity || 0}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-slate-900 tabular-nums">
                          {item.returnedQuantity || 0}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-600 tabular-nums">
                          {currency(item.costPrice || 0)}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-600 tabular-nums">
                          {currency(item.landedPrice || item.costPrice || 0)}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-slate-900 tabular-nums">
                          {currency(lineTotal)}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {item.reason || "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-slate-600">No items in this return</p>
          )}
        </CardContent>
      </Card>

      {returnDoc.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap text-slate-600">
              {returnDoc.notes}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

