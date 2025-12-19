"use client";

import { useState, useRef, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { Modal } from "./modal";
import { Button } from "./button";

/**
 * ImageGallery Component
 * A reusable image gallery component that displays images in a grid,
 * allows viewing in a lightbox modal, and supports adding/removing images.
 * 
 * @param {Object} props
 * @param {Array} props.images - Array of image objects: { id: string, url: string, isExisting?: boolean }
 * @param {Function} props.onRemove - Callback when image is removed: (imageId: string) => void
 * @param {Function} props.onAdd - Callback when add button is clicked: () => void
 * @param {number} props.maxImages - Maximum number of images allowed (default: 20)
 * @param {boolean} props.showAddButton - Whether to show add button (default: true)
 * @param {string} props.emptyMessage - Message to show when no images (default: "No images")
 * @param {string} props.title - Title for the gallery modal (default: "Image Gallery")
 */
export default function ImageGallery({
  images = [],
  onRemove,
  onAdd,
  maxImages = 20,
  showAddButton = true,
  emptyMessage = "No images",
  title = "Image Gallery",
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const fileInputRef = useRef(null);

  // Filter out any null/undefined images
  const validImages = images.filter(img => img && img.url);

  const handleImageClick = (index) => {
    setSelectedImageIndex(index);
    setIsModalOpen(true);
  };

  const handlePrevious = () => {
    setSelectedImageIndex((prev) => 
      prev > 0 ? prev - 1 : validImages.length - 1
    );
  };

  const handleNext = () => {
    setSelectedImageIndex((prev) => 
      prev < validImages.length - 1 ? prev + 1 : 0
    );
  };

  const handleKeyDown = (e) => {
    if (!isModalOpen) return;
    
    if (e.key === "ArrowLeft") {
      handlePrevious();
    } else if (e.key === "ArrowRight") {
      handleNext();
    } else if (e.key === "Escape") {
      setIsModalOpen(false);
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen, validImages.length]);

  const selectedImage = validImages[selectedImageIndex];

  if (validImages.length === 0 && !showAddButton) {
    return (
      <div className="text-xs text-slate-400 italic">
        {emptyMessage}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {/* Thumbnail Grid */}
        {validImages.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {validImages.map((image, index) => (
              <div
                key={image.id || index}
                className="relative group cursor-pointer"
                onClick={() => handleImageClick(index)}
              >
                <div className="h-12 w-12 overflow-hidden rounded border border-slate-300 bg-slate-50 flex items-center justify-center hover:border-blue-500 transition-colors">
                  <img
                    src={image.url}
                    alt={`Image ${index + 1}`}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.target.style.display = "none";
                      const parent = e.target.parentElement;
                      if (parent && !parent.querySelector(".error-indicator")) {
                        const errorDiv = document.createElement("div");
                        errorDiv.className = "error-indicator text-[8px] text-red-500 p-1 text-center";
                        errorDiv.textContent = "Error";
                        parent.appendChild(errorDiv);
                      }
                    }}
                  />
                </div>
                {/* Remove button on hover */}
                {onRemove && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(image.id || index);
                    }}
                    className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    title="Remove image"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {validImages.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleImageClick(0)}
              className="text-xs"
            >
              View All ({validImages.length})
            </Button>
          )}
          {showAddButton && onAdd && validImages.length < maxImages && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onAdd}
              className="text-xs"
            >
              <Plus className="h-3 w-3 mr-1" />
              {validImages.length > 0 ? "Add More" : "Add Images"}
            </Button>
          )}
          {validImages.length >= maxImages && (
            <span className="text-xs text-slate-500">
              Maximum {maxImages} images reached
            </span>
          )}
        </div>
      </div>

      {/* Lightbox Modal */}
      <Modal
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setIsFullscreen(false);
        }}
        title={title}
        description={`${validImages.length} image${validImages.length !== 1 ? "s" : ""}`}
        size="lg"
      >
        {selectedImage && (
          <div className="space-y-4">
            {/* Main Image Viewer */}
            <div className="relative bg-slate-100 rounded-lg overflow-hidden aspect-video flex items-center justify-center">
              <img
                src={selectedImage.url}
                alt={`Image ${selectedImageIndex + 1} of ${validImages.length}`}
                className={`max-w-full max-h-[60vh] object-contain ${
                  isFullscreen ? "cursor-zoom-out" : "cursor-zoom-in"
                }`}
                onClick={() => setIsFullscreen(!isFullscreen)}
                onError={(e) => {
                  e.target.style.display = "none";
                  const parent = e.target.parentElement;
                  if (parent) {
                    const errorDiv = document.createElement("div");
                    errorDiv.className = "text-red-500 text-center p-4";
                    errorDiv.textContent = "Failed to load image";
                    parent.appendChild(errorDiv);
                  }
                }}
              />

              {/* Navigation Arrows */}
              {validImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrevious}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}

              {/* Image Counter */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-3 py-1 rounded-full">
                {selectedImageIndex + 1} / {validImages.length}
              </div>

              {/* Remove Button */}
              {onRemove && (
                <button
                  type="button"
                  onClick={() => {
                    onRemove(selectedImage.id || selectedImageIndex);
                    if (validImages.length === 1) {
                      setIsModalOpen(false);
                    } else if (selectedImageIndex >= validImages.length - 1) {
                      setSelectedImageIndex(selectedImageIndex - 1);
                    }
                  }}
                  className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-2 transition-colors"
                  title="Remove image"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Thumbnail Strip */}
            {validImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {validImages.map((image, index) => (
                  <div
                    key={image.id || index}
                    className={`flex-shrink-0 cursor-pointer rounded border-2 transition-all ${
                      index === selectedImageIndex
                        ? "border-blue-500 ring-2 ring-blue-200"
                        : "border-slate-300 hover:border-slate-400"
                    }`}
                    onClick={() => setSelectedImageIndex(index)}
                  >
                    <img
                      src={image.url}
                      alt={`Thumbnail ${index + 1}`}
                      className="h-16 w-16 object-cover rounded"
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Keyboard Shortcuts Hint */}
            <div className="text-xs text-slate-500 text-center pt-2 border-t">
              Use arrow keys to navigate • Click image to zoom • Press ESC to close
            </div>
          </div>
        )}
      </Modal>

      {/* Fullscreen Overlay */}
      {isFullscreen && selectedImage && (
        <div
          className="fixed inset-0 z-[60] bg-black flex items-center justify-center p-4"
          onClick={() => setIsFullscreen(false)}
        >
          <img
            src={selectedImage.url}
            alt={`Fullscreen image ${selectedImageIndex + 1}`}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            type="button"
            onClick={() => setIsFullscreen(false)}
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 transition-colors"
            aria-label="Exit fullscreen"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      )}
    </>
  );
}

