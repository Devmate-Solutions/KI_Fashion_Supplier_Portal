"use client";

import { useMemo, useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import ProductTypeForm from "./ProductTypeForm";
import { createProductType } from "@/lib/api/productTypes";
import { deleteProductImage } from "@/lib/api/products";
import { showError, showWarning } from "@/lib/utils/toast";

const productSchema = z.object({
  name: z.string().min(1, "Product name is required").min(2, "Name must be at least 2 characters"),
  sku: z
    .string()
    .min(1, "SKU is required")
    .min(2, "SKU must be at least 2 characters")
    .transform((value) => value.toUpperCase()),
  category: z.string().min(1, "Category is required"),
  productType: z.string().min(1, "Product type is required"),
  unit: z.string().min(1, "Unit is required"),
  description: z.string().optional().or(z.literal("")),
  costPrice: z
    .union([z.string(), z.number()])
    .transform((val) => {
      if (val === "" || val === null || val === undefined) return 0;
      const num = typeof val === "string" ? parseFloat(val) : val;
      return isNaN(num) ? 0 : num;
    })
    .pipe(z.number().min(0, "Cost price must be zero or greater")),
  sellingPrice: z
    .union([z.string(), z.number()])
    .transform((val) => {
      if (val === "" || val === null || val === undefined) return 0;
      const num = typeof val === "string" ? parseFloat(val) : val;
      return isNaN(num) ? 0 : num;
    })
    .pipe(z.number().min(0, "Selling price must be zero or greater")),
  wholesalePrice: z
    .union([z.string(), z.number()])
    .transform((val) => {
      if (val === "" || val === null || val === undefined) return undefined;
      const num = typeof val === "string" ? parseFloat(val) : val;
      return isNaN(num) ? undefined : num;
    })
    .optional(),
  color: z.string().optional().or(z.literal("")),
  material: z.string().optional().or(z.literal("")),
});

const UNIT_OPTIONS = [
  "piece",
  "kg",
  "g",
  "liter",
  "ml",
  "meter",
  "cm",
  "dozen",
  "box",
  "pack",
];

const inputClasses = "flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

const selectClasses = "flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

const textareaClasses = "flex min-h-[80px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

const labelClasses = "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70";

export default function ProductForm({
  initialProduct,
  onSubmit,
  onCancel,
  productTypes = [],
  isSaving,
  supplierId,
  onProductTypesUpdate,
}) {
  const [existingImages, setExistingImages] = useState(initialProduct?.images || []);
  const [newImageFiles, setNewImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState({});
  const [deletingImages, setDeletingImages] = useState([]);
  const [isProductTypeModalOpen, setIsProductTypeModalOpen] = useState(false);
  const [isCreatingProductType, setIsCreatingProductType] = useState(false);
  const [productTypesList, setProductTypesList] = useState(productTypes);
  const [lastAddedCount, setLastAddedCount] = useState(0);
  const fileInputRef = useRef(null);

  // Helper function to generate unique file ID
  const getFileId = (file) => {
    return `${file.name}-${file.size}-${file.lastModified}`;
  };

  const defaultValues = useMemo(
    () => ({
      name: initialProduct?.name || "",
      sku: initialProduct?.sku || "",
      category: initialProduct?.category || "",
      productType:
        typeof initialProduct?.productType === "object"
          ? initialProduct.productType?._id || initialProduct.productType?.id || ""
          : initialProduct?.productType || "",
      unit: initialProduct?.unit || "piece",
      description: initialProduct?.description || "",
      costPrice: initialProduct?.pricing?.costPrice ?? "",
      sellingPrice: initialProduct?.pricing?.sellingPrice ?? "",
      wholesalePrice: initialProduct?.pricing?.wholesalePrice ?? "",
      color: initialProduct?.specifications?.color || "",
      material: initialProduct?.specifications?.material || "",
    }),
    [initialProduct]
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues,
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    criteriaMode: "firstError",
  });

  // Update productTypesList when productTypes prop changes
  useEffect(() => {
    setProductTypesList(productTypes);
  }, [productTypes]);

  // Reset form when initialProduct changes or modal opens
  useEffect(() => {
    reset(defaultValues);
    setExistingImages(initialProduct?.images || []);
    setNewImageFiles([]);
    setImagePreviews({});
    setDeletingImages([]);

    // Ensure file input has multiple attribute
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute('multiple', 'multiple');
    }
  }, [reset, defaultValues, initialProduct]);

  const handleCreateProductType = async (productTypeData) => {
    setIsCreatingProductType(true);
    try {
      const newProductType = await createProductType(productTypeData);
      const updatedList = [...productTypesList, newProductType];
      setProductTypesList(updatedList);
      setValue("productType", newProductType._id || newProductType.id);
      setIsProductTypeModalOpen(false);
      // Notify parent if callback is provided
      if (onProductTypesUpdate) {
        onProductTypesUpdate(updatedList);
      }
    } catch (error) {
      console.error("Error creating product type:", error);
      showError(error.message || "Failed to create product type");
    } finally {
      setIsCreatingProductType(false);
    }
  };

  const fillTestData = () => {
    const testProduct = {
      name: "Premium Denim Jacket",
      sku: "PDJ-001",
      category: "Outerwear",
      productType: productTypes.length > 0 ? productTypes[0]._id : "",
      unit: "piece",
      description: "High-quality denim jacket with comfortable fit. Machine washable. Available in multiple sizes.",
      costPrice: "45.50",
      sellingPrice: "89.99",
      wholesalePrice: "65.00",
      color: "Indigo Blue",
      material: "100% Cotton Denim",
    };

    Object.entries(testProduct).forEach(([key, value]) => {
      setValue(key, value);
    });
  };

  const handleImageChange = (e) => {
    const input = e.target;

    const files = Array.from(input.files || []);

    if (files.length === 0) {
      return;
    }

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    const maxImages = 20;

    // Check total image count
    const totalImages = existingImages.length + newImageFiles.length;
    if (totalImages + files.length > maxImages) {
      showWarning(`Maximum ${maxImages} images allowed. You currently have ${totalImages} image(s). Please remove some images first.`);
      e.target.value = '';
      return;
    }

    const validFiles = [];
    const invalidFiles = [];

    files.forEach((file) => {
      // Validate file type
      if (!validTypes.includes(file.type)) {
        invalidFiles.push(`${file.name}: Invalid file type. Only JPG, PNG, and WebP are allowed.`);
        return;
      }

      // Validate file size
      if (file.size > maxSize) {
        invalidFiles.push(`${file.name}: File size exceeds 5MB limit.`);
        return;
      }

      validFiles.push(file);
    });

    if (invalidFiles.length > 0) {
      showError(invalidFiles.join('\n'));
    }

    if (validFiles.length > 0) {
      const newFiles = [...newImageFiles, ...validFiles];
      setNewImageFiles(newFiles);
      setLastAddedCount(validFiles.length);

      // Show success message
      if (validFiles.length > 1) {
        // Small delay to show the message
        setTimeout(() => setLastAddedCount(0), 3000);
      }

      // Create previews for new files using unique file IDs
      validFiles.forEach((file) => {
        const fileId = getFileId(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreviews((prev) => ({
            ...prev,
            [fileId]: reader.result,
          }));
        };
        reader.readAsDataURL(file);
      });
    }

    // Reset input to allow selecting the same file again
    e.target.value = '';
  };

  const handleRemoveNewImage = (file) => {
    const fileId = getFileId(file);
    setNewImageFiles((prev) => prev.filter((f) => getFileId(f) !== fileId));
    setImagePreviews((prev) => {
      const newPreviews = { ...prev };
      delete newPreviews[fileId];
      return newPreviews;
    });
  };

  const handleDeleteExistingImage = async (imageUrl) => {
    if (!initialProduct?._id) {
      // If no product ID, just remove from local state (shouldn't happen, but safety check)
      setExistingImages((prev) => prev.filter((url) => url !== imageUrl));
      return;
    }

    try {
      setDeletingImages((prev) => [...prev, imageUrl]);
      await deleteProductImage(initialProduct._id, imageUrl);
      setExistingImages((prev) => prev.filter((url) => url !== imageUrl));
    } catch (error) {
      console.error('Error deleting image:', error);
      showError(error.message || 'Failed to delete image. Please try again.');
    } finally {
      setDeletingImages((prev) => prev.filter((url) => url !== imageUrl));
    }
  };

  const submitHandler = handleSubmit((values) => {
    // Build the payload ensuring all required fields are properly formatted
    const payload = {
      name: values.name,
      sku: values.sku,
      category: values.category,
      productType: values.productType, // This is the MongoDB ObjectId as a string
      unit: values.unit,
      description: values.description || undefined,
      pricing: {
        costPrice: Number(values.costPrice),
        sellingPrice: Number(values.sellingPrice),
      },
    };

    // Add optional pricing fields
    if (values.wholesalePrice) {
      payload.pricing.wholesalePrice = Number(values.wholesalePrice);
    }

    // Add specifications if any are provided
    const specifications = {};
    if (values.color) specifications.color = values.color;
    if (values.material) specifications.material = values.material;

    if (Object.keys(specifications).length > 0) {
      payload.specifications = specifications;
    }

    // Add supplier information if supplierId is available
    if (supplierId) {
      payload.suppliers = [
        {
          supplier: supplierId,
          supplierPrice: Number(values.costPrice),
          isPrimary: true,
        },
      ];
    }

    // Include new image files for upload after product creation/update
    return onSubmit(payload, newImageFiles);
  });

  return (
    <form className="space-y-5" onSubmit={submitHandler}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="name" className={labelClasses}>
            Product name
          </label>
          <input
            id="name"
            className={inputClasses}
            {...register("name")}
          />
          {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="sku" className={labelClasses}>
            SKU / Product code
          </label>
          <input
            id="sku"
            className={inputClasses}
            placeholder="SKU-001"
            {...register("sku")}
          />
          {errors.sku && <p className="text-sm text-red-600">{errors.sku.message}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="category" className={labelClasses}>
            Category
          </label>
          <input
            id="category"
            className={inputClasses}
            placeholder="Outerwear"
            {...register("category")}
          />
          {errors.category && <p className="text-sm text-red-600">{errors.category.message}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="productType" className={labelClasses}>
            Product type <span className="text-red-600">*</span>
          </label>
          <div className="flex gap-2">
            <select id="productType" className={`${selectClasses} flex-1`} {...register("productType")}>
              <option value="">Select type</option>
              {productTypesList.map((type) => (
                <option key={type._id || type.id} value={type._id || type.id}>
                  {type.name}
                </option>
              ))}
            </select>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsProductTypeModalOpen(true)}
              className="px-2"
              title="Add new product type"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {errors.productType && <p className="text-sm text-red-600">{errors.productType.message}</p>}
          {productTypesList.length === 0 && (
            <p className="text-xs text-amber-600">No product types available. You can create one using the + button.</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="unit" className={labelClasses}>
            Unit of measure
          </label>
          <select id="unit" className={selectClasses} {...register("unit")}>
            {UNIT_OPTIONS.map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </select>
          {errors.unit && <p className="text-sm text-red-600">{errors.unit.message}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="costPrice" className={labelClasses}>
            Cost price
          </label>
          <input
            id="costPrice"
            type="number"
            step="0.01"
            min="0"
            className={inputClasses}
            {...register("costPrice")}
          />
          {errors.costPrice && <p className="text-sm text-red-600">{errors.costPrice.message}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="sellingPrice" className={labelClasses}>
            Selling price
          </label>
          <input
            id="sellingPrice"
            type="number"
            step="0.01"
            min="0"
            className={inputClasses}
            {...register("sellingPrice")}
          />
          {errors.sellingPrice && <p className="text-sm text-red-600">{errors.sellingPrice.message}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="wholesalePrice" className={labelClasses}>
            Wholesale price (optional)
          </label>
          <input
            id="wholesalePrice"
            type="number"
            step="0.01"
            min="0"
            className={inputClasses}
            {...register("wholesalePrice")}
          />
          {errors.wholesalePrice && <p className="text-sm text-red-600">{errors.wholesalePrice.message}</p>}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="color" className={labelClasses}>
            Primary color (optional)
          </label>
          <input
            id="color"
            className={inputClasses}
            placeholder="Indigo"
            {...register("color")}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="material" className={labelClasses}>
            Material (optional)
          </label>
          <input
            id="material"
            className={inputClasses}
            placeholder="100% Cotton"
            {...register("material")}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="description" className={labelClasses}>
          Description
        </label>
        <textarea
          id="description"
          rows={4}
          className={textareaClasses}
          placeholder="Key features, care instructions, packing notes"
          {...register("description")}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="images" className={labelClasses}>
            Product Images (optional)
          </label>
          <span className="text-xs text-slate-500">
            {existingImages.length + newImageFiles.length} / 20 images
          </span>
        </div>

        {/* Image Gallery */}
        {(existingImages.length > 0 || newImageFiles.length > 0) && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
            {/* Existing Images */}
            {existingImages.map((imageUrl, index) => (
              <div
                key={`existing-${index}`}
                className="relative group aspect-square rounded-md border border-slate-300 overflow-hidden bg-slate-50"
              >
                <img
                  src={imageUrl}
                  alt={`Product image ${index + 1}`}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    if (e.target.nextSibling) {
                      e.target.nextSibling.style.display = 'flex';
                    }
                  }}
                />
                <div
                  className="text-xs text-slate-400 flex items-center justify-center h-full w-full"
                  style={{ display: 'none' }}
                >
                  Error loading
                </div>
                {index === 0 && (
                  <div className="absolute top-1 left-1 bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded">
                    Primary
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => handleDeleteExistingImage(imageUrl)}
                  disabled={deletingImages.includes(imageUrl)}
                  className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                  title="Delete image"
                >
                  {deletingImages.includes(imageUrl) ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <X className="h-3 w-3" />
                  )}
                </button>
              </div>
            ))}

            {/* New Image Previews */}
            {newImageFiles.map((file) => {
              const fileId = getFileId(file);
              return (
                <div
                  key={fileId}
                  className="relative group aspect-square rounded-md border border-slate-300 overflow-hidden bg-slate-50"
                >
                  {imagePreviews[fileId] ? (
                    <img
                      src={imagePreviews[fileId]}
                      alt={`New image: ${file.name}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-xs text-slate-400">
                      Loading...
                    </div>
                  )}
                  <div className="absolute top-1 left-1 bg-green-600 text-white text-[10px] px-1.5 py-0.5 rounded">
                    New
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveNewImage(file)}
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove image"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* File Input */}
        <div className="space-y-2">
          <input
            ref={fileInputRef}
            id="images"
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleImageChange}
            multiple
            className="hidden"
            disabled={existingImages.length + newImageFiles.length >= 20}
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={(e) => {
                e.preventDefault();
                const input = fileInputRef.current;
                if (input && !input.disabled) {
                  // Force set multiple attribute using both methods
                  input.setAttribute('multiple', '');
                  input.multiple = true;

                  // Trigger click
                  input.click();
                }
              }}
              disabled={existingImages.length + newImageFiles.length >= 20}
              className="flex-1"
            >
              <Plus className="h-4 w-4 mr-2" />
              {existingImages.length + newImageFiles.length === 0
                ? 'Select Multiple Images'
                : `Add More Images`}
            </Button>
            {existingImages.length + newImageFiles.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setNewImageFiles([]);
                  setImagePreviews({});
                  setLastAddedCount(0);
                }}
                className="text-xs"
                title="Clear all new images"
              >
                Clear New
              </Button>
            )}
          </div>
          {lastAddedCount > 1 && (
            <div className="bg-green-50 border border-green-200 text-green-800 text-xs px-3 py-2 rounded-md">
              ✓ Successfully added {lastAddedCount} images! They will be uploaded when you save the product.
            </div>
          )}
          <div className="text-xs text-slate-500 space-y-1">
            <p>
              <strong>Tip:</strong> Hold Ctrl (Windows) or Cmd (Mac) to select multiple images at once, or select them one by one.
            </p>
            <p>
              Supported formats: JPG, PNG, WebP. Max size: 5MB per image. Maximum 20 images total.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <Button type="button" variant="outline" onClick={fillTestData} className="text-xs">
          Fill Test Data
        </Button>
        <div className="flex items-center gap-3">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || isSaving || productTypesList.length === 0}>
            {initialProduct ? "Save changes" : "Create product"}
          </Button>
        </div>
      </div>

      {/* Product Type Creation Modal */}
      <Modal
        open={isProductTypeModalOpen}
        onClose={() => setIsProductTypeModalOpen(false)}
        title="Create New Product Type"
        description="Add a new product type that will be available for selection"
      >
        <ProductTypeForm
          onSubmit={handleCreateProductType}
          onCancel={() => setIsProductTypeModalOpen(false)}
          isSaving={isCreatingProductType}
        />
      </Modal>
    </form>
  );
}