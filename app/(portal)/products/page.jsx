"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import clsx from "clsx";
// QR Code functionality temporarily disabled - Download icon commented out
import { PlusCircle, Search, Pencil, RefreshCcw, Package, /* Download */ } from "lucide-react";
import ProductForm from "@/components/forms/ProductForm";
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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import {
  createProduct,
  getProducts,
  updateProduct,
  // QR Code functionality temporarily disabled
  // generateProductQr,
  uploadProductImage,
} from "@/lib/api/products";
import { getProductTypes } from "@/lib/api/productTypes";
import { showSuccess, showWarning, handleApiError } from "@/lib/utils/toast";
import { currency } from "@/lib/utils/currency";

export default function ProductsPage() {
  const { user } = useAuth();
  const supplierId = user?.supplierId || user?.supplier?.id;

  const [searchTerm, setSearchTerm] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  // QR Code functionality temporarily disabled
  // const [regeneratingQrFor, setRegeneratingQrFor] = useState(null);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });

  const {
    data: products,
    isLoading,
    mutate: refreshProducts,
  } = useSWR(
    supplierId ? ["products", supplierId] : null,
    () =>
      getProducts({
        supplier: supplierId,
        limit: 100,
      })
  );

  const { data: productTypes } = useSWR("product-types", () =>
    getProductTypes({ limit: 100 })
  );

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    if (!searchTerm) return products;

    const term = searchTerm.toLowerCase();
    return products.filter((product) =>
      [product.name, product.sku, product.category]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(term))
    );
  }, [products, searchTerm]);

  const handleCreate = () => {
    setModalMode("create");
    setSelectedProduct(null);
    setIsModalOpen(true);
    setFeedback(null);
  };

  const handleEdit = (product) => {
    setModalMode("edit");
    setSelectedProduct(product);
    setIsModalOpen(true);
    setFeedback(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = async (payload, imageFiles) => {
    try {
      setIsSaving(true);
      let productId;

      if (modalMode === "create") {
        const newProduct = await createProduct(payload);
        productId = newProduct._id || newProduct.id;
        showSuccess("Product created successfully.");
      } else if (selectedProduct) {
        productId = selectedProduct._id;
        await updateProduct(productId, payload);
        showSuccess("Product updated successfully.");
      }

      // Upload images if provided
      if (imageFiles && Array.isArray(imageFiles) && imageFiles.length > 0 && productId) {
        const uploadResults = {
          success: 0,
          failed: 0,
          errors: [],
        };

        setUploadProgress({ current: 0, total: imageFiles.length });

        // Upload images sequentially
        for (let i = 0; i < imageFiles.length; i++) {
          const imageFile = imageFiles[i];
          setUploadProgress({ current: i + 1, total: imageFiles.length });
          try {
            await uploadProductImage(productId, imageFile);
            uploadResults.success++;
          } catch (imageError) {
            uploadResults.failed++;
            uploadResults.errors.push(`${imageFile.name}: ${imageError.message || 'Upload failed'}`);
          }
        }

        setUploadProgress({ current: 0, total: 0 });

        // Set feedback based on upload results
        if (uploadResults.success > 0 && uploadResults.failed === 0) {
          showSuccess(`Product ${modalMode === "create" ? "created" : "updated"} and ${uploadResults.success} image(s) uploaded successfully.`);
        } else if (uploadResults.success > 0 && uploadResults.failed > 0) {
          showWarning(`Product saved. ${uploadResults.success} image(s) uploaded successfully, but ${uploadResults.failed} failed.`);
        } else {
          showWarning(`Product saved, but all ${uploadResults.failed} image upload(s) failed. ${uploadResults.errors.join('; ')}`);
        }
      } else if (imageFiles && Array.isArray(imageFiles) && imageFiles.length === 0) {
        // No images to upload, but product was saved - already showed success above
      }

      setIsModalOpen(false);
      await refreshProducts();
    } catch (error) {
      handleApiError(error, "Unable to save product. Try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // QR Code functionality temporarily disabled
  // const handleRegenerateQr = async (productId) => {
  //   try {
  //     setRegeneratingQrFor(productId);
  //     setFeedback(null);
  //     await generateProductQr(productId);
  //     setFeedback({
  //       type: "success",
  //       message: "QR code refreshed. Download or print the updated label before dispatching.",
  //     });
  //     await refreshProducts();
  //   } catch (error) {
  //     setFeedback({
  //       type: "danger",
  //       message: error.message || "Unable to regenerate QR code.",
  //     });
  //   } finally {
  //     setRegeneratingQrFor(null);
  //   }
  // };

  return (
    <div className="mx-auto max-w-7xl space-y-8 animate-in fade-in duration-500">
      {!supplierId && (
        <Alert
          variant="warning"
          title="Supplier profile missing"
          description="Your user account is not linked to a supplier record yet. Contact the KL Fashion admin team to connect your profile before managing products."
        />
      )}
      
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Product Catalog</h1>
          <p className="mt-2 text-slate-500">
            Manage your inventory, metadata, and pricing for KL Fashion.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={handleCreate} className="bg-app-accent hover:bg-app-accent/90 shadow-md shadow-app-accent/20">
            <PlusCircle className="mr-2 h-4.5 w-4.5" />
            Add New Product
          </Button>
        </div>
      </div>

      {feedback && (
        <Alert
          variant={feedback.type}
          title={feedback.type === "success" ? "Success" : "Notice"}
          description={
            <div>
              {feedback.message}
              {uploadProgress.total > 0 && (
                <div className="mt-2 text-sm">
                  Uploading images: {uploadProgress.current} / {uploadProgress.total}
                </div>
              )}
            </div>
          }
        />
      )}

      <Card className="border-none shadow-md shadow-slate-200/50 overflow-hidden">
        <CardHeader className="border-b border-slate-50 bg-slate-50/50 pb-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg">Product Registry</CardTitle>
              <CardDescription>
                {filteredProducts.length} items found in your catalog
              </CardDescription>
            </div>
            
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search name or SKU..."
                  className="pl-9 w-full sm:w-64 border-slate-200 focus:ring-app-accent/20"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 border-slate-200 text-slate-500 hover:text-app-accent hover:bg-slate-50"
                onClick={() => refreshProducts()}
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
              <p className="mt-4 text-sm font-medium text-slate-400">Loading products...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                <Package className="h-8 w-8 text-slate-200" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">No products found</h3>
              <p className="mt-1 text-sm text-slate-500 max-w-xs">
                {products.length === 0 
                  ? "Start building your catalog by adding your first product." 
                  : "We couldn't find any products matching your search criteria."}
              </p>
              {products.length === 0 && (
                <Button onClick={handleCreate} className="mt-6 bg-app-accent shadow-sm">
                  Add Your First Product
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/30">
                    <th className="px-6 py-4 font-semibold text-slate-900">Product Info</th>
                    <th className="px-6 py-4 font-semibold text-slate-900">SKU</th>
                    <th className="px-6 py-4 font-semibold text-slate-900">Category</th>
                    <th className="px-6 py-4 font-semibold text-slate-900 text-right">Cost Price</th>
                    <th className="px-6 py-4 font-semibold text-slate-900 text-right">Selling Price</th>
                    <th className="px-6 py-4 font-semibold text-slate-900">Status</th>
                    <th className="px-6 py-4 font-semibold text-slate-900 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredProducts.map((product) => (
                    <tr key={product._id} className="group transition-colors hover:bg-slate-50/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-center overflow-hidden flex-shrink-0 group-hover:border-app-accent/30 transition-colors shadow-sm">
                            {product.images?.[0] ? (
                              <img src={product.images[0]} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110" />
                            ) : (
                              <Package className="h-6 w-6 text-slate-300" />
                            )}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-slate-900 group-hover:text-app-accent transition-colors truncate">
                              {product.name}
                            </span>
                            <span className="text-[11px] text-slate-400 line-clamp-1 max-w-[200px]">
                              {product.description || "No description provided"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 rounded bg-slate-100 border border-slate-200 text-slate-700 font-mono text-[11px] font-bold">
                          {product.sku}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-slate-600 font-medium">
                          {product.category || "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-slate-900 font-semibold">
                        {product.pricing?.costPrice != null ? currency(product.pricing.costPrice) : "—"}
                      </td>
                      <td className="px-6 py-4 text-right text-slate-900 font-semibold">
                        {product.pricing?.sellingPrice != null ? currency(product.pricing.sellingPrice) : "—"}
                      </td>
                      <td className="px-6 py-4">
                        <Badge 
                          variant={product.isActive === false ? "warning" : "success"}
                          className="py-1 px-2.5 rounded-full text-[11px] font-bold tracking-wide shadow-sm ring-1 ring-inset ring-black/5"
                        >
                          {product.isActive === false ? "Inactive" : "Active"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 rounded-lg px-3 text-xs font-semibold text-slate-600 hover:text-app-accent hover:bg-app-accent/5"
                            onClick={() => handleEdit(product)}
                          >
                            <Pencil className="h-3.5 w-3.5 mr-1.5" />
                            Edit
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal
        open={isModalOpen}
        onClose={handleCloseModal}
        title={modalMode === "create" ? "Add New Product" : "Edit Product Profile"}
        description="Provide comprehensive details about your product for better visibility and management."
        size="lg"
        footer={null}
      >
        <div className="px-1 py-4">
          <ProductForm
            initialProduct={selectedProduct}
            onSubmit={handleSubmit}
            onCancel={handleCloseModal}
            productTypes={productTypes || []}
            isSaving={isSaving}
            supplierId={supplierId}
          />
        </div>
      </Modal>
    </div>
  );
}
