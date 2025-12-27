"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus,
  Trash2,
  Keyboard,
  Edit2,
  Save,
  X,
  Package,
  Image as ImageIcon,
  Pencil,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import ImageGallery from "@/components/ui/ImageGallery";
import { createProductType } from "@/lib/api/productTypes";
import { showError, showWarning } from "@/lib/utils/toast";
import ProductTypeForm from "./ProductTypeForm";
import PacketConfigurationModal from "@/components/modals/PacketConfigurationModal";

const boxSchema = z.object({
  boxNumber: z.number(),
  itemsPerBox: z.number().min(0).optional(),
});

const productItemSchema = z.object({
  productName: z.string().min(1, "Product name is required"),
  productCode: z.string().min(1, "SKU/Product code is required"),
  productType: z.string().min(1, "Product type is required"),
  costPrice: z
    .union([z.string(), z.number()])
    .transform((val) => {
      if (val === "" || val === null || val === undefined) return 0;
      const num = typeof val === "string" ? parseFloat(val) : val;
      return isNaN(num) ? 0 : num;
    })
    .pipe(z.number().min(0, "Cost price must be zero or greater")),
  primaryColor: z.array(z.string()).optional().default([]),
  size: z.array(z.string()).optional().default([]),
  quantity: z.number().min(1, "Quantity must be at least 1"),
});

const dispatchOrderSchema = z.object({
  date: z.string().min(1, "Date is required"),
  logisticsCompany: z.string().min(1, "Logistics company is required"),
  products: z
    .array(productItemSchema)
    .min(1, "At least one product is required"),
  discount: z
    .number()
    .min(0, "Discount cannot be negative")
    .optional()
    .default(0),
});

// Input styling
const inputClasses =
  "w-full px-3 py-2 border rounded-md bg-background text-sm disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-blue-500 transition-colors";
const selectClasses =
  "w-full px-3 py-2 border rounded-md bg-background text-sm disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-blue-500 transition-colors";
const labelClasses = "block text-sm font-medium mb-1.5 text-slate-700";

