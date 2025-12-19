"use client";

import { Modal } from "./modal";
import ProgressBar from "./ProgressBar";
import { CheckCircle2, XCircle, Loader2, Clock } from "lucide-react";
import clsx from "clsx";

/**
 * UploadProgressModal Component
 * Modal that displays progress during dispatch order creation/update and image uploads.
 * 
 * @param {Object} props
 * @param {boolean} props.open - Whether modal is open
 * @param {string} props.currentStage - Current stage: 'creating' | 'updating' | 'uploading'
 * @param {number} props.overallProgress - Overall progress (0-100)
 * @param {number} props.totalImages - Total number of images to upload
 * @param {number} props.uploadedImages - Number of successfully uploaded images
 * @param {number} props.failedImages - Number of failed image uploads
 * @param {Array} props.imageProgress - Array of image upload progress objects
 * @param {Array} props.errors - Array of error messages
 */
export default function UploadProgressModal({
  open,
  currentStage,
  overallProgress = 0,
  totalImages = 0,
  uploadedImages = 0,
  failedImages = 0,
  imageProgress = [],
  errors = [],
}) {
  const getStageLabel = () => {
    switch (currentStage) {
      case "creating":
        return "Creating dispatch order...";
      case "updating":
        return "Updating dispatch order...";
      case "uploading":
        return "Uploading images...";
      default:
        return "Processing...";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "uploading":
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-slate-400" />;
    }
  };

  const isComplete = overallProgress >= 100;
  const hasErrors = errors.length > 0 || failedImages > 0;

  // Allow closing only when complete (modal will be programmatically closed by parent)
  const handleClose = () => {
    // Modal is non-dismissible during upload, parent handles closing
  };

  return (
    <Modal
      open={open}
      onClose={isComplete ? handleClose : undefined} // Only allow closing when complete
      title={isComplete ? (hasErrors ? "Upload Complete with Errors" : "Upload Complete") : "Processing..."}
      size="lg"
    >
      <div className="space-y-6">
        {/* Overall Progress */}
        <div>
          <ProgressBar
            progress={overallProgress}
            label={getStageLabel()}
            variant={hasErrors ? "error" : isComplete ? "success" : "default"}
            showPercentage={true}
          />
        </div>

        {/* Summary Stats */}
        {totalImages > 0 && (
          <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-semibold text-slate-900">{totalImages}</div>
              <div className="text-xs text-slate-600">Total Images</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold text-green-600">{uploadedImages}</div>
              <div className="text-xs text-slate-600">Uploaded</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold text-red-600">{failedImages}</div>
              <div className="text-xs text-slate-600">Failed</div>
            </div>
          </div>
        )}

        {/* Image Upload List */}
        {imageProgress.length > 0 && (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            <h4 className="text-sm font-semibold text-slate-700 mb-2">
              Image Upload Progress
            </h4>
            {imageProgress.map((img, index) => (
              <div
                key={`${img.productIndex}-${img.imageIndex}`}
                className={clsx(
                  "p-3 rounded-lg border",
                  img.status === "error"
                    ? "bg-red-50 border-red-200"
                    : img.status === "success"
                    ? "bg-green-50 border-green-200"
                    : "bg-white border-slate-200"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getStatusIcon(img.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {img.fileName}
                      </p>
                      {img.status === "uploading" && (
                        <span className="text-xs text-slate-500 ml-2">
                          {Math.round(img.progress)}%
                        </span>
                      )}
                    </div>
                    {img.status === "uploading" && (
                      <ProgressBar
                        progress={img.progress}
                        variant="default"
                        showPercentage={false}
                        className="mt-1"
                      />
                    )}
                    {img.status === "error" && img.error && (
                      <p className="text-xs text-red-600 mt-1">{img.error}</p>
                    )}
                    {img.status === "pending" && (
                      <p className="text-xs text-slate-500 mt-1">Waiting to upload...</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error Messages */}
        {errors.length > 0 && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <h4 className="text-sm font-semibold text-red-900 mb-2">Errors:</h4>
            <ul className="space-y-1">
              {errors.map((error, index) => (
                <li key={index} className="text-sm text-red-700">
                  • {error}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Completion Message */}
        {isComplete && !hasErrors && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
            <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-green-900">
              Dispatch order {currentStage === "creating" ? "created" : "updated"} successfully!
            </p>
            <p className="text-xs text-green-700 mt-1">
              All images uploaded successfully.
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}

