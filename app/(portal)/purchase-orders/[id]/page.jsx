"use client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  ClipboardCheck,
  PackageCheck,
  ShieldAlert,
  Truck,
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  createQualityCheck,
  getPurchaseOrder,
  updatePurchaseFulfillment,
} from "@/lib/api/purchases";

const QA_FORM_SCHEMA = z.object({
  qaStatus: z.enum(["pass", "fail"], {
    required_error: "Select QA outcome",
  }),
  notes: z.string().optional(),
});

const DISPATCH_FORM_SCHEMA = z.object({
  carrier: z.string().min(1, "Carrier is required"),
  trackingNumber: z.string().min(1, "Tracking number is required"),
  shipmentDate: z.string().min(1, "Shipment date is required"),
  notes: z.string().optional(),
});

const STATUS_VARIANTS = {
  pending: { label: "Pending", variant: "warning", icon: ShieldAlert },
  shipped: { label: "Dispatched", variant: "info", icon: Truck },
  delivered: { label: "Delivered", variant: "success", icon: CheckCircle },
  cancelled: { label: "Cancelled", variant: "danger", icon: ShieldAlert },
};

export default function PurchaseOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const purchaseId = params?.id;

  const [qaFeedback, setQaFeedback] = useState(null);
  const [dispatchFeedback, setDispatchFeedback] = useState(null);
  const [isDispatching, setIsDispatching] = useState(false);
  const [isSubmittingQa, setIsSubmittingQa] = useState(false);

  const {
    data: purchase,
    isLoading,
    mutate,
  } = useSWR(purchaseId ? ["purchase-order", purchaseId] : null, () =>
    getPurchaseOrder(purchaseId)
  );

  const qaForm = useForm({
    resolver: zodResolver(QA_FORM_SCHEMA),
    defaultValues: {
      qaStatus: "pass",
      notes: "",
    },
  });

  const dispatchForm = useForm({
    resolver: zodResolver(DISPATCH_FORM_SCHEMA),
    defaultValues: {
      carrier: "",
      trackingNumber: "",
      shipmentDate: new Date().toISOString().split("T")[0],
      notes: "",
    },
  });

  const statusMeta = useMemo(() => {
    if (!purchase) return STATUS_VARIANTS.pending;
    return STATUS_VARIANTS[purchase.deliveryStatus] || STATUS_VARIANTS.pending;
  }, [purchase]);
  const StatusIcon = statusMeta.icon;

  const canDispatch = purchase?.deliveryStatus === "pending" || purchase?.deliveryStatus === "shipped";
  const canSubmitQa = purchase?.deliveryStatus === "pending";
  const qaHistory = purchase?.qualityChecks || [];
  const recentQaEntries = useMemo(() => {
    if (!qaHistory.length) return [];
    return [...qaHistory].slice(-3).reverse();
  }, [qaHistory]);
  const fulfillmentHistory = useMemo(() => {
    if (!purchase?.fulfillment?.history?.length) return [];
    return [...purchase.fulfillment.history].sort(
      (a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)
    );
  }, [purchase]);
  const deliveryConfirmations = purchase?.deliveryConfirmations || [];

  useEffect(() => {
    if (!purchase?.fulfillment) return;

    dispatchForm.reset({
      carrier: purchase.fulfillment.carrier || "",
      trackingNumber: purchase.fulfillment.trackingNumber || "",
      shipmentDate: purchase.fulfillment.shipmentDate
        ? new Date(purchase.fulfillment.shipmentDate).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      notes: purchase.fulfillment.notes || "",
    });
  }, [purchase, dispatchForm]);

  const handleQaSubmit = qaForm.handleSubmit(async (values) => {
    if (!purchaseId) return;

    try {
      setIsSubmittingQa(true);
      setQaFeedback(null);
      await createQualityCheck(purchaseId, {
        qaStatus: values.qaStatus,
        notes: values.notes,
        checkedAt: new Date().toISOString(),
      });
      setQaFeedback({ type: "success", message: "QA checklist recorded." });
      await mutate();
      qaForm.reset({ qaStatus: values.qaStatus, notes: "" });
    } catch (error) {
      setQaFeedback({
        type: "danger",
        message: error.message || "Unable to save QA results yet.",
      });
    } finally {
      setIsSubmittingQa(false);
    }
  });

  const handleDispatchSubmit = dispatchForm.handleSubmit(async (values) => {
    if (!purchaseId) return;

    try {
      setIsDispatching(true);
      setDispatchFeedback(null);
      await updatePurchaseFulfillment(purchaseId, {
        carrier: values.carrier,
        trackingNumber: values.trackingNumber,
        shipmentDate: values.shipmentDate,
        updatedBy: user?.id,
        deliveryStatus: "shipped",
        notes: values.notes,
      });
      setDispatchFeedback({
        type: "success",
        message: "Dispatch confirmation saved. Delivery status moved to shipped.",
      });
      await mutate();
    } catch (error) {
      setDispatchFeedback({
        type: "danger",
        message: error.message || "Unable to update dispatch status.",
      });
    } finally {
      setIsDispatching(false);
    }
  });

  if (!purchaseId) {
    return (
      <div className="space-y-4">
        <Alert variant="danger" title="Missing purchase order" description="Select a purchase order from the inbox." />
        <Button onClick={() => router.push("/purchase-orders")}>Back to orders</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <Button
            variant="ghost"
            size="sm"
            className="mb-2 gap-2 text-slate-600"
            onClick={() => router.push("/purchase-orders")}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to inbox
          </Button>
          <h1 className="text-2xl font-semibold text-slate-900">
            Purchase order {purchase?.purchaseNumber || "—"}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Match requested quantities, run QA, and dispatch with tracking details.
          </p>
        </div>
        {purchase && (
          <Badge variant={statusMeta.variant} className="h-fit text-sm">
            <StatusIcon className="mr-1 inline h-4 w-4" /> {statusMeta.label}
          </Badge>
        )}
      </div>

      {isLoading && <p className="text-sm text-slate-500">Loading purchase order...</p>}

      {purchase && (
        <>
          <Card>
            <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Order summary</CardTitle>
                <CardDescription>
                  Requested by {purchase.createdBy?.name || "KL Fashion"}
                </CardDescription>
              </div>
              <div className="grid gap-1 text-sm text-slate-600 md:text-right">
                <span className="flex items-center gap-2 md:justify-end">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  Requested on {purchase.purchaseDate ? new Date(purchase.purchaseDate).toLocaleDateString('en-GB') : "—"}
                </span>
                <span className="flex items-center gap-2 font-medium text-slate-900 md:justify-end">
                  <PackageCheck className="h-4 w-4 text-slate-400" />
                  Total PKR {purchase.grandTotal?.toLocaleString() || "0"}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-app-border p-4">
                  <p className="text-xs uppercase text-slate-500">Supplier</p>
                  <p className="mt-1 text-sm font-medium text-slate-900">
                    {purchase.supplier?.name || "Your organization"}
                  </p>
                  <p className="text-xs text-slate-500">{purchase.supplier?.company}</p>
                </div>
                <div className="rounded-lg border border-app-border p-4">
                  <p className="text-xs uppercase text-slate-500">Delivery expectations</p>
                  <p className="mt-1 text-sm font-medium text-slate-900">
                    {purchase.expectedDeliveryDate
                      ? new Date(purchase.expectedDeliveryDate).toLocaleDateString('en-GB')
                      : "Not provided"}
                  </p>
                  <p className="text-xs text-slate-500">
                    Update tracking details once the shipment leaves your warehouse.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Requested items</CardTitle>
              <CardDescription>Confirm picked quantities before scanning QA labels.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-xl border border-app-border">
                <table className="min-w-full divide-y divide-app-border text-sm">
                  <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Product</th>
                      <th className="px-4 py-3">SKU</th>
                      <th className="px-4 py-3 text-right">Qty</th>
                      <th className="px-4 py-3 text-right">Line total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-app-border bg-white">
                    {purchase.items?.map((item) => (
                      <tr key={item._id}>
                        <td className="px-4 py-3 text-slate-700">{item.product?.name || "—"}</td>
                        <td className="px-4 py-3 text-slate-500">{item.product?.sku || item.productCode || "—"}</td>
                        <td className="px-4 py-3 text-right text-slate-600">{item.quantity}</td>
                        <td className="px-4 py-3 text-right text-slate-600">
                          {item.landedTotal ? item.landedTotal.toLocaleString() : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>QA confirmation</CardTitle>
                <CardDescription>
                  Inspect units before marking as dispatch ready.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentQaEntries.length > 0 && (
                    <div className="mb-4 space-y-2 rounded-lg border border-dashed border-app-border p-3 text-xs text-slate-600">
                      <p className="font-semibold text-slate-700">Recent QA checkpoints</p>
                      <ul className="space-y-1">
                        {recentQaEntries.map((entry, index) => (
                          <li key={index} className="flex flex-col gap-1 rounded border border-app-border/60 p-2">
                            <span className="font-medium text-slate-800">
                              {entry.qaStatus === "pass" ? "Pass" : "Needs follow-up"}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              {entry.checkedAt ? new Date(entry.checkedAt).toLocaleString('en-GB') : "—"}
                              {entry.checkedBy?.name ? ` · ${entry.checkedBy.name}` : ""}
                            </span>
                            {entry.notes && (
                              <span className="text-[11px] text-slate-500">Notes: {entry.notes}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                {qaFeedback && (
                  <Alert
                    variant={qaFeedback.type}
                    title={qaFeedback.type === "success" ? "QA saved" : "QA pending"}
                    description={qaFeedback.message}
                    className="mb-4"
                  />
                )}
                <form className="space-y-4" onSubmit={handleQaSubmit}>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">QA result</label>
                    <div className="flex gap-3">
                      <label className="flex items-center gap-2 text-sm text-slate-700">
                        <input
                          type="radio"
                          value="pass"
                          className="h-4 w-4"
                          disabled={!canSubmitQa}
                          {...qaForm.register("qaStatus")}
                        />
                        Pass
                      </label>
                      <label className="flex items-center gap-2 text-sm text-slate-700">
                        <input
                          type="radio"
                          value="fail"
                          className="h-4 w-4"
                          disabled={!canSubmitQa}
                          {...qaForm.register("qaStatus")}
                        />
                        Needs follow-up
                      </label>
                    </div>
                    {qaForm.formState.errors.qaStatus && (
                      <p className="text-sm text-red-600">
                        {qaForm.formState.errors.qaStatus.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700" htmlFor="qa-notes">
                      QA notes (optional)
                    </label>
                    <Textarea
                      id="qa-notes"
                      rows={3}
                      placeholder="Add packaging notes, defects, or replacements"
                      disabled={!canSubmitQa}
                      {...qaForm.register("notes")}
                    />
                  </div>

                  <Button type="submit" disabled={!canSubmitQa || isSubmittingQa} className="gap-2">
                    <ClipboardCheck className="h-4 w-4" />
                    {isSubmittingQa ? "Saving..." : "Save QA checkpoint"}
                  </Button>
                  {!canSubmitQa && (
                    <p className="text-xs text-slate-500">
                      QA edits are locked once the order leaves dispatch.
                    </p>
                  )}
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Dispatch confirmation</CardTitle>
                <CardDescription>
                  Provide logistics details and mark the order as dispatched.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {purchase?.fulfillment?.trackingNumber && (
                  <div className="mb-4 space-y-2 rounded-lg border border-app-border bg-slate-50 p-4 text-xs text-slate-600">
                    <p className="text-sm font-semibold text-slate-900">Current dispatch</p>
                    <p>
                      Tracking: <span className="font-mono">{purchase.fulfillment.trackingNumber}</span>
                    </p>
                    <p>Carrier: {purchase.fulfillment.carrier || "—"}</p>
                    <p>
                      Status: {purchase.fulfillment.status
                        ? STATUS_VARIANTS[purchase.fulfillment.status]?.label || purchase.fulfillment.status
                        : "—"}
                    </p>
                    <p>
                      Shipment date: {purchase.fulfillment.shipmentDate
                        ? new Date(purchase.fulfillment.shipmentDate).toLocaleDateString('en-GB')
                        : "—"}
                    </p>
                    {purchase.fulfillment.notes && <p>Notes: {purchase.fulfillment.notes}</p>}
                  </div>
                )}

                {fulfillmentHistory.length > 0 && (
                  <div className="mb-4 space-y-2 rounded-lg border border-dashed border-app-border p-3 text-xs text-slate-600">
                    <p className="font-semibold text-slate-700">Dispatch timeline</p>
                    <ul className="space-y-2">
                      {fulfillmentHistory.map((event, index) => {
                        const label = event.status
                          ? STATUS_VARIANTS[event.status]?.label || event.status
                          : "Update";
                        return (
                          <li key={index} className="rounded border border-app-border/60 p-2">
                            <p className="flex items-center justify-between font-medium text-slate-800">
                              <span>{label}</span>
                              <span>{event.updatedAt ? new Date(event.updatedAt).toLocaleString('en-GB') : "—"}</span>
                            </p>
                            <div className="mt-1 space-y-1 text-[11px] text-slate-500">
                              {event.trackingNumber && (
                                <p className="font-mono">Tracking: {event.trackingNumber}</p>
                              )}
                              {event.carrier && <p>Carrier: {event.carrier}</p>}
                              {event.shipmentDate && (
                                <p>
                                  Shipment: {new Date(event.shipmentDate).toLocaleDateString('en-GB')}
                                </p>
                              )}
                              {event.updatedBy?.name && <p>Updated by: {event.updatedBy.name}</p>}
                              {event.notes && <p>Notes: {event.notes}</p>}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                {dispatchFeedback && (
                  <Alert
                    variant={dispatchFeedback.type}
                    title={dispatchFeedback.type === "success" ? "Dispatch saved" : "Dispatch pending"}
                    description={dispatchFeedback.message}
                    className="mb-4"
                  />
                )}
                <form className="space-y-4" onSubmit={handleDispatchSubmit}>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700" htmlFor="carrier">
                      Carrier / logistics partner
                    </label>
                    <Input
                      id="carrier"
                      placeholder="TCS Logistics"
                      disabled={!canDispatch}
                      {...dispatchForm.register("carrier")}
                    />
                    {dispatchForm.formState.errors.carrier && (
                      <p className="text-sm text-red-600">
                        {dispatchForm.formState.errors.carrier.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700" htmlFor="trackingNumber">
                      Tracking number
                    </label>
                    <Input
                      id="trackingNumber"
                      placeholder="TRK-123456"
                      disabled={!canDispatch}
                      {...dispatchForm.register("trackingNumber")}
                    />
                    {dispatchForm.formState.errors.trackingNumber && (
                      <p className="text-sm text-red-600">
                        {dispatchForm.formState.errors.trackingNumber.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700" htmlFor="shipmentDate">
                      Shipment date
                    </label>
                    <Input
                      id="shipmentDate"
                      type="date"
                      disabled={!canDispatch}
                      {...dispatchForm.register("shipmentDate")}
                    />
                    {dispatchForm.formState.errors.shipmentDate && (
                      <p className="text-sm text-red-600">
                        {dispatchForm.formState.errors.shipmentDate.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700" htmlFor="dispatch-notes">
                      Dispatch notes (optional)
                    </label>
                    <Textarea
                      id="dispatch-notes"
                      rows={3}
                      placeholder="Hand-off details, packaging cues, or escalation info"
                      disabled={!canDispatch}
                      {...dispatchForm.register("notes")}
                    />
                  </div>

                  <Button type="submit" disabled={!canDispatch || isDispatching} className="gap-2">
                    <Truck className="h-4 w-4" />
                    {isDispatching ? "Saving..." : "Mark as dispatched"}
                  </Button>

                  {!canDispatch && (
                    <p className="text-xs text-slate-500">
                      Dispatch details cannot be edited when the order is marked delivered or cancelled.
                    </p>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>

          {deliveryConfirmations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Delivery confirmation history</CardTitle>
                <CardDescription>Recorded when KL Fashion confirms receipt in the CRM.</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm text-slate-600">
                  {deliveryConfirmations
                    .slice()
                    .reverse()
                    .map((confirmation, index) => (
                      <li key={index} className="rounded-lg border border-app-border p-3">
                        <p className="font-medium text-slate-900">
                          Confirmed on {confirmation.confirmedAt ? new Date(confirmation.confirmedAt).toLocaleString('en-GB') : "—"}
                        </p>
                        <p>Confirmed by: {confirmation.confirmedBy?.name || "—"}</p>
                        <p>Received by: {confirmation.receivedBy || "—"}</p>
                        {confirmation.discrepancies && (
                          <p className="text-xs text-red-600">Discrepancies: {confirmation.discrepancies}</p>
                        )}
                        {confirmation.notes && (
                          <p className="text-xs text-slate-500">Notes: {confirmation.notes}</p>
                        )}
                      </li>
                    ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