export default function DispatchOrderForm({
  onSubmit,
  onCancel,
  isSaving,
  productTypes = [],
  logisticsCompanies = [],
  user,
  initialOrder = null,
}) {
  const [isProductTypeModalOpen, setIsProductTypeModalOpen] = useState(false);
  const [isCreatingProductType, setIsCreatingProductType] = useState(false);
  const [productTypesList, setProductTypesList] = useState(productTypes);
  const [productImages, setProductImages] = useState({}); // { productIndex: File[] }
  const [imagePreviews, setImagePreviews] = useState({}); // { productIndex: { fileId: string } }
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Use a ref to store initial image URLs to prevent loss during re-renders
  const initialImageUrlsRef = useRef({}); // { productIndex: imageUrl }
  const lastRestoreKeyRef = useRef(""); // Track last restore to prevent infinite loops

  // Helper function to generate unique file ID
  const getFileId = (file) => {
    return `${file.name}-${file.size}-${file.lastModified}`;
  };

  // Inline editing state
  const [editingCell, setEditingCell] = useState(null); // { rowIndex: number, fieldName: string } | null
  const [editValue, setEditValue] = useState("");

  // Order-level box management state
  const [totalBoxes, setTotalBoxes] = useState(0);
  const [orderBoxes, setOrderBoxes] = useState([]); // Array of { boxNumber, itemsPerBox }

  // Discount management state
  const [discountType, setDiscountType] = useState("amount"); // "percentage" or "amount"
  const [discountValue, setDiscountValue] = useState(0);
  const [discountError, setDiscountError] = useState("");

  // Single product form state (for adding new products)
  const [newProduct, setNewProduct] = useState({
    productName: "",
    productCode: "",
    productType: "",
    costPrice: "",
    primaryColor: [],
    size: [],
    quantity: "",
  });
  const [newProductImage, setNewProductImage] = useState([]);
  const [newProductImagePreview, setNewProductImagePreview] = useState({});
  const [newProductErrors, setNewProductErrors] = useState({});

  // Confirmation dialog state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(null); // Store the submit data

  // Packet configuration state
  const [productPackets, setProductPackets] = useState({}); // { productIndex: { useVariantTracking: bool, packets: [] } }
  const [packetModalOpen, setPacketModalOpen] = useState(false);
  const [packetModalProduct, setPacketModalProduct] = useState(null);

  // Box validation error state
  const [boxError, setBoxError] = useState(null);

  // Get initial values from existing order if editing
  const getInitialValues = useMemo(() => {
    if (initialOrder && initialOrder.items && initialOrder.items.length > 0) {
      const products = initialOrder.items.map((item) => ({
        productName: item.productName || "",
        productCode: item.productCode || "",
        productType: item.productType?._id || item.productType || "",
        costPrice: item.costPrice || "",
        primaryColor: Array.isArray(item.primaryColor)
          ? item.primaryColor
          : item.primaryColor
          ? [item.primaryColor]
          : [],
        size: Array.isArray(item.size)
          ? item.size
          : item.size
          ? [item.size]
          : [],
        quantity: item.quantity || "",
        boxes: item.boxes || [],
      }));

      return {
        date:
          initialOrder.date || initialOrder.dispatchDate
            ? new Date(initialOrder.date || initialOrder.dispatchDate)
                .toISOString()
                .split("T")[0]
          : new Date().toISOString().split("T")[0],
        logisticsCompany:
          initialOrder.logisticsCompany?._id ||
          initialOrder.logisticsCompany ||
          "",
        products,
        discount: initialOrder.totalDiscount || 0,
      };
    }
    return {
      date: new Date().toISOString().split("T")[0],
      logisticsCompany: "",
      products: [],
      discount: 0,
    };
  }, [initialOrder]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    getValues,
    trigger,
    control,
    reset,
  } = useForm({
    resolver: zodResolver(dispatchOrderSchema),
    defaultValues: getInitialValues,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "products",
  });

  // Use useWatch to properly react to nested field changes
  // This will automatically update when any field in products array changes
  const watchedProducts =
    useWatch({
    control,
    name: "products",
  }) || [];

  const date = watch("date");
  const logisticsCompany = watch("logisticsCompany");

  // Create a state to force recalculation when products change
  const [recalcTrigger, setRecalcTrigger] = useState(0);

  // Calculate grand total - this will recalculate when watchedProducts or recalcTrigger changes
  const grandTotal = useMemo(() => {
    if (!watchedProducts || watchedProducts.length === 0) return 0;
    const total = watchedProducts.reduce((sum, p) => {
      const costPrice =
        typeof p?.costPrice === "number"
          ? p.costPrice
          : parseFloat(p?.costPrice) || 0;
      const quantity = p?.quantity || 0;
      return sum + costPrice * quantity;
    }, 0);
    return total;
  }, [watchedProducts, recalcTrigger]);

  const discountAmount = useMemo(() => {
    const calculated =
      discountType === "percentage"
        ? (grandTotal * (parseFloat(discountValue) || 0)) / 100
        : parseFloat(discountValue) || 0;
    // Round to 2 decimal places to ensure precision and consistency
    return Math.round(calculated * 100) / 100;
  }, [discountType, discountValue, grandTotal]);

  // Validate discount - check if it exceeds grand total
  useEffect(() => {
    if (grandTotal > 0 && discountValue !== "" && discountValue !== null) {
      if (discountType === "percentage") {
        if (parseFloat(discountValue) > 100) {
          setDiscountError("Discount percentage cannot exceed 100%");
        } else {
          const calculatedDiscount = (grandTotal * parseFloat(discountValue)) / 100;
          if (calculatedDiscount > grandTotal) {
            setDiscountError("Discount amount cannot exceed grand total");
          } else {
            setDiscountError("");
          }
        }
      } else {
        // Amount type
        if (parseFloat(discountValue) > grandTotal) {
          setDiscountError(`Discount amount cannot exceed grand total (${grandTotal.toFixed(2)})`);
        } else {
          setDiscountError("");
        }
      }
    } else {
      setDiscountError("");
    }
  }, [discountType, discountValue, grandTotal]);

  // Update form discount value whenever discount changes
  useEffect(() => {
    setValue("discount", discountAmount);
  }, [discountAmount, setValue]);

  // Initialize form and state when initialOrder changes (for edit mode)
  useEffect(() => {
    if (initialOrder && initialOrder.items && initialOrder.items.length > 0) {
      // Reset form with initial values
      const values = getInitialValues;
      reset(values, { keepDefaultValues: false });

      // Set image previews for existing items
      // Note: Backend may have single image or array of images
      // Match the pattern used in the detail page: item.product?.images?.[0] || item.productImage
      const previews = {};
      const imageUrlsMap = {}; // Store initial image URLs for preservation

      initialOrder.items.forEach((item, index) => {
        let imageUrls = [];

        // Try multiple sources in order of preference (matching detail page pattern)
        // 1. Check item.productImage (direct item image) - PRIMARY SOURCE for dispatch orders
        if (item.productImage) {
          if (Array.isArray(item.productImage)) {
            imageUrls = item.productImage.filter((url) => {
              return url && typeof url === "string" && url.trim() !== "";
            });
          } else if (
            typeof item.productImage === "string" &&
            item.productImage.trim() !== ""
          ) {
            imageUrls = [item.productImage];
          }
        }
        // 2. Check item.product?.images array (populated product) - FALLBACK
        if (
          imageUrls.length === 0 &&
          item.product?.images &&
          Array.isArray(item.product.images) &&
          item.product.images.length > 0
        ) {
          imageUrls = item.product.images.filter(
            (url) => url && typeof url === "string" && url.trim() !== ""
          );
        }
        // 3. Check item.product?.image (single product image) - FALLBACK
        if (
          imageUrls.length === 0 &&
          item.product?.image &&
          typeof item.product.image === "string" &&
          item.product.image.trim() !== ""
        ) {
          imageUrls = [item.product.image];
        }

        // Store images in previews with existing- prefix
        if (imageUrls.length > 0) {
          previews[index] = {};
          // Store ALL image URLs in ref for preservation during updates (not just first)
          imageUrlsMap[index] = imageUrls;

          imageUrls.forEach((imgUrl, imgIndex) => {
            if (imgUrl && typeof imgUrl === "string" && imgUrl.trim() !== "") {
              // Ensure we have a valid URL
              const key = `existing-${imgIndex}`;
              previews[index][key] = imgUrl.trim();
            }
          });
        }
      });

      // Store initial image URLs in ref for preservation
      initialImageUrlsRef.current = imageUrlsMap;

      setImagePreviews(previews);

      // Load boxes at order level: aggregate all boxes from all items
      const allBoxes = [];
      initialOrder.items.forEach((item) => {
        if (item.boxes && Array.isArray(item.boxes) && item.boxes.length > 0) {
          allBoxes.push(...item.boxes);
        }
      });

      // Calculate total boxes - just count unique box numbers
      if (allBoxes.length > 0) {
        const uniqueBoxNumbers = [
          ...new Set(allBoxes.map((b) => b.boxNumber)),
        ].sort((a, b) => a - b);
        const totalBoxesCount = uniqueBoxNumbers.length;
        setTotalBoxes(totalBoxesCount);
      } else {
        setTotalBoxes(0);
      }

      // Initialize discount values
      // Calculate grand total from items to determine if discount was percentage
      const calculatedGrandTotal = initialOrder.items.reduce((sum, item) => {
        const costPrice =
          typeof item.costPrice === "number"
            ? item.costPrice
            : parseFloat(item.costPrice) || 0;
        const quantity = item.quantity || 0;
        return sum + costPrice * quantity;
      }, 0);

      const initialDiscount = initialOrder.totalDiscount || 0;

      // Try to determine if discount was originally a percentage
      // Check if the discount amount matches a round percentage (within 0.02 tolerance for rounding)
      let detectedDiscountType = "amount";
      let detectedDiscountValue = initialDiscount;

      if (calculatedGrandTotal > 0 && initialDiscount > 0) {
        const percentage = (initialDiscount / calculatedGrandTotal) * 100;
        const roundedPercentage = Math.round(percentage * 100) / 100; // Round to 2 decimal places

        // Check if it's a round percentage (whole number or one decimal place like 12.5, 33.3)
        // A round percentage is one where the value has at most one decimal place
        const hasOneDecimal =
          Math.round(roundedPercentage * 10) / 10 === roundedPercentage;
        const isRoundPercentage = roundedPercentage % 1 === 0 || hasOneDecimal;

        // Calculate what the discount would be with this percentage
        const calculatedDiscountFromPercentage =
          Math.round(((calculatedGrandTotal * roundedPercentage) / 100) * 100) /
          100;

        // Check if calculated discount matches stored discount (within 0.02 tolerance for rounding differences)
        const matchesStoredDiscount =
          Math.abs(calculatedDiscountFromPercentage - initialDiscount) <= 0.02;

        // Only treat as percentage if it's a reasonable percentage (0-100) and matches
        if (
          isRoundPercentage &&
          matchesStoredDiscount &&
          roundedPercentage >= 0 &&
          roundedPercentage <= 100
        ) {
          detectedDiscountType = "percentage";
          detectedDiscountValue = roundedPercentage;
        }
      }

      setDiscountValue(detectedDiscountValue);
      setDiscountType(detectedDiscountType);

      // Reset productImages state (don't load existing files, only show previews)
      setProductImages({});

      // Initialize product packets from existing items
      const initialPackets = {};
      initialOrder.items.forEach((item, index) => {
        if (item.packets && item.packets.length > 0) {
          initialPackets[index] = {
            useVariantTracking: true,
            packets: item.packets,
          };
        } else if (item.useVariantTracking) {
          initialPackets[index] = {
            useVariantTracking: true,
            packets: [],
          };
        }
      });
      setProductPackets(initialPackets);
    } else {
      // Reset everything for new order
      setImagePreviews({});
      setProductImages({});
      setTotalBoxes(0);
      setDiscountValue(0);
      setDiscountType("amount");
      setProductPackets({});
    }
  }, [initialOrder, getInitialValues, reset]);

  // Additional effect to ensure image previews persist and are properly maintained
  // This ensures images don't get lost during re-renders or state updates
  useEffect(() => {
    if (initialOrder && initialOrder.items && initialOrder.items.length > 0) {
      // Use a ref to track if we've already restored to prevent infinite loops
      const restoreKey = JSON.stringify(
        Object.keys(initialImageUrlsRef.current).sort()
      );

      // Only restore if we haven't already done so for this set of images
      if (restoreKey !== lastRestoreKeyRef.current) {
        // Ensure image previews are maintained even if state gets cleared
        setImagePreviews((prevPreviews) => {
          // Check if we need to restore from ref
          const needsRestore = Object.keys(initialImageUrlsRef.current).some(
            (index) => {
            const idx = parseInt(index);
              const hasPreviews =
                prevPreviews[idx] &&
                Object.keys(prevPreviews[idx]).some((key) =>
                  key.startsWith("existing-")
                );
            return !hasPreviews && initialImageUrlsRef.current[index];
            }
          );

          if (needsRestore) {
            const restoredPreviews = { ...prevPreviews };
            Object.keys(initialImageUrlsRef.current).forEach((index) => {
              const idx = parseInt(index);
              const imageUrl = initialImageUrlsRef.current[index];
              if (
                imageUrl &&
                (!restoredPreviews[idx] ||
                  !Object.keys(restoredPreviews[idx]).some((key) =>
                    key.startsWith("existing-")
                  ))
              ) {
                if (!restoredPreviews[idx]) {
                  restoredPreviews[idx] = {};
                }
                restoredPreviews[idx]["existing-0"] = imageUrl;
              }
            });
            lastRestoreKeyRef.current = restoreKey;
            return restoredPreviews;
          }

          return prevPreviews;
        });
      }
    }
  }, [initialOrder]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger shortcuts when typing in inputs
      if (
        e.target.tagName === "INPUT" ||
        e.target.tagName === "TEXTAREA" ||
        e.target.tagName === "SELECT"
      ) {
        // Allow Ctrl/Cmd + Enter to submit even in inputs
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
          e.preventDefault();
          handleSubmit(submitHandler)();
          return;
        }
        return;
      }

      // Ctrl/Cmd + K to show shortcuts
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setShowShortcuts(!showShortcuts);
        return;
      }

      // Escape to close shortcuts
      if (e.key === "Escape" && showShortcuts) {
        setShowShortcuts(false);
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showShortcuts]);

  // Validate new product form
  const validateNewProduct = () => {
    const errors = {};
    if (!newProduct.productName.trim())
      errors.productName = "Product name is required";
    if (!newProduct.productCode.trim())
      errors.productCode = "SKU/Product code is required";
    if (!newProduct.productType)
      errors.productType = "Product type is required";
    if (!newProduct.costPrice || parseFloat(newProduct.costPrice) < 0)
      errors.costPrice = "Cost price must be zero or greater";
    if (!newProduct.quantity || parseInt(newProduct.quantity) < 1)
      errors.quantity = "Quantity must be at least 1";
    setNewProductErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Add product from form to table
  const handleAddProductToTable = () => {
    if (!validateNewProduct()) {
      return;
    }

    const productData = {
      productName: newProduct.productName.trim(),
      productCode: newProduct.productCode.trim(),
      productType: newProduct.productType,
      costPrice: newProduct.costPrice || "0",
      primaryColor: Array.isArray(newProduct.primaryColor)
        ? newProduct.primaryColor
            .filter((c) => c && typeof c === "string" && c.trim())
            .map((c) => c.trim())
        : [],
      size: Array.isArray(newProduct.size)
        ? newProduct.size
            .filter((s) => s && typeof s === "string" && s.trim())
            .map((s) => s.trim())
        : [],
      quantity: parseInt(newProduct.quantity) || 1,
      boxes: [],
    };

    const newIndex = fields.length;
    append(productData);

    // Handle images if provided
    if (newProductImage && newProductImage.length > 0) {
      setProductImages({ ...productImages, [newIndex]: newProductImage });
      setImagePreviews({
        ...imagePreviews,
        [newIndex]: newProductImagePreview,
      });
    }

    // Clear form
    setNewProduct({
      productName: "",
      productCode: "",
      productType: "",
      costPrice: "",
      primaryColor: [],
      size: [],
      quantity: "",
    });
    setNewProductImage([]);
    setNewProductImagePreview({});
    setNewProductErrors({});

    // Reset image input
    setTimeout(() => {
      const imageInput = document.getElementById("new-product-image");
      if (imageInput) {
        imageInput.value = "";
      }
      // Focus on product name field
      const productNameInput = document.getElementById("new-product-name");
      if (productNameInput) {
        productNameInput.focus();
      }
    }, 100);
  };

  const handleRemoveProduct = (index) => {
    // Get all indices that might have associated metadata
    const allMetadataIndices = new Set([
      ...Object.keys(productImages).map(Number),
      ...Object.keys(imagePreviews).map(Number),
      ...Object.keys(initialImageUrlsRef.current).map(Number),
      ...Object.keys(productPackets).map(Number),
    ]);

    remove(index);

    // Create new objects for adjusted metadata
    const adjustedImages = {};
    const adjustedPreviews = {};
    const adjustedRef = {};
    const adjustedPackets = {};

    // Remap all metadata indices
    allMetadataIndices.forEach((idx) => {
      if (idx === index) return; // Skip the removed index

      const newIdx = idx > index ? idx - 1 : idx;

      if (productImages[idx]) adjustedImages[newIdx] = productImages[idx];
      if (imagePreviews[idx]) adjustedPreviews[newIdx] = imagePreviews[idx];
      if (initialImageUrlsRef.current[idx])
        adjustedRef[newIdx] = initialImageUrlsRef.current[idx];
      if (productPackets[idx]) adjustedPackets[newIdx] = productPackets[idx];
    });

    setProductImages(adjustedImages);
    setImagePreviews(adjustedPreviews);
    setProductPackets(adjustedPackets);
    initialImageUrlsRef.current = adjustedRef;
  };

  // Packet configuration handlers
  const handleToggleVariantTracking = (productIndex) => {
    setProductPackets((prev) => ({
      ...prev,
      [productIndex]: {
        useVariantTracking: !prev[productIndex]?.useVariantTracking,
        packets: prev[productIndex]?.packets || [],
      },
    }));
  };

  const handleOpenPacketModal = (productIndex) => {
    const product = watchedProducts?.[productIndex];
    if (!product) return;

    setPacketModalProduct({
      index: productIndex,
      productName: product.productName || `Product ${productIndex + 1}`,
      productType: product.productType,
      quantity: product.quantity || 0,
      availableSizes: Array.isArray(product.size) ? product.size : [],
      availableColors: Array.isArray(product.primaryColor)
        ? product.primaryColor
        : [],
    });
    setPacketModalOpen(true);
  };

  const handleSavePackets = (packets, productItem) => {
    // productItem is the item object passed from the modal, effectively the one being saved
    // Ensure we use the index from productItem first, then fallback to packetModalProduct
    // The index should be a number, not a string
    let index = productItem?.index;

    // If index is undefined, try to get it from packetModalProduct
    if (index === undefined && packetModalProduct?.index !== undefined) {
      index = packetModalProduct.index;
    }

    // If still undefined, try to parse from productItem.id (which is a string representation of index)
    if (index === undefined && productItem?.id !== undefined) {
      const parsedIndex = parseInt(productItem.id, 10);
      if (!isNaN(parsedIndex)) {
        index = parsedIndex;
      }
    }

    // Ensure index is a number
    if (typeof index === "string") {
      index = parseInt(index, 10);
    }

    if (index !== undefined && !isNaN(index)) {
      // Deep copy packets to ensure isolation between products
      const deepCopiedPackets = (packets || []).map((packet) => ({
        packetNumber: packet.packetNumber,
        totalItems: parseInt(packet.totalItems) || 0,
        composition: (packet.composition || []).map((comp) => ({
          size: String(comp.size || "").trim(),
          color: String(comp.color || "").trim(),
          quantity: parseInt(comp.quantity) || 0,
        })),
        isLoose: Boolean(packet.isLoose),
      }));

      setProductPackets((prev) => {
        const updated = {
        ...prev,
        [index]: {
          useVariantTracking: true,
            packets: deepCopiedPackets,
          },
        };
        return updated;
      });
    } else {
      console.error("Failed to save packets: invalid index", {
        productItem,
        packetModalProduct,
        index,
      });
    }
    // Don't auto-close here to allow "Save & Next" flow
  };

  const handleCreateProductType = async (productTypeData) => {
    setIsCreatingProductType(true);
    try {
      const newProductType = await createProductType(productTypeData);
      setProductTypesList([...productTypesList, newProductType]);
      setIsProductTypeModalOpen(false);
    } catch (error) {
      console.error("Error creating product type:", error);
      showError(error.message || "Failed to create product type");
    } finally {
      setIsCreatingProductType(false);
    }
  };

  const handleImageChange = (e, productIndex) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    const maxSize = 5 * 1024 * 1024; // 5MB
    const maxImages = 20;

    // Get current images for this product - count both existing and new images
    const existingPreviews = imagePreviews[productIndex] || {};
    const existingImageKeys = Object.keys(existingPreviews).filter((key) =>
      key.startsWith("existing-")
    );
    const existingCount = existingImageKeys.length;
    const currentImages = productImages[productIndex] || [];
    const newFilesCount = currentImages.length;
    const totalCurrentCount = existingCount + newFilesCount;

    if (totalCurrentCount + files.length > maxImages) {
      showWarning(
        `Maximum ${maxImages} images allowed per product. You currently have ${totalCurrentCount} image(s) (${existingCount} existing + ${newFilesCount} new).`
      );
      e.target.value = "";
      return;
    }

    const validFiles = [];
    const invalidFiles = [];

    files.forEach((file) => {
      // Validate file type
      if (!validTypes.includes(file.type)) {
        invalidFiles.push(
          `${file.name}: Invalid file type. Only JPG, PNG, and WebP are allowed.`
        );
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
      showError(invalidFiles.join("\n"));
    }

    if (validFiles.length > 0) {
      // Add new files to existing ones
      const updatedImages = { ...productImages };
      updatedImages[productIndex] = [...currentImages, ...validFiles];
      setProductImages(updatedImages);

      // Create previews for new files
      const updatedPreviews = { ...imagePreviews };
      if (!updatedPreviews[productIndex]) {
        updatedPreviews[productIndex] = {};
      }

      validFiles.forEach((file) => {
        const fileId = getFileId(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreviews((prev) => ({
            ...prev,
            [productIndex]: {
              ...(prev[productIndex] || {}),
              [fileId]: reader.result,
            },
          }));
        };
        reader.onerror = () => {
          console.error("Error reading file:", file.name);
        };
        reader.readAsDataURL(file);
      });
    }

    // Reset input value to allow selecting the same file again
    e.target.value = "";
  };

  const handleRemoveImage = (productIndex, file) => {
    const fileId = getFileId(file);
    const updatedImages = { ...productImages };
    updatedImages[productIndex] = (updatedImages[productIndex] || []).filter(
      (f) => {
      const fId = getFileId(f);
      // Clean up object URL if it was created
      if (fId === fileId && f instanceof File) {
        const preview = imagePreviews[productIndex]?.[fileId];
          if (preview && preview.startsWith("blob:")) {
          URL.revokeObjectURL(preview);
        }
      }
      return fId !== fileId;
      }
    );
    setProductImages(updatedImages);

    const updatedPreviews = { ...imagePreviews };
    if (updatedPreviews[productIndex]) {
      // Clean up object URL before removing
      const preview = updatedPreviews[productIndex][fileId];
      if (preview && preview.startsWith("blob:")) {
        URL.revokeObjectURL(preview);
      }
      delete updatedPreviews[productIndex][fileId];
      if (Object.keys(updatedPreviews[productIndex]).length === 0) {
        delete updatedPreviews[productIndex];
      }
    }
    setImagePreviews(updatedPreviews);
  };

  const handleRemoveNewProductImage = (file) => {
    const fileId = getFileId(file);
    setNewProductImage((prev) => prev.filter((f) => getFileId(f) !== fileId));
    setNewProductImagePreview((prev) => {
      const newPreviews = { ...prev };
      delete newPreviews[fileId];
      return newPreviews;
    });
  };

  const handleNewProductImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    const maxSize = 5 * 1024 * 1024; // 5MB
    const maxImages = 20;

    // Check total image count
    const currentCount = newProductImage.length;
    if (currentCount + files.length > maxImages) {
      showWarning(
        `Maximum ${maxImages} images allowed per product. You currently have ${currentCount} image(s).`
      );
      e.target.value = "";
      return;
    }

    const validFiles = [];
    const invalidFiles = [];

    files.forEach((file) => {
      // Validate file type
      if (!validTypes.includes(file.type)) {
        invalidFiles.push(
          `${file.name}: Invalid file type. Only JPG, PNG, and WebP are allowed.`
        );
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
      showError(invalidFiles.join("\n"));
    }

    if (validFiles.length > 0) {
      // Add new files to existing ones
      const updatedImages = [...newProductImage, ...validFiles];
      setNewProductImage(updatedImages);

      // Create previews for new files
      validFiles.forEach((file) => {
        const fileId = getFileId(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setNewProductImagePreview((prev) => ({
            ...prev,
            [fileId]: reader.result,
          }));
        };
        reader.onerror = () => {
          console.error("Error reading file:", file.name);
        };
        reader.readAsDataURL(file);
      });
    }

    // Reset input value to allow selecting the same file again
    e.target.value = "";
  };

  // Inline editing handlers
  const handleCellClick = (rowIndex, fieldName) => {
    const currentValue = watch(`products.${rowIndex}.${fieldName}`);
    setEditingCell({ rowIndex, fieldName });
    if (fieldName === "primaryColor" || fieldName === "size") {
      // For arrays, show empty string to start adding
      setEditValue("");
    } else {
      setEditValue(currentValue || "");
    }
  };

  const handleCellChange = (value) => {
    setEditValue(value);
  };

  const handleCellSave = async (rowIndex, fieldName) => {
    // Validate based on field type
    let isValid = true;
    if (fieldName === "productName" || fieldName === "productCode") {
      if (!editValue.trim()) {
        isValid = false;
      }
    } else if (fieldName === "productType") {
      if (!editValue) {
        isValid = false;
      }
    } else if (fieldName === "costPrice") {
      const num = parseFloat(editValue);
      if (isNaN(num) || num < 0) {
        isValid = false;
      }
    } else if (fieldName === "quantity") {
      const num = parseInt(editValue);
      if (isNaN(num) || num < 1) {
        isValid = false;
      }
    }

    if (!isValid) {
      return; // Don't save invalid values
    }

    // Convert value based on field type
    let valueToSave = editValue;
    if (fieldName === "costPrice") {
      valueToSave = parseFloat(editValue) || 0;
    } else if (fieldName === "quantity") {
      valueToSave = parseInt(editValue) || 0;
    } else if (fieldName === "productName" || fieldName === "productCode") {
      valueToSave = editValue.trim();
    } else if (fieldName === "primaryColor" || fieldName === "size") {
      // For arrays, add the new value to existing array
      const currentArray = Array.isArray(watchedProducts[rowIndex]?.[fieldName])
        ? watchedProducts[rowIndex][fieldName]
        : watchedProducts[rowIndex]?.[fieldName]
        ? [watchedProducts[rowIndex][fieldName]]
        : [];
      const trimmedValue = editValue.trim();
      if (trimmedValue && !currentArray.includes(trimmedValue)) {
        valueToSave = [...currentArray, trimmedValue];
      } else {
        valueToSave = currentArray;
      }
    }

    // Update the form value - use shouldDirty and shouldValidate to trigger re-renders
    setValue(`products.${rowIndex}.${fieldName}`, valueToSave, {
      shouldDirty: true,
      shouldValidate: true,
      shouldTouch: true,
    });

    // For costPrice and quantity changes, force recalculation immediately
    if (fieldName === "costPrice" || fieldName === "quantity") {
      // Force recalculation by incrementing trigger state
      // This ensures grand total updates immediately
      setRecalcTrigger((prev) => prev + 1);

      // Also trigger validation to ensure form state is updated
      await Promise.all([
        trigger(`products.${rowIndex}.${fieldName}`),
        trigger("products"),
      ]);
    } else {
      // For other fields, just trigger validation
      await trigger(`products.${rowIndex}.${fieldName}`);
    }

    setEditingCell(null);
    setEditValue("");
  };

  const handleCellCancel = () => {
    setEditingCell(null);
    setEditValue("");
  };

  // Get product type name
  const getProductTypeName = (productTypeId) => {
    const type = productTypesList.find(
      (t) => (t._id || t.id) === productTypeId
    );
    return type?.name || productTypeId || "";
  };

  // Helper function to focus next input field
  const focusNextInput = (currentId, nextId) => {
    setTimeout(() => {
      const nextElement = document.getElementById(nextId);
      if (nextElement) {
        nextElement.focus();
        // For select elements, we might want to open them
        if (nextElement.tagName === "SELECT") {
          nextElement.focus();
        }
      }
    }, 0);
  };

  const submitHandler = handleSubmit((values) => {
    // Validate that at least one box is specified
    if (totalBoxes <= 0) {
      setBoxError("You must specify at least one box to create an order");
      // Scroll to the box section
      const boxSection = document.getElementById("total-boxes");
      if (boxSection) {
        boxSection.scrollIntoView({ behavior: "smooth", block: "center" });
        boxSection.focus();
      }
      return; // Prevent submission
    }

    // Clear box error if validation passes
    setBoxError(null);

    // Validate packet configurations for all items that use variant tracking
    const mismatchItems = [];
    values.products.forEach((product, index) => {
      if (productPackets[index]?.useVariantTracking) {
        const packets = productPackets[index]?.packets || [];
        let totalConfigured = 0;
        packets.forEach((p) => {
          p.composition?.forEach((c) => {
            if (c.color && c.size && c.quantity > 0) {
              totalConfigured += parseInt(c.quantity) || 0;
            }
          });
        });

        if (totalConfigured !== (parseInt(product.quantity) || 0)) {
          mismatchItems.push({
            name: product.productName,
            code: product.productCode,
            configured: totalConfigured,
            actual: product.quantity,
          });
        }
      }
    });

    if (mismatchItems.length > 0) {
      const errorMsg = mismatchItems
        .map(
          (item) =>
            `"${item.name}" (${item.code}): Configured ${item.configured} of ${item.actual} units`
        )
        .join("\n");

      showError(
        `Quantity mismatch in packet configuration:\n${errorMsg}\n\nPlease ensure all units are assigned to packets or loose items.`
      );
      return; // Prevent submission
    }

    // Calculate grand total for discount calculation - use same logic as display
    const grandTotal = values.products.reduce((sum, p) => {
      const costPrice =
        typeof p.costPrice === "number"
          ? p.costPrice
          : parseFloat(p.costPrice) || 0;
      const quantity = p.quantity || 0;
      return sum + costPrice * quantity;
    }, 0);

    // Calculate discount amount based on current discount type and value
    // Round to 2 decimal places to avoid precision issues
    let calculatedDiscount =
      discountType === "percentage"
        ? (grandTotal * (parseFloat(discountValue) || 0)) / 100
        : parseFloat(discountValue) || 0;

    // Round to 2 decimal places to ensure precision
    const discountAmount = Math.round(calculatedDiscount * 100) / 100;

    // Validate discount doesn't exceed grand total
    if (discountAmount > grandTotal) {
      showError(
        discountType === "percentage"
          ? `Discount percentage results in an amount (${discountAmount.toFixed(2)}) that exceeds the grand total (${grandTotal.toFixed(2)}). Maximum allowed: 100%`
          : `Discount amount (${discountAmount.toFixed(2)}) cannot exceed the grand total (${grandTotal.toFixed(2)})`
      );
      return; // Prevent submission
    }

    // Validate percentage doesn't exceed 100%
    if (discountType === "percentage" && parseFloat(discountValue) > 100) {
      showError("Discount percentage cannot exceed 100%");
      return; // Prevent submission
    }

    // Create boxes array with just box numbers (no items per box)
    const boxes = [];
    if (totalBoxes > 0) {
      for (let i = 1; i <= totalBoxes; i++) {
        boxes.push({
          boxNumber: i,
          // itemsPerBox is optional and not tracked anymore
        });
      }
    }

    const items = values.products.map((product, index) => {
      const item = {
        productName: product.productName,
        productCode: product.productCode,
        productType: product.productType,
        costPrice:
          typeof product.costPrice === "number"
            ? product.costPrice
            : parseFloat(product.costPrice) || 0,
        quantity: product.quantity,
        boxes: boxes, // All items get the same boxes array (just box numbers)
        unitWeight: 0,
      };

      // ALWAYS preserve existing productImage when updating (unless new images are being uploaded)
      // Match by productCode to handle cases where items are reordered or new items are added
      if (initialOrder && initialOrder.items && initialOrder.items.length > 0) {
        // Try to find matching item by productCode first (more reliable)
        const matchingItem = initialOrder.items.find(
          (existingItem) => existingItem.productCode === product.productCode
        );

        // If no match by productCode, try by index (for items that might have been reordered)
        const existingItem =
          matchingItem ||
          (index < initialOrder.items.length
            ? initialOrder.items[index]
            : null);

        if (existingItem) {
          // Preserve existing images that haven't been removed by user
          // New images will be appended by the backend upload route, not replacing existing ones
          let existingImages = [];

          // Priority 1: Get from imagePreviews (user can remove images here, so this reflects current state)
          if (imagePreviews[index]) {
            const existingPreviews = imagePreviews[index];
            const existingImageKeys = Object.keys(existingPreviews).filter(
              (key) => key.startsWith("existing-")
            );
            existingImages = existingImageKeys
              .sort((a, b) => {
                // Sort by index to maintain order
                const aIndex = parseInt(a.replace("existing-", ""));
                const bIndex = parseInt(b.replace("existing-", ""));
                return aIndex - bIndex;
              })
              .map((key) => existingPreviews[key])
              .filter(
                (url) => url && typeof url === "string" && url.trim() !== ""
              );
          }
          // Priority 2: Fallback to ref (stored during initialization, contains all original URLs)
          if (
            existingImages.length === 0 &&
            initialImageUrlsRef.current[index]
          ) {
            const refImages = initialImageUrlsRef.current[index];
            existingImages = Array.isArray(refImages) ? refImages : [refImages];
          }
          // Priority 3: Fallback to existingItem.productImage directly
          if (existingImages.length === 0 && existingItem.productImage) {
            existingImages = Array.isArray(existingItem.productImage)
              ? existingItem.productImage
              : [existingItem.productImage];
          }

          // Set productImage as array (backend now expects array)
          if (existingImages.length > 0) {
            item.productImage = existingImages;
          }
        }
      }

      if (
        product.primaryColor &&
        Array.isArray(product.primaryColor) &&
        product.primaryColor.length > 0
      ) {
        item.primaryColor = product.primaryColor
          .filter((c) => c && typeof c === "string" && c.trim())
          .map((c) => c.trim());
      } else if (
        product.primaryColor &&
        typeof product.primaryColor === "string" &&
        product.primaryColor.trim() !== ""
      ) {
        item.primaryColor = [product.primaryColor.trim()];
      }

      if (
        product.size &&
        Array.isArray(product.size) &&
        product.size.length > 0
      ) {
        item.size = product.size
          .filter((s) => s && typeof s === "string" && s.trim())
          .map((s) => s.trim());
      } else if (
        product.size &&
        typeof product.size === "string" &&
        product.size.trim() !== ""
      ) {
        item.size = [product.size.trim()];
      }

      // Add packet configuration if variant tracking is enabled
      if (productPackets[index]?.useVariantTracking) {
        item.useVariantTracking = true;
        item.packets = productPackets[index]?.packets || [];
      }

      return item;
    });

    const payload = {
      date: values.date,
      logisticsCompany: values.logisticsCompany,
      items,
      totalDiscount: discountAmount, // Use calculated discount amount
    };

    // Store the submit data and show confirmation dialog
    setPendingSubmit({ payload, productImages });
    setShowConfirmDialog(true);
  });

  // Handle confirmed submission
  const handleConfirmedSubmit = () => {
    if (pendingSubmit) {
      setShowConfirmDialog(false);
      onSubmit(pendingSubmit.payload, pendingSubmit.productImages);
      setPendingSubmit(null);
    }
  };

  // Handle cancel confirmation
  const handleCancelConfirm = () => {
    setShowConfirmDialog(false);
    setPendingSubmit(null);
  };

  return (
    <div className="space-y-6">
      {/* Keyboard Shortcuts Help */}
      {showShortcuts && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm shadow-sm">
          <div className="font-semibold mb-3 text-blue-900 flex items-center gap-2">
            <Keyboard className="h-4 w-4" />
            Keyboard Shortcuts
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-white border border-blue-300 rounded text-xs font-mono">
                Ctrl/Cmd
              </kbd>
              <span>+</span>
              <kbd className="px-2 py-1 bg-white border border-blue-300 rounded text-xs font-mono">
                Enter
              </kbd>
              <span className="text-slate-600">- Submit form</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-white border border-blue-300 rounded text-xs font-mono">
                Ctrl/Cmd
              </kbd>
              <span>+</span>
              <kbd className="px-2 py-1 bg-white border border-blue-300 rounded text-xs font-mono">
                K
              </kbd>
              <span className="text-slate-600">- Toggle shortcuts</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-white border border-blue-300 rounded text-xs font-mono">
                Esc
              </kbd>
              <span className="text-slate-600">- Close shortcuts</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-white border border-blue-300 rounded text-xs font-mono">
                Tab
              </kbd>
              <span className="text-slate-600">- Navigate fields</span>
            </div>
          </div>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submitHandler(e);
        }}
        onKeyDown={(e) => {
          // Prevent Enter key from submitting form directly (unless it's Ctrl/Cmd+Enter)
          if (e.key === "Enter" && !e.ctrlKey && !e.metaKey) {
            // Check if the target is an input, textarea, or select
            const target = e.target;
            if (
              target.tagName === "INPUT" ||
              target.tagName === "TEXTAREA" ||
              target.tagName === "SELECT"
            ) {
              // Let individual field handlers manage Enter key behavior
              // Don't prevent default here - let the field handlers do it
              return;
            }
            // If Enter is pressed outside of form fields, prevent form submission
            e.preventDefault();
          }
        }}
        className="space-y-6"
      >
        {/* Order Header Section */}
        <div className="bg-slate-50 rounded-lg p-4 space-y-4 border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">
            Order Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="date" className={labelClasses}>
                Dispatch Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="date"
                className={`${inputClasses} ${
                  errors.date
                    ? "border-red-500 focus:ring-red-500"
                    : "border-slate-300"
                }`}
                {...register("date")}
                aria-invalid={errors.date ? "true" : "false"}
                aria-describedby={errors.date ? "date-error" : undefined}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    focusNextInput("date", "logisticsCompany");
                  }
                }}
              />
              {errors.date && (
                <p
                  id="date-error"
                  className="text-xs text-red-600 mt-1"
                  role="alert"
                >
                  {errors.date.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="logisticsCompany" className={labelClasses}>
                Logistics Company <span className="text-red-500">*</span>
              </label>
              <select
                id="logisticsCompany"
                className={`${selectClasses} ${
                  errors.logisticsCompany
                    ? "border-red-500 focus:ring-red-500"
                    : "border-slate-300"
                }`}
                {...register("logisticsCompany")}
                aria-invalid={errors.logisticsCompany ? "true" : "false"}
                aria-describedby={
                  errors.logisticsCompany ? "logistics-error" : undefined
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    focusNextInput("logisticsCompany", "new-product-name");
                  }
                }}
              >
                <option value="">Select logistics company</option>
                {logisticsCompanies.map((company) => (
                  <option
                    key={company._id || company.id}
                    value={company._id || company.id}
                  >
                    {company.name}
                  </option>
                ))}
              </select>
              {errors.logisticsCompany && (
                <p
                  id="logistics-error"
                  className="text-xs text-red-600 mt-1"
                  role="alert"
                >
                  {errors.logisticsCompany.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Add New Product Form Section */}
        <div className="bg-white rounded-lg p-4 space-y-4 border border-slate-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">
              Add New Product
            </h3>
            <span className="text-sm text-slate-500">
              {fields.length} product{fields.length !== 1 ? "s" : ""} in order
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label htmlFor="new-product-name" className={labelClasses}>
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                id="new-product-name"
                type="text"
                className={`${inputClasses} ${
                  newProductErrors.productName
                    ? "border-red-500 focus:ring-red-500"
                    : "border-slate-300"
                }`}
                value={newProduct.productName}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, productName: e.target.value })
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    focusNextInput("new-product-name", "new-product-code");
                  }
                }}
              />
              {newProductErrors.productName && (
                <p className="text-xs text-red-600 mt-1">
                  {newProductErrors.productName}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="new-product-code" className={labelClasses}>
                SKU/Product Code <span className="text-red-500">*</span>
              </label>
              <input
                id="new-product-code"
                type="text"
                className={`${inputClasses} ${
                  newProductErrors.productCode
                    ? "border-red-500 focus:ring-red-500"
                    : "border-slate-300"
                }`}
                value={newProduct.productCode}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, productCode: e.target.value })
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    focusNextInput("new-product-code", "new-product-type");
                  }
                }}
              />
              {newProductErrors.productCode && (
                <p className="text-xs text-red-600 mt-1">
                  {newProductErrors.productCode}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="new-product-type" className={labelClasses}>
                Product Type <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <select
                  id="new-product-type"
                  className={`${selectClasses} flex-1 ${
                    newProductErrors.productType
                      ? "border-red-500 focus:ring-red-500"
                      : "border-slate-300"
                  }`}
                  value={newProduct.productType}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      productType: e.target.value,
                    })
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      focusNextInput("new-product-type", "new-cost-price");
                    }
                  }}
                >
                  <option value="">Select type</option>
                  {productTypesList.map((type) => (
                    <option
                      key={type._id || type.id}
                      value={type._id || type.id}
                    >
                      {type.name}
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsProductTypeModalOpen(true)}
                  className="px-3"
                  title="Add new product type"
                  aria-label="Add new product type"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {newProductErrors.productType && (
                <p className="text-xs text-red-600 mt-1">
                  {newProductErrors.productType}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="new-cost-price" className={labelClasses}>
                Cost Price <span className="text-red-500">*</span>
              </label>
              <input
                id="new-cost-price"
                type="number"
                step="0.01"
                min="0"
                className={`${inputClasses} ${
                  newProductErrors.costPrice
                    ? "border-red-500 focus:ring-red-500"
                    : "border-slate-300"
                }`}
                value={newProduct.costPrice}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, costPrice: e.target.value })
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    focusNextInput("new-cost-price", "new-primary-color");
                  }
                }}
              />
              {newProductErrors.costPrice && (
                <p className="text-xs text-red-600 mt-1">
                  {newProductErrors.costPrice}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="new-primary-color" className={labelClasses}>
                Primary Color
              </label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    id="new-primary-color"
                    type="text"
                    className={`${inputClasses} border-slate-300 flex-1`}
                    placeholder="Enter color and press Enter"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const value = e.target.value.trim();
                        if (value && !newProduct.primaryColor.includes(value)) {
                          setNewProduct({
                            ...newProduct,
                            primaryColor: [...newProduct.primaryColor, value],
                          });
                          e.target.value = "";
                        }
                        // Keep focus on color input (don't move to next field)
                        e.target.focus();
                      } else if (e.key === "Tab" && !e.shiftKey) {
                        // Allow Tab to move to next field
                        e.preventDefault();
                        focusNextInput("new-primary-color", "new-size");
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      const input =
                        document.getElementById("new-primary-color");
                      const value = input.value.trim();
                      if (value && !newProduct.primaryColor.includes(value)) {
                        setNewProduct({
                          ...newProduct,
                          primaryColor: [...newProduct.primaryColor, value],
                        });
                        input.value = "";
                        input.focus();
                      }
                    }}
                    className="px-3"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {newProduct.primaryColor.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {newProduct.primaryColor.map((color, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-xs"
                      >
                        {color}
                        <button
                          type="button"
                          onClick={() => {
                            setNewProduct({
                              ...newProduct,
                              primaryColor: newProduct.primaryColor.filter(
                                (_, i) => i !== idx
                              ),
                            });
                          }}
                          className="hover:text-blue-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="new-size" className={labelClasses}>
                Size
              </label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    id="new-size"
                    type="text"
                    className={`${inputClasses} border-slate-300 flex-1`}
                    placeholder="Enter size and press Enter"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const value = e.target.value.trim();
                        if (value && !newProduct.size.includes(value)) {
                          setNewProduct({
                            ...newProduct,
                            size: [...newProduct.size, value],
                          });
                          e.target.value = "";
                        }
                        // Keep focus on size input (don't move to next field)
                        e.target.focus();
                      } else if (e.key === "Tab" && !e.shiftKey) {
                        // Allow Tab to move to next field
                        focusNextInput("new-size", "new-quantity");
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      const input = document.getElementById("new-size");
                      const value = input.value.trim();
                      if (value && !newProduct.size.includes(value)) {
                        setNewProduct({
                          ...newProduct,
                          size: [...newProduct.size, value],
                        });
                        input.value = "";
                        input.focus();
                      }
                    }}
                    className="px-3"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {newProduct.size.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {newProduct.size.map((size, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-md text-xs"
                      >
                        {size}
                        <button
                          type="button"
                          onClick={() => {
                            setNewProduct({
                              ...newProduct,
                              size: newProduct.size.filter((_, i) => i !== idx),
                            });
                          }}
                          className="hover:text-green-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="new-quantity" className={labelClasses}>
                Quantity <span className="text-red-500">*</span>
              </label>
              <input
                id="new-quantity"
                type="number"
                min="1"
                className={`${inputClasses} ${
                  newProductErrors.quantity
                    ? "border-red-500 focus:ring-red-500"
                    : "border-slate-300"
                }`}
                value={newProduct.quantity}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, quantity: e.target.value })
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    // Focus on Add to Table button or back to product name
                    const addButton = document.querySelector(
                      "[data-add-product-button]"
                    );
                    if (addButton) {
                      addButton.focus();
                    } else {
                      focusNextInput("new-quantity", "new-product-name");
                    }
                  }
                }}
              />
              {newProductErrors.quantity && (
                <p className="text-xs text-red-600 mt-1">
                  {newProductErrors.quantity}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="new-product-image" className={labelClasses}>
                  Product Images
                </label>
                <span className="text-xs text-slate-500">
                  {newProductImage.length} / 20 images
                </span>
              </div>

              {/* Image Gallery */}
              {newProductImage.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {newProductImage.map((file) => {
                    const fileId = getFileId(file);
                    const preview = newProductImagePreview[fileId];
                    return (
                      <div key={fileId} className="relative group">
                        <div className="h-16 w-16 overflow-hidden rounded border border-slate-300 bg-slate-50 flex items-center justify-center">
                          {preview ? (
                            <img
                              src={preview}
                              alt={file.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="text-[8px] text-slate-400 p-1 text-center">
                              Loading...
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveNewProductImage(file)}
                          className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
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
              <input
                id="new-product-image"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleNewProductImageChange}
                multiple
                className="hidden"
                disabled={newProductImage.length >= 20}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const input = document.getElementById("new-product-image");
                  if (input && !input.disabled) {
                    // Ensure multiple attribute is set
                    input.setAttribute("multiple", "");
                    input.multiple = true;
                    input.click();
                  }
                }}
                disabled={newProductImage.length >= 20}
                className="w-full"
              >
                <Plus className="h-3 w-3 mr-2" />
                {newProductImage.length === 0
                  ? "Select Multiple Images"
                  : "Add More Images"}
              </Button>
              <p className="text-xs text-slate-500 mt-1">
                <strong>Tip:</strong> Hold Ctrl (Windows) or Cmd (Mac) to select
                multiple images. Supported: JPG, PNG, WebP. Max 5MB per image.
              </p>
            </div>

            <div className="flex items-end">
              <Button
                type="button"
                onClick={handleAddProductToTable}
                className="w-full"
                variant="default"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add to Table
              </Button>
            </div>
          </div>
        </div>

        {/* Products Table Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">
              Products in Order
            </h3>
            {errors.products && (
              <p className="text-sm text-red-600">{errors.products.message}</p>
            )}
          </div>

          {fields.length === 0 ? (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-8 text-center">
              <p className="text-slate-500">
                No products added yet. Use the form above to add products.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-app-border">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-app-border text-sm">
                  <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Image</th>
                      <th className="px-4 py-3">Product Name</th>
                      <th className="px-4 py-3">SKU/Code</th>
                      <th className="px-4 py-3">Product Type</th>
                      <th className="px-4 py-3 text-right">Cost Price</th>
                      <th className="px-4 py-3">Primary Color</th>
                      <th className="px-4 py-3">Size</th>
                      <th className="px-4 py-3 text-right">Quantity</th>
                      <th className="px-4 py-3">Variants & Packets</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-app-border bg-white">
                    {fields.map((field, productIndex) => {
                      const product = watchedProducts?.[productIndex];
                      const productErrors = errors.products?.[productIndex];
                      const isEditing =
                        editingCell?.rowIndex === productIndex &&
                        editingCell?.fieldName;

                      return (
                        <tr
                          key={field.id}
                          className={`hover:bg-slate-50 transition-colors ${
                            isEditing ? "bg-blue-50" : ""
                          }`}
                        >
                          {/* Image Column */}
                          <td className="px-4 py-3">
                            {(() => {
                              const existingPreviews =
                                imagePreviews[productIndex] || {};
                              const existingImageKeys = Object.keys(
                                existingPreviews
                              ).filter((key) => key.startsWith("existing-"));
                              const newFiles =
                                productImages[productIndex] || [];

                              // Debug: Log what we have for this product
                              // Prepare images array for gallery component
                              const galleryImages = [
                                // Existing images from backend - sort by index to maintain order
                                ...existingImageKeys
                                  .sort((a, b) => {
                                    const aIndex =
                                      parseInt(a.replace("existing-", "")) || 0;
                                    const bIndex =
                                      parseInt(b.replace("existing-", "")) || 0;
                                    return aIndex - bIndex;
                                  })
                                  .map((key) => {
                                    const url = existingPreviews[key];
                                    if (
                                      !url ||
                                      typeof url !== "string" ||
                                      url.trim() === ""
                                    ) {
                                      return null;
                                    }
                                    return {
                                      id: key,
                                      url: url.trim(),
                                      isExisting: true,
                                    };
                                  })
                                  .filter((img) => img !== null), // Filter out any null entries
                                // New file images
                                ...newFiles.map((file) => {
                                  const fileId = getFileId(file);
                                  return {
                                    id: fileId,
                                    url:
                                      existingPreviews[fileId] ||
                                      URL.createObjectURL(file),
                                    isExisting: false,
                                    file: file,
                                  };
                                }),
                              ];

                              return (
                                <ImageGallery
                                  images={galleryImages}
                                  onRemove={(imageId) => {
                                    // Check if it's an existing image or a new file
                                    if (imageId.startsWith("existing-")) {
                                      // Remove existing image from previews
                                      const updatedPreviews = {
                                        ...imagePreviews,
                                      };
                                      if (updatedPreviews[productIndex]) {
                                        const newPreviews = {
                                          ...updatedPreviews[productIndex],
                                        };
                                        delete newPreviews[imageId];
                                        if (
                                          Object.keys(newPreviews).length === 0
                                        ) {
                                          delete updatedPreviews[productIndex];
                                        } else {
                                          updatedPreviews[productIndex] =
                                            newPreviews;
                                        }
                                      }
                                      setImagePreviews(updatedPreviews);
                                    } else {
                                      // Remove new file image
                                      const fileToRemove = newFiles.find(
                                        (f) => getFileId(f) === imageId
                                      );
                                      if (fileToRemove) {
                                        handleRemoveImage(
                                          productIndex,
                                          fileToRemove
                                        );
                                      }
                                    }
                                  }}
                                  onAdd={() => {
                                    const input = document.getElementById(
                                      `image-input-${productIndex}`
                                    );
                                    if (input) {
                                      input.setAttribute("multiple", "");
                                      input.multiple = true;
                                      input.click();
                                    }
                                  }}
                                  maxImages={20}
                                  showAddButton={true}
                                  emptyMessage="No images"
                                  title={`Product Images - ${
                                    product?.productName ||
                                    product?.productCode ||
                                    `Item ${productIndex + 1}`
                                  }`}
                                />
                              );
                            })()}

                            {/* Hidden File Input */}
                            <input
                              type="file"
                              accept="image/jpeg,image/jpg,image/png,image/webp"
                              onChange={(e) =>
                                handleImageChange(e, productIndex)
                              }
                              multiple
                              className="hidden"
                              id={`image-input-${productIndex}`}
                            />
                          </td>

                          {/* Product Name Column */}
                          <td className="px-4 py-3">
                            {isEditing &&
                            editingCell.fieldName === "productName" ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={editValue}
                                  onChange={(e) =>
                                    handleCellChange(e.target.value)
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      handleCellSave(
                                        productIndex,
                                        "productName"
                                      );
                                      // Focus next field
                                      setTimeout(() => {
                                        handleCellClick(
                                          productIndex,
                                          "productCode"
                                        );
                                      }, 100);
                                    } else if (e.key === "Escape") {
                                      handleCellCancel();
                                    }
                                  }}
                                  onBlur={() =>
                                    handleCellSave(productIndex, "productName")
                                  }
                                  className="w-full px-2 py-1 border border-blue-400 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  autoFocus
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleCellSave(productIndex, "productName")
                                  }
                                  className="h-6 w-6 p-0"
                                >
                                  <Save className="h-3 w-3" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={handleCellCancel}
                                  className="h-6 w-6 p-0"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <div
                                className={`cursor-pointer hover:bg-slate-100 rounded px-2 py-1 -mx-2 -my-1 ${
                                  productErrors?.productName
                                    ? "border border-red-300"
                                    : ""
                                }`}
                                onClick={() =>
                                  handleCellClick(productIndex, "productName")
                                }
                                title="Click to edit"
                              >
                                {product?.productName || (
                                  <span className="text-slate-400">—</span>
                                )}
                                {productErrors?.productName && (
                                  <p className="text-xs text-red-600 mt-1">
                                    {productErrors.productName.message}
                                  </p>
                                )}
                              </div>
                            )}
                          </td>

                          {/* SKU/Code Column */}
                          <td className="px-4 py-3">
                            {isEditing &&
                            editingCell.fieldName === "productCode" ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={editValue}
                                  onChange={(e) =>
                                    handleCellChange(e.target.value)
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      handleCellSave(
                                        productIndex,
                                        "productCode"
                                      );
                                      // Focus next field
                                      setTimeout(() => {
                                        handleCellClick(
                                          productIndex,
                                          "productType"
                                        );
                                      }, 100);
                                    } else if (e.key === "Escape") {
                                      handleCellCancel();
                                    }
                                  }}
                                  onBlur={() =>
                                    handleCellSave(productIndex, "productCode")
                                  }
                                  className="w-full px-2 py-1 border border-blue-400 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  autoFocus
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleCellSave(productIndex, "productCode")
                                  }
                                  className="h-6 w-6 p-0"
                                >
                                  <Save className="h-3 w-3" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={handleCellCancel}
                                  className="h-6 w-6 p-0"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <div
                                className={`cursor-pointer hover:bg-slate-100 rounded px-2 py-1 -mx-2 -my-1 ${
                                  productErrors?.productCode
                                    ? "border border-red-300"
                                    : ""
                                }`}
                                onClick={() =>
                                  handleCellClick(productIndex, "productCode")
                                }
                                title="Click to edit"
                              >
                                {product?.productCode || (
                                  <span className="text-slate-400">—</span>
                                )}
                                {productErrors?.productCode && (
                                  <p className="text-xs text-red-600 mt-1">
                                    {productErrors.productCode.message}
                                  </p>
                                )}
                              </div>
                            )}
                          </td>

                          {/* Product Type Column */}
                          <td className="px-4 py-3">
                            {isEditing &&
                            editingCell.fieldName === "productType" ? (
                              <div className="flex items-center gap-2">
                                <select
                                  value={editValue}
                                  onChange={(e) =>
                                    handleCellChange(e.target.value)
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      handleCellSave(
                                        productIndex,
                                        "productType"
                                      );
                                      // Focus next field
                                      setTimeout(() => {
                                        handleCellClick(
                                          productIndex,
                                          "costPrice"
                                        );
                                      }, 100);
                                    } else if (e.key === "Escape") {
                                      handleCellCancel();
                                    }
                                  }}
                                  onBlur={() =>
                                    handleCellSave(productIndex, "productType")
                                  }
                                  className="w-full px-2 py-1 border border-blue-400 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  autoFocus
                                >
                                  <option value="">Select type</option>
                                  {productTypesList.map((type) => (
                                    <option
                                      key={type._id || type.id}
                                      value={type._id || type.id}
                                    >
                                      {type.name}
                                    </option>
                                  ))}
                                </select>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleCellSave(productIndex, "productType")
                                  }
                                  className="h-6 w-6 p-0"
                                >
                                  <Save className="h-3 w-3" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={handleCellCancel}
                                  className="h-6 w-6 p-0"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <div
                                className={`cursor-pointer hover:bg-slate-100 rounded px-2 py-1 -mx-2 -my-1 ${
                                  productErrors?.productType
                                    ? "border border-red-300"
                                    : ""
                                }`}
                                onClick={() =>
                                  handleCellClick(productIndex, "productType")
                                }
                                title="Click to edit"
                              >
                                {getProductTypeName(product?.productType) || (
                                  <span className="text-slate-400">—</span>
                                )}
                                {productErrors?.productType && (
                                  <p className="text-xs text-red-600 mt-1">
                                    {productErrors.productType.message}
                                  </p>
                                )}
                              </div>
                            )}
                          </td>

                          {/* Cost Price Column */}
                          <td className="px-4 py-3 text-right">
                            {isEditing &&
                            editingCell.fieldName === "costPrice" ? (
                              <div className="flex items-center gap-2 justify-end">
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={editValue}
                                  onChange={(e) =>
                                    handleCellChange(e.target.value)
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      handleCellSave(productIndex, "costPrice");
                                      // Focus next field (quantity, skip color/size as they handle their own Enter)
                                      setTimeout(() => {
                                        handleCellClick(
                                          productIndex,
                                          "quantity"
                                        );
                                      }, 100);
                                    } else if (e.key === "Escape") {
                                      handleCellCancel();
                                    }
                                  }}
                                  onBlur={() =>
                                    handleCellSave(productIndex, "costPrice")
                                  }
                                  className="w-24 px-2 py-1 border border-blue-400 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                                  autoFocus
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleCellSave(productIndex, "costPrice")
                                  }
                                  className="h-6 w-6 p-0"
                                >
                                  <Save className="h-3 w-3" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={handleCellCancel}
                                  className="h-6 w-6 p-0"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <div
                                className={`cursor-pointer hover:bg-slate-100 rounded px-2 py-1 -mx-2 -my-1 inline-block ${
                                  productErrors?.costPrice
                                    ? "border border-red-300"
                                    : ""
                                }`}
                                onClick={() =>
                                  handleCellClick(productIndex, "costPrice")
                                }
                                title="Click to edit"
                              >
                                {product?.costPrice !== undefined &&
                                product?.costPrice !== null &&
                                product?.costPrice !== "" ? (
                                  parseFloat(product.costPrice).toFixed(2)
                                ) : (
                                  <span className="text-slate-400">—</span>
                                )}
                                {productErrors?.costPrice && (
                                  <p className="text-xs text-red-600 mt-1">
                                    {productErrors.costPrice.message}
                                  </p>
                                )}
                              </div>
                            )}
                          </td>

                          {/* Primary Color Column */}
                          <td className="px-4 py-3">
                            {isEditing &&
                            editingCell.fieldName === "primaryColor" ? (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={editValue}
                                    onChange={(e) =>
                                      handleCellChange(e.target.value)
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        e.preventDefault();
                                        handleCellSave(
                                          productIndex,
                                          "primaryColor"
                                        );
                                        setEditValue("");
                                        // Keep focus on color input (don't move to next field)
                                        e.target.focus();
                                      } else if (e.key === "Escape") {
                                        handleCellCancel();
                                      } else if (
                                        e.key === "Tab" &&
                                        !e.shiftKey
                                      ) {
                                        e.preventDefault();
                                        handleCellSave(
                                          productIndex,
                                          "primaryColor"
                                        );
                                        setEditValue("");
                                        // Focus on size input
                                        setTimeout(() => {
                                          handleCellClick(productIndex, "size");
                                        }, 100);
                                      }
                                    }}
                                    placeholder="Enter color and press Enter"
                                    className="w-full px-2 py-1 border border-blue-400 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    autoFocus
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      handleCellSave(
                                        productIndex,
                                        "primaryColor"
                                      );
                                      setEditValue("");
                                    }}
                                    className="h-6 w-6 p-0"
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleCellCancel}
                                    className="h-6 w-6 p-0"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                                {Array.isArray(product?.primaryColor) &&
                                  product.primaryColor.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                      {product.primaryColor.map(
                                        (color, idx) => (
                                      <span
                                        key={idx}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs"
                                      >
                                        {color}
                                        <button
                                          type="button"
                                          onClick={() => {
                                                const updated =
                                                  product.primaryColor.filter(
                                                    (_, i) => i !== idx
                                                  );
                                                setValue(
                                                  `products.${productIndex}.primaryColor`,
                                                  updated
                                                );
                                          }}
                                          className="hover:text-blue-600"
                                        >
                                          <X className="h-2.5 w-2.5" />
                                        </button>
                                      </span>
                                        )
                                      )}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div
                                className="cursor-pointer hover:bg-slate-100 rounded px-2 py-1 -mx-2 -my-1 min-h-[24px]"
                                onClick={() =>
                                  handleCellClick(productIndex, "primaryColor")
                                }
                                title={
                                  Array.isArray(product?.primaryColor) &&
                                  product.primaryColor.length > 0
                                    ? `All colors: ${product.primaryColor.join(
                                        ", "
                                      )}`
                                    : "Click to add/edit colors"
                                }
                              >
                                {Array.isArray(product?.primaryColor) &&
                                product.primaryColor.length > 0 ? (
                                  <div className="flex flex-wrap gap-1 max-w-[200px]">
                                    {product.primaryColor
                                      .slice(0, 2)
                                      .map((color, idx) => (
                                      <span
                                        key={idx}
                                        className="inline-block px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs truncate max-w-[90px]"
                                        title={color}
                                      >
                                        {color}
                                      </span>
                                    ))}
                                    {product.primaryColor.length > 2 && (
                                      <span
                                        className="inline-block px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs"
                                        title={`+${
                                          product.primaryColor.length - 2
                                        } more: ${product.primaryColor
                                          .slice(2)
                                          .join(", ")}`}
                                      >
                                        +{product.primaryColor.length - 2}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-slate-400">—</span>
                                )}
                              </div>
                            )}
                          </td>

                          {/* Size Column */}
                          <td className="px-4 py-3">
                            {isEditing && editingCell.fieldName === "size" ? (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={editValue}
                                    onChange={(e) =>
                                      handleCellChange(e.target.value)
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        e.preventDefault();
                                        handleCellSave(productIndex, "size");
                                        setEditValue("");
                                        // Keep focus on size input (don't move to next field)
                                        e.target.focus();
                                      } else if (e.key === "Escape") {
                                        handleCellCancel();
                                      } else if (
                                        e.key === "Tab" &&
                                        !e.shiftKey
                                      ) {
                                        e.preventDefault();
                                        handleCellSave(productIndex, "size");
                                        setEditValue("");
                                        // Focus on quantity input
                                        setTimeout(() => {
                                          handleCellClick(
                                            productIndex,
                                            "quantity"
                                          );
                                        }, 100);
                                      }
                                    }}
                                    placeholder="Enter size and press Enter"
                                    className="w-full px-2 py-1 border border-blue-400 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    autoFocus
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      handleCellSave(productIndex, "size");
                                      setEditValue("");
                                    }}
                                    className="h-6 w-6 p-0"
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleCellCancel}
                                    className="h-6 w-6 p-0"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                                {Array.isArray(product?.size) &&
                                  product.size.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {product.size.map((size, idx) => (
                                      <span
                                        key={idx}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs"
                                      >
                                        {size}
                                        <button
                                          type="button"
                                          onClick={() => {
                                              const updated =
                                                product.size.filter(
                                                  (_, i) => i !== idx
                                                );
                                              setValue(
                                                `products.${productIndex}.size`,
                                                updated
                                              );
                                          }}
                                          className="hover:text-green-600"
                                        >
                                          <X className="h-2.5 w-2.5" />
                                        </button>
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div
                                className="cursor-pointer hover:bg-slate-100 rounded px-2 py-1 -mx-2 -my-1 min-h-[24px]"
                                onClick={() =>
                                  handleCellClick(productIndex, "size")
                                }
                                title={
                                  Array.isArray(product?.size) &&
                                  product.size.length > 0
                                    ? `All sizes: ${product.size.join(", ")}`
                                    : "Click to add/edit sizes"
                                }
                              >
                                {Array.isArray(product?.size) &&
                                product.size.length > 0 ? (
                                  <div className="flex flex-wrap gap-1 max-w-[200px]">
                                    {product.size
                                      .slice(0, 2)
                                      .map((size, idx) => (
                                      <span
                                        key={idx}
                                        className="inline-block px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs truncate max-w-[90px]"
                                        title={size}
                                      >
                                        {size}
                                      </span>
                                    ))}
                                    {product.size.length > 2 && (
                                      <span
                                        className="inline-block px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs"
                                        title={`+${
                                          product.size.length - 2
                                        } more: ${product.size
                                          .slice(2)
                                          .join(", ")}`}
                                      >
                                        +{product.size.length - 2}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-slate-400">—</span>
                                )}
                              </div>
                            )}
                          </td>

                          {/* Quantity Column */}
                          <td className="px-4 py-3 text-right">
                            {isEditing &&
                            editingCell.fieldName === "quantity" ? (
                              <div className="flex items-center gap-2 justify-end">
                                <input
                                  type="number"
                                  min="1"
                                  value={editValue}
                                  onChange={(e) =>
                                    handleCellChange(e.target.value)
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      handleCellSave(productIndex, "quantity");
                                      // Focus next product's first field, or wrap around
                                      setTimeout(() => {
                                        if (productIndex < fields.length - 1) {
                                          handleCellClick(
                                            productIndex + 1,
                                            "productName"
                                          );
                                        } else {
                                          // Last product, focus back to first product's name
                                          handleCellClick(0, "productName");
                                        }
                                      }, 100);
                                    } else if (e.key === "Escape") {
                                      handleCellCancel();
                                    }
                                  }}
                                  onBlur={() =>
                                    handleCellSave(productIndex, "quantity")
                                  }
                                  className="w-20 px-2 py-1 border border-blue-400 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                                  autoFocus
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleCellSave(productIndex, "quantity")
                                  }
                                  className="h-6 w-6 p-0"
                                >
                                  <Save className="h-3 w-3" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={handleCellCancel}
                                  className="h-6 w-6 p-0"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <div
                                className={`cursor-pointer hover:bg-slate-100 rounded px-2 py-1 -mx-2 -my-1 inline-block ${
                                  productErrors?.quantity
                                    ? "border border-red-300"
                                    : ""
                                }`}
                                onClick={() =>
                                  handleCellClick(productIndex, "quantity")
                                }
                                title="Click to edit"
                              >
                                {product?.quantity || (
                                  <span className="text-slate-400">—</span>
                                )}
                                {productErrors?.quantity && (
                                  <p className="text-xs text-red-600 mt-1">
                                    {productErrors.quantity.message}
                                  </p>
                                )}
                              </div>
                            )}
                          </td>

                          {/* Variant Tracking & Packets Column */}
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-2">
                              {(() => {
                                const product = watchedProducts?.[productIndex];
                                const hasSizes =
                                  product?.size &&
                                  Array.isArray(product.size) &&
                                  product.size.length > 0;
                                const hasColors =
                                  product?.primaryColor &&
                                  Array.isArray(product.primaryColor) &&
                                  product.primaryColor.length > 0;
                                const canTrackVariants = hasSizes && hasColors;

                                return (
                                  <>
                                    {canTrackVariants ? (
                                      <div className="flex flex-col gap-2">
                                        {productPackets[productIndex]?.packets
                                          ?.length > 0 ? (
                                          <>
                                          <div className="flex items-center justify-between gap-2">
                                            <span className="text-xs font-medium text-slate-600">
                                                {productPackets[productIndex]
                                                  .packets[0].isLoose
                                                ? null
                                                  : `${
                                                      productPackets[
                                                        productIndex
                                                      ].packets.length
                                                    } Packet${
                                                      productPackets[
                                                        productIndex
                                                      ].packets.length !== 1
                                                        ? "s"
                                                        : ""
                                                    }`}
                                            </span>
                                            </div>
                                                <Button
                                                  type="button"
                                              variant="outline"
                                                  size="sm"
                                              onClick={() =>
                                                handleOpenPacketModal(
                                                  productIndex
                                                )
                                              }
                                              className="text-xs w-full justify-start text-slate-600"
                                            >
                                              <Pencil className="h-3.5 w-3.5 mr-2 text-blue-500" />
                                              Edit Configuration
                                                </Button>
                                          </>
                                        ) : (
                                          <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                              handleOpenPacketModal(
                                                productIndex
                                              )
                                            }
                                            className="text-xs w-full justify-start text-slate-600"
                                          >
                                            <Package className="h-3.5 w-3.5 mr-2 text-blue-500" />
                                            Configure
                                          </Button>
                                        )}

                                        {/* Variant Breakdown Display */}
                                        {(() => {
                                          const packets =
                                            productPackets[productIndex]
                                              ?.packets || [];
                                          if (packets.length === 0) return null;

                                          // Calculate breakdown
                                          const breakdown = {};
                                          let totalConfigured = 0;
                                          packets.forEach((p) => {
                                            p.composition?.forEach((c) => {
                                              if (
                                                c.color &&
                                                c.size &&
                                                c.quantity > 0
                                              ) {
                                                const key = `${c.color}-${c.size}`;
                                                const qty =
                                                  parseInt(c.quantity) || 0;
                                                breakdown[key] =
                                                  (breakdown[key] || 0) + qty;
                                                totalConfigured += qty;
                                              }
                                            });
                                          });

                                          const parts =
                                            Object.entries(breakdown);
                                          if (parts.length === 0) return null;

                                          // Check if configured quantity exceeds product quantity
                                          const productQuantity =
                                            product?.quantity || 0;
                                          const hasMismatch =
                                            totalConfigured !== productQuantity;

                                          return (
                                            <div className="flex flex-col gap-1.5">
                                              {hasMismatch && (
                                                <div className="flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1">
                                                  <AlertCircle className="h-3 w-3" />
                                                  <span>
                                                    Configured {totalConfigured}{" "}
                                                    of {productQuantity} items
                                                  </span>
                                                </div>
                                              )}
                                              <div className="flex flex-wrap gap-1">
                                                {parts.map(([key, qty]) => (
                                                  <span 
                                                    key={key} 
                                                    className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                                                      hasMismatch 
                                                        ? "bg-red-100 text-red-700 border-red-300"
                                                        : "bg-slate-100 text-slate-700 border-slate-200"
                                                    }`}
                                                  >
                                                    {key}: {qty}
                                                  </span>
                                                ))}
                                              </div>
                                            </div>
                                          );
                                        })()}
                                      </div>
                                    ) : (
                                      <p className="text-xs text-orange-600 flex items-center gap-1 opacity-70">
                                        <AlertCircle className="h-3 w-3" />
                                        <span>Add sizes & colors</span>
                                      </p>
                                    )}
                                  </>
                                );
                              })()}
                            </div>
                          </td>

                          {/* Actions Column */}
                          <td className="px-4 py-3 text-right">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveProduct(productIndex)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              aria-label={`Remove product ${productIndex + 1}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Order-Level Box Management Section */}
        {fields.length > 0 && (
          <div className="bg-slate-50 rounded-lg p-4 space-y-4 border border-slate-200">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Box Management
              </h3>
              <p className="text-xs text-slate-500 mt-1">Specify the total number of physical shipping boxes for this entire shipment.</p>
            </div>

            {(() => {
              // Calculate final amount after discount - this recalculates automatically
              // when grandTotal or discountAmount changes due to their useMemo dependencies
              const finalAmount = Math.max(0, grandTotal - discountAmount);

              return (
                <div className="space-y-4">
                  {/* Number of Boxes Input */}
                  <div>
                    <label htmlFor="total-boxes" className={labelClasses}>
                      Number of Boxes <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="total-boxes"
                      type="number"
                      min="1"
                      className={`${inputClasses} ${
                        boxError ? "border-red-500 focus:ring-red-500" : ""
                      }`}
                      value={totalBoxes}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "") {
                          setTotalBoxes("");
                        } else {
                          const numBoxes = parseInt(val);
                          setTotalBoxes(isNaN(numBoxes) ? 0 : numBoxes);
                        }
                        // Clear error when user enters specific valid number
                        const num = parseInt(val);
                        if (boxError && !isNaN(num) && num > 0) {
                          setBoxError(null);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          focusNextInput("total-boxes", "discount-value");
                        }
                      }}
                      aria-invalid={boxError ? "true" : "false"}
                      aria-describedby={boxError ? "box-error" : undefined}
                    />
                    {boxError && (
                      <p
                        id="box-error"
                        className="text-xs text-red-600 mt-1 font-medium"
                        role="alert"
                      >
                        {boxError}
                      </p>
                    )}
                  </div>

                  {/* Article Breakdown */}
                  {watchedProducts && watchedProducts.length > 0 && (
                    <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg border-2 border-slate-200 p-4">
                      <h3 className="text-sm font-semibold mb-3 text-slate-700">
                        Article Breakdown
                      </h3>
                      <div className="space-y-2">
                        {watchedProducts.map((product, index) => {
                          const costPrice =
                            typeof product?.costPrice === "number"
                              ? product.costPrice
                              : parseFloat(product?.costPrice) || 0;
                          const quantity = product?.quantity || 0;
                          const itemTotal = costPrice * quantity;

                          return (
                            <div
                              key={index}
                              className="flex justify-between items-center text-xs py-2 px-3 bg-white rounded border border-slate-200"
                            >
                              <span
                                className="truncate flex-1 mr-2 font-medium text-slate-700"
                                title={
                                  product.productName || product.productCode
                                }
                              >
                                {product.productName ||
                                  product.productCode ||
                                  `Product ${index + 1}`}
                              </span>
                              <span className="text-muted-foreground mr-3 whitespace-nowrap">
                                {costPrice.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}{" "}
                                × {quantity}
                              </span>
                              <span className="font-semibold text-blue-700 whitespace-nowrap">
                                {itemTotal.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Grand Total Display */}
                  <div className="bg-white rounded-lg border border-slate-300 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-700">
                        Grand Total
                      </span>
                      <span className="text-2xl font-semibold text-slate-900">
                        {grandTotal.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Discount Management */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <label className="text-sm font-medium text-slate-700">
                        Discount Type
                      </label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setDiscountType("percentage")}
                          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            discountType === "percentage"
                            ? "bg-blue-600 text-white"
                            : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50"
                            }`}
                        >
                          Percentage
                        </button>
                        <button
                          type="button"
                          onClick={() => setDiscountType("amount")}
                          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            discountType === "amount"
                            ? "bg-blue-600 text-white"
                            : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50"
                            }`}
                        >
                          Amount
                        </button>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="discount-value" className={labelClasses}>
                        Discount {discountType === "percentage" ? "(%)" : ""}
                      </label>
                      <input
                        id="discount-value"
                        type="number"
                        min="0"
                        step={discountType === "percentage" ? "0.1" : "0.01"}
                        max={discountType === "percentage" ? "100" : grandTotal > 0 ? grandTotal : undefined}
                        className={`${inputClasses} ${discountError ? "border-red-500 focus:ring-red-500" : ""}`}
                        value={discountValue}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "") {
                            setDiscountValue("");
                            setDiscountError("");
                          } else {
                            const value = parseFloat(val);
                            if (isNaN(value)) {
                              setDiscountValue(0);
                            } else {
                              setDiscountValue(value);
                              // Real-time validation
                              if (discountType === "percentage") {
                                if (value > 100) {
                                  setDiscountError("Discount percentage cannot exceed 100%");
                                } else {
                                  const calculatedDiscount = (grandTotal * value) / 100;
                                  if (calculatedDiscount > grandTotal) {
                                    setDiscountError("Discount amount cannot exceed grand total");
                                  } else {
                                    setDiscountError("");
                                  }
                                }
                              } else {
                                // Amount type
                                if (value > grandTotal) {
                                  setDiscountError(`Discount cannot exceed grand total (${grandTotal.toFixed(2)})`);
                                } else {
                                  setDiscountError("");
                                }
                              }
                            }
                          }
                        }}
                        placeholder={
                          discountType === "percentage" ? "0.0" : "0.00"
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            // Focus on submit button or back to first field
                            const submitButton = document.querySelector(
                              'button[type="submit"]'
                            );
                            if (submitButton) {
                              submitButton.focus();
                            }
                          }
                        }}
                      />
                      {discountError && (
                        <p className="text-xs text-red-600 font-semibold mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {discountError}
                        </p>
                      )}
                      {!discountError && discountType === "percentage" && discountValue > 0 && (
                        <p className="text-xs text-slate-500 mt-1">
                          Discount Amount:{" "}
                          {((grandTotal * discountValue) / 100).toLocaleString(
                            undefined,
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          )}
                        </p>
                      )}
                      {!discountError && discountType === "amount" && discountValue > 0 && grandTotal > 0 && (
                        <p className="text-xs text-slate-500 mt-1">
                          Remaining:{" "}
                          {(grandTotal - discountValue).toLocaleString(
                            undefined,
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          )}
                        </p>
                      )}
                    </div>

                    {/* Final Amount Display */}
                    {discountAmount > 0 && (
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200 p-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-700 font-medium">
                              Grand Total:
                            </span>
                            <span className="text-slate-900 font-semibold">
                              {grandTotal.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-700 font-medium">
                              Discount:
                            </span>
                            <span className="text-red-600 font-semibold">
                              -
                              {discountAmount.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-base pt-2 border-t border-blue-200">
                            <span className="text-slate-900 font-semibold">
                              Final Amount:
                            </span>
                            <span className="text-blue-700 font-bold text-lg">
                              {finalAmount.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isSaving}
            className="px-6"
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving || !!discountError} className="px-6">
            {isSaving
              ? initialOrder
                ? "Updating..."
                : "Creating..."
              : initialOrder
              ? "Update Order"
              : "Create Order"}
          </Button>
        </div>
      </form>

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

      {/* Confirmation Dialog */}
      <Modal
        open={showConfirmDialog}
        onClose={handleCancelConfirm}
        title={initialOrder ? "Confirm Update" : "Confirm Create"}
        description={
          initialOrder
            ? "Are you sure you want to update this dispatch order? This action cannot be undone."
            : "Are you sure you want to create this dispatch order? Please review all details before proceeding."
        }
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={handleCancelConfirm}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirmedSubmit}
              disabled={isSaving}
            >
              {isSaving
                ? initialOrder
                  ? "Updating..."
                  : "Creating..."
                : initialOrder
                  ? "Yes, Update Order"
                  : "Yes, Create Order"}
            </Button>
          </>
        }
      />

      {/* Packet Configuration Modal */}
      <PacketConfigurationModal
        isOpen={packetModalOpen}
        onClose={() => {
          setPacketModalOpen(false);
          setPacketModalProduct(null);
        }}
        onSave={handleSavePackets}
        items={watchedProducts.map((p, i) => {
          // Deep copy packets to ensure isolation between products
          const packets = productPackets[i]?.packets || [];
          const deepCopiedPackets = packets.map((packet) => ({
            packetNumber: packet.packetNumber,
            totalItems: parseInt(packet.totalItems) || 0,
            composition: (packet.composition || []).map((comp) => ({
              size: String(comp.size || "").trim(),
              color: String(comp.color || "").trim(),
              quantity: parseInt(comp.quantity) || 0,
            })),
            isLoose: Boolean(packet.isLoose),
          }));

          return {
          ...p,
          id: i.toString(),
          index: i,
            packets: deepCopiedPackets,
          };
        })}
        activeItemId={packetModalProduct?.index?.toString()}
      />
    </div>
  );
}
