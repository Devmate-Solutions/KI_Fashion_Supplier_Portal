"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import clsx from "clsx";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
// QR Code functionality temporarily disabled
// import QRCodeDisplay from "@/components/dispatch-order/QRCodeDisplay";
// import { getDispatchOrderWithQRCode, generateQRCode } from "@/lib/api/dispatchOrders";
// import { generateQRCodePDF } from "@/lib/utils/pdfGenerator";
import { getDispatchOrderWithQRCode } from "@/lib/api/dispatchOrders";
import { getReturnsByDispatchOrder } from "@/lib/api/returns";
import { currency } from "@/lib/utils/currency";

const STATUS_VARIANTS = {
  pending: "warning",
  confirmed: "info",
  picked_up: "info",
  in_transit: "info",
  delivered: "success",
  cancelled: "danger",
};

export default function DispatchOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id;
  // QR Code functionality temporarily disabled
  // const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  // const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const {
    data: dispatchOrder,
    isLoading,
    error,
    mutate,
  } = useSWR(orderId ? `dispatch-order-${orderId}` : null, () =>
    getDispatchOrderWithQRCode(orderId)
  );

  // Fetch returns for this dispatch order
  const { data: returns, isLoading: isLoadingReturns } = useSWR(
    orderId ? `returns-dispatch-order-${orderId}` : null,
    () => getReturnsByDispatchOrder(orderId)
  );

  // Calculate order totals with returns adjustments
  const orderCalculations = useMemo(() => {
    if (!dispatchOrder?.items || dispatchOrder.items.length === 0) {
      return {
        itemCount: 0,
        totalQuantity: 0,
        grandTotal: 0,
        adjustedTotalQuantity: 0,
        adjustedGrandTotal: 0,
        itemsWithSubtotals: [],
      };
    }

    // Aggregate returned quantities and values by item index
    const returnAdjustments = {};
    if (returns && Array.isArray(returns)) {
      returns.forEach((returnDoc) => {
        if (returnDoc.items && Array.isArray(returnDoc.items)) {
          returnDoc.items.forEach((returnItem) => {
            const itemIndex = returnItem.itemIndex;
            if (itemIndex !== undefined && itemIndex !== null) {
              if (!returnAdjustments[itemIndex]) {
                returnAdjustments[itemIndex] = {
                  returnedQuantity: 0,
                  returnedValue: 0,
                };
              }
              returnAdjustments[itemIndex].returnedQuantity +=
                returnItem.returnedQuantity || 0;
              // Use landedPrice if available, otherwise costPrice
              const returnPrice =
                returnItem.landedPrice || returnItem.costPrice || 0;
              returnAdjustments[itemIndex].returnedValue +=
                (returnItem.returnedQuantity || 0) * returnPrice;
            }
          });
        }
      });
    }

    const itemsWithSubtotals = dispatchOrder.items.map((item, index) => {
      const originalQuantity = item.quantity || 0;
      const originalCostPrice = item.costPrice || 0;
      const originalSubtotal = originalQuantity * originalCostPrice;

      // Get return adjustments for this item (by index)
      const adjustments = returnAdjustments[index] || {
        returnedQuantity: 0,
        returnedValue: 0,
      };

      // Calculate adjusted values
      const adjustedQuantity = Math.max(
        0,
        originalQuantity - adjustments.returnedQuantity
      );
      const adjustedSubtotal = originalSubtotal - adjustments.returnedValue;

      return {
        ...item,
        subtotal: originalSubtotal,
        originalQuantity,
        originalSubtotal,
        adjustedQuantity,
        adjustedSubtotal,
        returnedQuantity: adjustments.returnedQuantity,
        returnedValue: adjustments.returnedValue,
      };
    });

    const grandTotal = itemsWithSubtotals.reduce(
      (sum, item) => sum + item.subtotal,
      0
    );
    const totalQuantity = dispatchOrder.items.reduce(
      (sum, item) => sum + (item.quantity || 0),
      0
    );

    // Calculate adjusted totals
    const adjustedGrandTotal = itemsWithSubtotals.reduce(
      (sum, item) => sum + (item.adjustedSubtotal || item.subtotal),
      0
    );
    const adjustedTotalQuantity = itemsWithSubtotals.reduce(
      (sum, item) => sum + (item.adjustedQuantity || item.quantity || 0),
      0
    );

    return {
      itemCount: dispatchOrder.items.length,
      totalQuantity,
      grandTotal,
      adjustedTotalQuantity,
      adjustedGrandTotal,
      totalReturnedQuantity: Object.values(returnAdjustments).reduce(
        (sum, adj) => sum + adj.returnedQuantity,
        0
      ),
      totalReturnedValue: Object.values(returnAdjustments).reduce(
        (sum, adj) => sum + adj.returnedValue,
        0
      ),
      itemsWithSubtotals,
    };
  }, [dispatchOrder, returns]);

  // QR Code functionality temporarily disabled
  // const handleGenerateQR = async () => {
  //   setIsGeneratingQR(true);
  //   try {
  //     await generateQRCode(orderId);
  //     mutate();
  //   } catch (err) {
  //     console.error("Error generating QR code:", err);
  //     alert(err.message || "Failed to generate QR code");
  //   } finally {
  //     setIsGeneratingQR(false);
  //   }
  // };

  // const handleDownloadPDF = async (size) => {
  //   if (!dispatchOrder?.qrCode?.dataUrl) {
  //     alert("QR code not available. Please generate it first.");
  //     return;
  //   }

  //   setIsGeneratingPDF(true);
  //   try {
  //     await generateQRCodePDF(
  //       dispatchOrder.qrCode.dataUrl,
  //       dispatchOrder.orderNumber || "N/A",
  //       dispatchOrder.totalBoxes || 1,
  //       size
  //     );
  //   } catch (err) {
  //     console.error("Error generating PDF:", err);
  //     alert(err.message || "Failed to generate PDF");
  //   } finally {
  //     setIsGeneratingPDF(false);
  //   }
  // };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-slate-600">Loading dispatch order...</p>
      </div>
    );
  }

  if (error || !dispatchOrder) {
    return (
      <div className="space-y-4">
        <Alert
          variant="error"
          title="Error"
          description={error?.message || "Dispatch order not found"}
        />
        <Button onClick={() => router.push("/dispatch-orders")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Orders
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full border border-slate-200 bg-white shadow-sm hover:bg-slate-50"
            onClick={() => router.push("/dispatch-orders")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Order #{dispatchOrder.orderNumber || "N/A"}
              </h1>
              <Badge
                variant={STATUS_VARIANTS[dispatchOrder.status] || "warning"}
                className="capitalize py-1 px-3 rounded-full text-[10px] font-bold tracking-wider shadow-sm ring-1 ring-inset ring-black/5"
              >
                {dispatchOrder.status || "pending"}
              </Badge>
            </div>
            <p className="text-sm font-medium text-slate-500 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-300"></span>
              Generated on{" "}
              {new Date(dispatchOrder.createdAt).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 border-slate-200 text-slate-500 hover:text-app-accent hover:bg-slate-50"
            onClick={() => mutate()}
            disabled={isLoading}
          >
            <RefreshCw
              className={clsx("h-4 w-4", isLoading && "animate-spin")}
            />
          </Button>
          {dispatchOrder.status === "pending" && (
            <Button
              onClick={() => router.push(`/dispatch-orders/${orderId}/edit`)}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold h-10 px-6 rounded-xl shadow-lg shadow-slate-900/10"
            >
              Modify Order
            </Button>
          )}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 block">
            Dispatch Date
          </span>
          <p className="text-lg font-bold text-slate-900">
            {dispatchOrder.dispatchDate
              ? new Date(dispatchOrder.dispatchDate).toLocaleDateString(
                  "en-GB",
                  { day: "2-digit", month: "short", year: "numeric" }
                )
              : "Not scheduled"}
          </p>
        </div>
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 block">
            Logistics Partner
          </span>
          <p className="text-lg font-bold text-slate-900 truncate">
            {dispatchOrder.logisticsCompany?.name || "Self-managed"}
          </p>
        </div>
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 block">
            Qty
          </span>
          <p className="text-lg font-bold text-slate-900">
            {orderCalculations.totalQuantity}
          </p>
        </div>
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 block">
            Boxes
          </span>
          <p className="text-lg font-bold text-slate-900">
            {dispatchOrder.totalBoxes || 0}
          </p>
        </div>
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 block">
            Total Value
          </span>
          <p className="text-lg font-bold text-indigo-600">
            {currency(orderCalculations.grandTotal)}
          </p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-none shadow-md shadow-slate-200/50 overflow-hidden">
            <CardHeader className="border-b border-slate-50 bg-slate-50/50 pb-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Manifest Items</CardTitle>
                  <CardDescription>
                    {orderCalculations.itemCount} distinct product variants
                    included
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/30">
                      <th className="px-6 py-4 font-semibold text-slate-900">
                        Product Details
                      </th>
                      <th className="px-6 py-4 font-semibold text-slate-900 text-right">
                        Quantity
                      </th>
                      <th className="px-6 py-4 font-semibold text-slate-900 text-right">
                        Unit Price
                      </th>
                      <th className="px-6 py-4 font-semibold text-slate-900 text-right">
                        Return Value
                      </th>
                      <th className="px-6 py-4 font-semibold text-slate-900 text-right">
                        Subtotal
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {orderCalculations.itemsWithSubtotals.map((item, index) => {
                      const imageUrl =
                        item.product?.images?.[0] || item.productImage || null;

                      return (
                        <tr
                          key={index}
                          className="group transition-colors hover:bg-slate-50/50"
                        >
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-4">
                              <div className="h-12 w-12 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm">
                                {imageUrl ? (
                                  <img
                                    src={imageUrl}
                                    alt=""
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <span className="text-[8px] font-bold text-slate-300 uppercase">
                                    No Image
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="font-bold text-slate-900 truncate">
                                  {item.productName || "Product"}
                                </span>
                                <span className="text-[11px] text-slate-500 font-mono mt-0.5">
                                  {item.productCode} • {item.size || "FS"}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5 text-right font-bold text-slate-900">
                            {item.adjustedQuantity !== undefined &&
                            item.adjustedQuantity !== item.originalQuantity ? (
                              <div className="flex flex-col items-end">
                                <span className="text-[10px] text-slate-300 line-through">
                                  {item.originalQuantity}
                                </span>
                                <span className="text-red-500">
                                  {item.adjustedQuantity}
                                </span>
                              </div>
                            ) : (
                              <span>{item.quantity}</span>
                            )}
                          </td>
                          <td className="px-6 py-5 text-right font-medium text-slate-500">
                            {currency(item.costPrice || 0)}
                          </td>
                          <td className="px-6 py-5 text-right font-medium text-red-600">
                            {item.returnedValue > 0
                              ? currency(item.returnedValue)
                              : "—"}
                          </td>
                          <td className="px-6 py-5 text-right font-bold text-slate-900">
                            {item.adjustedSubtotal !== undefined &&
                            item.adjustedSubtotal !== item.originalSubtotal ? (
                              <div className="flex flex-col items-end">
                                <span className="text-[10px] text-slate-300 line-through">
                                  {currency(item.originalSubtotal)}
                                </span>
                                <span className="text-red-500">
                                  {currency(item.adjustedSubtotal)}
                                </span>
                              </div>
                            ) : (
                              <span>{currency(item.subtotal)}</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="border-none shadow-md shadow-slate-200/50 overflow-hidden">
            <CardHeader className="p-8 border-b border-slate-50">
              <CardTitle className="text-lg">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium text-slate-500">
                    Gross Subtotal
                  </span>
                  <span className="font-bold text-slate-900">
                    {currency(orderCalculations.grandTotal)}
                  </span>
                </div>

                {orderCalculations.totalReturnedValue > 0 && (
                  <div className="flex justify-between items-center text-sm bg-red-50 p-3 rounded-xl border border-red-100 border-dashed">
                    <span className="font-bold text-red-600">Return Value</span>
                    <span className="font-bold text-red-600">
                      -{currency(orderCalculations.totalReturnedValue)}
                    </span>
                  </div>
                )}

                <div className="pt-4 border-t border-slate-100 flex justify-between items-end">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">
                      Final Settlement
                    </span>
                    <span className="text-3xl font-black tracking-tight text-slate-900">
                      {currency(orderCalculations.adjustedGrandTotal)}
                    </span>
                  </div>
                </div>
              </div>

              {dispatchOrder.trackingInfo?.trackingNumber && (
                <div className="pt-6 border-t border-slate-100">
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">
                      Carrier Tracking
                    </span>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-900">
                        {dispatchOrder.trackingInfo.carrier}
                      </span>
                      <span className="text-xs font-mono font-bold bg-white px-2 py-1 rounded border border-slate-200">
                        {dispatchOrder.trackingInfo.trackingNumber}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* <div className="bg-indigo-600 rounded-3xl p-8 text-white shadow-xl shadow-indigo-200 relative overflow-hidden group">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
            <h4 className="text-lg font-bold mb-2">Need a copy?</h4>
            <p className="text-indigo-100 text-sm mb-6 leading-relaxed">
              Download the official delivery challan for your records or physical shipment.
            </p>
            <Button className="w-full bg-white text-indigo-600 font-bold hover:bg-indigo-50 shadow-none">
              Download Challan PDF
            </Button>
          </div> */}
        </div>
      </div>
    </div>
  );
}
