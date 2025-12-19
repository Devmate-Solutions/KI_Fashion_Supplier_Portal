"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import useSWR from "swr";
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
import DispatchOrderForm from "@/components/forms/DispatchOrderForm";
import UploadProgressModal from "@/components/ui/UploadProgressModal";
import { getDispatchOrder, updateDispatchOrder, uploadDispatchOrderItemImage } from "@/lib/api/dispatchOrders";
import { getProductTypes } from "@/lib/api/productTypes";
import { getLogisticsCompanies } from "@/lib/api/logisticsCompanies";
import { handleApiError, showError } from "@/lib/utils/toast";

export default function EditDispatchOrderPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id;
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  // Progress tracking state
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [currentStage, setCurrentStage] = useState('updating');
  const [overallProgress, setOverallProgress] = useState(0);
  const [totalImages, setTotalImages] = useState(0);
  const [uploadedImages, setUploadedImages] = useState(0);
  const [failedImages, setFailedImages] = useState(0);
  const [imageProgress, setImageProgress] = useState([]);
  const [uploadErrors, setUploadErrors] = useState([]);

  const { data: dispatchOrder, isLoading: orderLoading } = useSWR(
    orderId ? `dispatch-order-${orderId}` : null,
    () => getDispatchOrder(orderId)
  );

  const { data: productTypes, isLoading: productTypesLoading } = useSWR(
    "product-types",
    () => getProductTypes({ limit: 100 })
  );

  const { data: logisticsCompanies, isLoading: logisticsLoading } = useSWR(
    "logistics-companies",
    () => getLogisticsCompanies({ limit: 100 })
  );

  // Check if order can be edited
  if (dispatchOrder && dispatchOrder.status !== 'pending') {
    return (
      <div className="space-y-6">
        <Alert
          variant="error"
          title="Cannot Edit Order"
          description="Only pending dispatch orders can be edited. This order has already been confirmed."
        />
        <Button onClick={() => router.push("/dispatch-orders")}>
          Back to Orders
        </Button>
      </div>
    );
  }

  const handleSubmit = async (formData, productImages) => {
    setIsSaving(true);
    setError(null);
    setUploadErrors([]);
    setUploadedImages(0);
    setFailedImages(0);
    setOverallProgress(0);

    // Calculate total images to upload
    let totalImagesCount = 0;
    if (productImages && Object.keys(productImages).length > 0) {
      for (const imageFiles of Object.values(productImages)) {
        const filesArray = Array.isArray(imageFiles) ? imageFiles : (imageFiles ? [imageFiles] : []);
        totalImagesCount += filesArray.length;
      }
    }
    setTotalImages(totalImagesCount);

    // Initialize image progress tracking
    const initialImageProgress = [];
    if (productImages && Object.keys(productImages).length > 0) {
      for (const [productIndexStr, imageFiles] of Object.entries(productImages)) {
        const productIndex = parseInt(productIndexStr);
        const filesArray = Array.isArray(imageFiles) ? imageFiles : (imageFiles ? [imageFiles] : []);
        filesArray.forEach((file, i) => {
          initialImageProgress.push({
            productIndex,
            imageIndex: i,
            fileName: file.name,
            status: 'pending',
            progress: 0,
          });
        });
      }
    }
    setImageProgress(initialImageProgress);
    setShowProgressModal(true);
    setCurrentStage('updating');

    try {
      // Stage 1: Update dispatch order (0-20%)
      setOverallProgress(10);
      await updateDispatchOrder(orderId, formData);
      setOverallProgress(20);

      // Stage 2: Upload images (20-100%)
      if (productImages && Object.keys(productImages).length > 0 && orderId) {
        setCurrentStage('uploading');
        const imageUploadErrors = [];
        let uploadedCount = 0;
        let failedCount = 0;
        let currentImageIndex = 0;

        // Calculate progress per image (80% divided by total images)
        const progressPerImage = totalImagesCount > 0 ? 80 / totalImagesCount : 0;

        // Upload images sequentially to avoid overwhelming the server
        for (const [productIndexStr, imageFiles] of Object.entries(productImages)) {
          const productIndex = parseInt(productIndexStr);
          const filesArray = Array.isArray(imageFiles) ? imageFiles : (imageFiles ? [imageFiles] : []);

          if (filesArray.length > 0 && productIndex >= 0) {
            // Upload each image for this product
            for (let i = 0; i < filesArray.length; i++) {
              const imageFile = filesArray[i];

              // Update status to uploading
              setImageProgress(prev => prev.map(img =>
                img.productIndex === productIndex && img.imageIndex === i
                  ? { ...img, status: 'uploading', progress: 0 }
                  : img
              ));

              try {
                await uploadDispatchOrderItemImage(
                  orderId,
                  productIndex,
                  imageFile,
                  (progress) => {
                    // Update individual image progress
                    setImageProgress(prev => prev.map(img =>
                      img.productIndex === productIndex && img.imageIndex === i
                        ? { ...img, progress }
                        : img
                    ));

                    // Update overall progress: 20% (order updated) + (currentImageIndex * progressPerImage) + (progress * progressPerImage / 100)
                    const baseProgress = 20 + (currentImageIndex * progressPerImage);
                    const imageProgressContribution = (progress * progressPerImage) / 100;
                    setOverallProgress(baseProgress + imageProgressContribution);
                  }
                );

                // Mark as success
                setImageProgress(prev => prev.map(img =>
                  img.productIndex === productIndex && img.imageIndex === i
                    ? { ...img, status: 'success', progress: 100 }
                    : img
                ));

                uploadedCount++;
                setUploadedImages(uploadedCount);
                currentImageIndex++;

                // Update overall progress
                setOverallProgress(20 + (currentImageIndex * progressPerImage));
              } catch (imageError) {
                // Extract detailed error information
                const errorResponse = imageError?.response?.data;
                const errorMessage = errorResponse?.message || errorResponse?.error || imageError?.message || "Unknown error";

                // Mark as error
                setImageProgress(prev => prev.map(img =>
                  img.productIndex === productIndex && img.imageIndex === i
                    ? { ...img, status: 'error', progress: 0, error: errorMessage }
                    : img
                ));

                failedCount++;
                setFailedImages(failedCount);
                currentImageIndex++;

                // Update overall progress even on error
                setOverallProgress(20 + (currentImageIndex * progressPerImage));

                const errorMsg = `Product ${productIndex + 1}, Image ${i + 1} (${imageFile?.name}): ${errorMessage}`;
                imageUploadErrors.push(errorMsg);
                setUploadErrors([...uploadErrors, errorMsg]);
              }
            }
          }
        }

        // Set progress to 100% when done
        setOverallProgress(100);

        // Show error message if any image uploads failed
        if (imageUploadErrors.length > 0) {
          // Wait a moment to show completion, then show error
          setTimeout(() => {
            setShowProgressModal(false);
            const userErrorMessage = `Dispatch order updated, but ${imageUploadErrors.length} image upload(s) failed. You can try uploading the images again.`;
            showError(userErrorMessage, { duration: 7000 });
            setIsSaving(false);
          }, 1500);
          return; // Return early so we don't navigate away
        }
      } else {
        // No images to upload, set to 100%
        setOverallProgress(100);
      }

      // Wait a moment to show completion, then navigate
      setTimeout(() => {
        setShowProgressModal(false);
        router.push("/dispatch-orders");
      }, 1000);
    } catch (err) {
      setShowProgressModal(false);
      handleApiError(err, "Failed to update dispatch order. Please try again.");
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.push("/dispatch-orders");
  };

  if (orderLoading || productTypesLoading || logisticsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-slate-600">Loading...</p>
      </div>
    );
  }

  if (!dispatchOrder) {
    return (
      <div className="space-y-6">
        <Alert
          variant="error"
          title="Order Not Found"
          description="The dispatch order you're trying to edit does not exist."
        />
        <Button onClick={() => router.push("/dispatch-orders")}>
          Back to Orders
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Edit Dispatch Order</h1>
        <p className="mt-1 text-sm text-slate-600">
          Update the dispatch order details. Only pending orders can be edited.
        </p>
      </div>

      {error && (
        <Alert
          variant="error"
          title="Error"
          description={error}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Order Details</CardTitle>
          <CardDescription>
            Update the product information, quantities, and box configurations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DispatchOrderForm
            initialOrder={dispatchOrder}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isSaving={isSaving}
            productTypes={productTypes || []}
            logisticsCompanies={logisticsCompanies || []}
            user={user}
          />
        </CardContent>
      </Card>

      {/* Upload Progress Modal */}
      <UploadProgressModal
        open={showProgressModal}
        currentStage={currentStage}
        overallProgress={overallProgress}
        totalImages={totalImages}
        uploadedImages={uploadedImages}
        failedImages={failedImages}
        imageProgress={imageProgress}
        errors={uploadErrors}
      />
    </div>
  );
}

