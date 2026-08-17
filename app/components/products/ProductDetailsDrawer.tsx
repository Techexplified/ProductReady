import { useState, useEffect } from "react";
import type { CompleteProductDetails } from "../../services/product-details.service";
import {
  X,
  ExternalLink,
  Copy,
  Sparkles,
  RefreshCw,
  Check,
  Package,
  Layers,
  Tag,
  Search,
  Eye,
  Shield,
  Clock,
  DollarSign,
  Box,
  FileText,
  Globe,
  Info,
  Truck,
  RotateCcw,
  Code,
} from "lucide-react";

interface ProductDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  product: CompleteProductDetails | null;
  isLoading: boolean;
  onRunAnalysis?: (productId: string) => void;
  onRefreshProduct?: (productId: string) => void;
}

export function ProductDetailsDrawer({
  isOpen,
  onClose,
  product,
  isLoading,
  onRunAnalysis,
  onRefreshProduct,
}: ProductDetailsDrawerProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"general" | "shopifyAi" | "variants" | "images" | "seo" | "ai">("general");
  const [copiedId, setCopiedId] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  useEffect(() => {
    if (product?.featuredImage) {
      setSelectedImage(product.featuredImage);
    } else if (product?.images?.[0]?.url) {
      setSelectedImage(product.images[0].url);
    }
  }, [product]);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, setFn: (val: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setFn(true);
    setTimeout(() => setFn(false), 2000);
  };

  const handleShopifyView = () => {
    if (!product) return;
    const rawId = product.shopifyId.includes("/") ? product.shopifyId.split("/").pop()! : product.shopifyId;
    window.open(`https://admin.shopify.com/store/products/${rawId}`, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans text-gray-900">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-2xl bg-white shadow-2xl border-l border-gray-200 flex flex-col transform transition-transform animate-slide-left">
          
          {/* 1. Header Bar */}
          <div className="px-6 py-4 bg-gray-50/80 border-b border-gray-200 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#4F46E5] shrink-0">
                <Package className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-gray-900 truncate">
                    {isLoading ? "Loading Product Details..." : product?.title || "Product Details"}
                  </h2>
                  {product && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        product.status === "ACTIVE"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-gray-100 text-gray-600 border-gray-200"
                      }`}
                    >
                      {product.status}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-500 font-mono truncate mt-0.5">
                  {product?.shopifyId || "GID loading..."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {product && (
                <button
                  onClick={() => copyToClipboard(product.shopifyId, setCopiedId)}
                  className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-200/60 rounded-xl transition-colors cursor-pointer"
                  title="Copy Product GID"
                >
                  {copiedId ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Loading Skeleton */}
          {isLoading || !product ? (
            <div className="p-8 space-y-6 flex-1 overflow-y-auto">
              <div className="h-48 bg-gray-100 rounded-2xl animate-pulse" />
              <div className="space-y-3">
                <div className="h-5 bg-gray-100 rounded-lg w-3/4 animate-pulse" />
                <div className="h-4 bg-gray-100 rounded-lg w-1/2 animate-pulse" />
              </div>
              <div className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
            </div>
          ) : (
            <>
              {/* 2. Action Toolbar */}
              <div className="px-6 py-3 bg-white border-b border-gray-100 flex items-center justify-between gap-3 text-xs overflow-x-auto">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onRunAnalysis && onRunAnalysis(product.id)}
                    className="px-3.5 py-1.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold rounded-xl shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Analyze Product</span>
                  </button>

                  <button
                    onClick={() => onRefreshProduct && onRefreshProduct(product.id)}
                    className="px-3 py-1.5 bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-700 font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-gray-500" />
                    <span>Refresh</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleShopifyView}
                    className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-gray-500" />
                    <span>Shopify Admin</span>
                  </button>
                </div>
              </div>

              {/* 3. Navigation Tabs */}
              <div className="px-6 border-b border-gray-200 bg-white">
                <div className="flex items-center gap-4 text-xs font-semibold overflow-x-auto">
                  <button
                    onClick={() => setActiveTab("general")}
                    className={`py-3 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                      activeTab === "general"
                        ? "border-[#4F46E5] text-[#4F46E5]"
                        : "border-transparent text-gray-500 hover:text-gray-800"
                    }`}
                  >
                    Overview & Details
                  </button>

                  <button
                    onClick={() => setActiveTab("shopifyAi")}
                    className={`py-3 border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                      activeTab === "shopifyAi"
                        ? "border-[#4F46E5] text-[#4F46E5]"
                        : "border-transparent text-gray-500 hover:text-gray-800"
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Shopify AI Raw Data</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("variants")}
                    className={`py-3 border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                      activeTab === "variants"
                        ? "border-[#4F46E5] text-[#4F46E5]"
                        : "border-transparent text-gray-500 hover:text-gray-800"
                    }`}
                  >
                    <span>Variants</span>
                    <span className="bg-gray-100 text-gray-600 text-[10px] px-2 py-0.2 rounded-full font-mono">
                      {product.variants.length}
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveTab("images")}
                    className={`py-3 border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                      activeTab === "images"
                        ? "border-[#4F46E5] text-[#4F46E5]"
                        : "border-transparent text-gray-500 hover:text-gray-800"
                    }`}
                  >
                    <span>Gallery</span>
                    <span className="bg-gray-100 text-gray-600 text-[10px] px-2 py-0.2 rounded-full font-mono">
                      {product.images.length}
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveTab("seo")}
                    className={`py-3 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                      activeTab === "seo"
                        ? "border-[#4F46E5] text-[#4F46E5]"
                        : "border-transparent text-gray-500 hover:text-gray-800"
                    }`}
                  >
                    SEO & Metafields
                  </button>

                  <button
                    onClick={() => setActiveTab("ai")}
                    className={`py-3 border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                      activeTab === "ai"
                        ? "border-[#4F46E5] text-[#4F46E5]"
                        : "border-transparent text-gray-500 hover:text-gray-800"
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5 text-emerald-500" />
                    <span>ProductReady AI</span>
                  </button>
                </div>
              </div>

              {/* 4. Tab Contents */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
                
                {/* TAB 1: GENERAL OVERVIEW */}
                {activeTab === "general" && (
                  <div className="space-y-6">
                    {/* Media Preview & Core Card */}
                    <div className="bg-gray-50/60 border border-gray-200/80 rounded-2xl p-4 flex flex-col sm:flex-row gap-4 items-start">
                      <div className="w-28 h-28 rounded-xl bg-white border border-gray-200 overflow-hidden shrink-0 shadow-2xs flex items-center justify-center">
                        {selectedImage ? (
                          <img src={selectedImage} alt={product.title} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-8 h-8 text-gray-300" />
                        )}
                      </div>

                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="bg-indigo-50 text-indigo-700 font-bold px-2.5 py-0.5 rounded-lg border border-indigo-100 text-[10px]">
                            {product.productType || "General"}
                          </span>
                          <span className="bg-gray-100 text-gray-600 font-mono text-[10px] px-2.5 py-0.5 rounded-lg border border-gray-200">
                            Vendor: {product.vendor || "N/A"}
                          </span>
                        </div>

                        <h3 className="font-bold text-gray-900 text-sm leading-snug">{product.title}</h3>
                        <p className="text-[11px] text-gray-500 font-mono">Handle: /{product.handle}</p>

                        <div className="flex items-center gap-4 pt-1 text-xs">
                          <div>
                            <span className="text-[10px] text-gray-400 block font-medium uppercase">Price</span>
                            <span className="font-extrabold text-gray-900">{product.price}</span>
                          </div>

                          {product.compareAtPrice && (
                            <div>
                              <span className="text-[10px] text-gray-400 block font-medium uppercase">Compare At</span>
                              <span className="line-through text-gray-400 font-semibold">{product.compareAtPrice}</span>
                            </div>
                          )}

                          <div>
                            <span className="text-[10px] text-gray-400 block font-medium uppercase">Total Stock</span>
                            <span className={`font-bold ${product.totalInventory > 0 ? "text-emerald-600" : "text-red-500"}`}>
                              {product.totalInventory} units
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Metadata Specs Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="bg-white border border-gray-200 p-3 rounded-xl space-y-0.5">
                        <span className="text-[10px] text-gray-400 uppercase font-semibold">Vendor</span>
                        <p className="font-bold text-gray-800 truncate">{product.vendor || "N/A"}</p>
                      </div>

                      <div className="bg-white border border-gray-200 p-3 rounded-xl space-y-0.5">
                        <span className="text-[10px] text-gray-400 uppercase font-semibold">Product Type</span>
                        <p className="font-bold text-gray-800 truncate">{product.productType || "General"}</p>
                      </div>

                      <div className="bg-white border border-gray-200 p-3 rounded-xl space-y-0.5">
                        <span className="text-[10px] text-gray-400 uppercase font-semibold">Created Date</span>
                        <p className="font-bold text-gray-800 truncate">
                          {product.createdAtShopify ? new Date(product.createdAtShopify).toLocaleDateString() : "—"}
                        </p>
                      </div>
                    </div>

                    {/* Description Section */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
                      <h4 className="font-bold text-gray-900 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-indigo-600" />
                        <span>Product Description</span>
                      </h4>
                      <div
                        className="text-xs text-gray-700 leading-relaxed max-h-60 overflow-y-auto pr-2 border-t border-gray-100 pt-3 prose prose-xs"
                        dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
                      />
                    </div>

                    {/* Store Policies */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-2">
                        <h4 className="font-bold text-gray-900 flex items-center gap-1.5">
                          <Truck className="w-4 h-4 text-indigo-600" />
                          <span>Shipping Policy</span>
                        </h4>
                        <p className="text-gray-600 text-[11px] leading-relaxed max-h-32 overflow-y-auto pr-1">
                          {product.shippingPolicy || "Not specified in Shopify store policies."}
                        </p>
                      </div>

                      <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-2">
                        <h4 className="font-bold text-gray-900 flex items-center gap-1.5">
                          <RotateCcw className="w-4 h-4 text-indigo-600" />
                          <span>Refund & Return Policy</span>
                        </h4>
                        <p className="text-gray-600 text-[11px] leading-relaxed max-h-32 overflow-y-auto pr-1">
                          {product.refundPolicy || "Not specified in Shopify store policies."}
                        </p>
                      </div>
                    </div>

                    {/* Tags & Collections */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Collections */}
                      <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-2">
                        <h4 className="font-bold text-gray-900 flex items-center gap-1.5">
                          <Layers className="w-4 h-4 text-indigo-600" />
                          <span>Collections ({product.collections.length})</span>
                        </h4>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {product.collections.length > 0 ? (
                            product.collections.map((col) => (
                              <span key={col.id} className="bg-indigo-50 text-indigo-700 text-[10px] font-semibold px-2.5 py-1 rounded-lg border border-indigo-100">
                                {col.title}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-400 font-normal">No collections assigned</span>
                          )}
                        </div>
                      </div>

                      {/* Tags */}
                      <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-2">
                        <h4 className="font-bold text-gray-900 flex items-center gap-1.5">
                          <Tag className="w-4 h-4 text-indigo-600" />
                          <span>Tags ({product.tags.length})</span>
                        </h4>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {product.tags.length > 0 ? (
                            product.tags.map((tag, idx) => (
                              <span key={idx} className="bg-gray-100 text-gray-700 text-[10px] font-medium px-2.5 py-1 rounded-lg border border-gray-200 flex items-center gap-1">
                                <span>{tag}</span>
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-400 font-normal">No tags assigned</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: SHOPIFY AI RAW DATA (NEW!) */}
                {activeTab === "shopifyAi" && (
                  <div className="space-y-5">
                    {/* Notice Banner */}
                    <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4 flex items-start gap-3">
                      <Sparkles className="w-5 h-5 text-[#4F46E5] shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <h4 className="font-bold text-gray-900 text-xs">
                          Shopify Admin Product Data Passed to AI
                        </h4>
                        <p className="text-[11px] text-gray-600 leading-relaxed">
                          Below are the exact product attributes, description, store policies, and metafields fetched live from the Shopify Admin GraphQL API that are submitted to the AI for audit.
                        </p>
                      </div>
                    </div>

                    {/* Attribute Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="bg-white border border-gray-200 p-3 rounded-xl">
                        <span className="text-[10px] text-gray-400 uppercase font-semibold block">Product Title</span>
                        <span className="font-bold text-gray-900 block truncate">{product.aiInputPayload?.name || product.title}</span>
                      </div>
                      <div className="bg-white border border-gray-200 p-3 rounded-xl">
                        <span className="text-[10px] text-gray-400 uppercase font-semibold block">Category</span>
                        <span className="font-bold text-gray-900 block truncate">{product.aiInputPayload?.category || product.productType}</span>
                      </div>
                      <div className="bg-white border border-gray-200 p-3 rounded-xl">
                        <span className="text-[10px] text-gray-400 uppercase font-semibold block">Price</span>
                        <span className="font-bold text-gray-900 block truncate">{product.aiInputPayload?.price || product.price}</span>
                      </div>
                      <div className="bg-white border border-gray-200 p-3 rounded-xl">
                        <span className="text-[10px] text-gray-400 uppercase font-semibold block">Vendor</span>
                        <span className="font-bold text-gray-900 block truncate">{product.aiInputPayload?.vendor || product.vendor}</span>
                      </div>
                      <div className="bg-white border border-gray-200 p-3 rounded-xl">
                        <span className="text-[10px] text-gray-400 uppercase font-semibold block">SKU</span>
                        <span className="font-mono text-gray-800 font-bold block truncate">{product.aiInputPayload?.sku || "N/A"}</span>
                      </div>
                      <div className="bg-white border border-gray-200 p-3 rounded-xl">
                        <span className="text-[10px] text-gray-400 uppercase font-semibold block">Images Count</span>
                        <span className="font-bold text-gray-900 block">{product.aiInputPayload?.imagesCount ?? product.images.length} images</span>
                      </div>
                    </div>

                    {/* Product Description */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-2">
                      <h4 className="font-bold text-gray-900 flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-indigo-600" />
                        <span>Description Sent to AI</span>
                      </h4>
                      <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 text-[11px] text-gray-700 font-mono leading-relaxed max-h-48 overflow-y-auto">
                        {product.aiInputPayload?.description || product.descriptionText || "No description text provided."}
                      </div>
                    </div>

                    {/* Shipping & Refund Policies */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-2">
                        <h4 className="font-bold text-gray-900 flex items-center gap-1.5">
                          <Truck className="w-4 h-4 text-indigo-600" />
                          <span>Store Shipping Policy</span>
                        </h4>
                        <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 text-[11px] text-gray-700 font-mono leading-relaxed max-h-40 overflow-y-auto">
                          {product.shippingPolicy || product.aiInputPayload?.shippingPolicy || "Not provided in store policies."}
                        </div>
                      </div>

                      <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-2">
                        <h4 className="font-bold text-gray-900 flex items-center gap-1.5">
                          <RotateCcw className="w-4 h-4 text-indigo-600" />
                          <span>Store Refund & Return Policy</span>
                        </h4>
                        <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 text-[11px] text-gray-700 font-mono leading-relaxed max-h-40 overflow-y-auto">
                          {product.refundPolicy || product.aiInputPayload?.refundPolicy || "Not provided in store policies."}
                        </div>
                      </div>
                    </div>

                    {/* Shopify Metafields */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
                      {(() => {
                        const formatMetafieldKey = (namespace: string, key: string): string => {
                          let k = key;
                          if (k.startsWith("shopify.")) k = k.replace("shopify.", "");
                          k = k.replace(/^shopify-/, "");
                          k = k.replace(/[-_]/g, " ");
                          return k
                            .split(" ")
                            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                            .join(" ");
                        };

                        const allMf = product.metafields || [];
                        const productMf = allMf.filter((m) => m.key !== "unavailable_reason" && !m.key.includes("unavailable"));

                        return (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="font-bold text-gray-900 flex items-center gap-1.5 text-xs">
                                <Box className="w-4 h-4 text-indigo-600" />
                                <span>Product & Category Metafields ({productMf.length})</span>
                              </h4>
                              {productMf.length > 0 && (
                                <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
                                  {productMf.length} Active
                                </span>
                              )}
                            </div>

                            {productMf.length > 0 ? (
                              <div className="overflow-x-auto border border-gray-200 rounded-xl">
                                <table className="w-full text-left text-[11px]">
                                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-mono">
                                    <tr>
                                      <th className="py-2 px-3">Metafield</th>
                                      <th className="py-2 px-3">Type</th>
                                      <th className="py-2 px-3">Value</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100 font-sans">
                                    {productMf.map((m, i) => (
                                      <tr key={i}>
                                        <td className="py-2 px-3 text-[#4F46E5] font-extrabold">{formatMetafieldKey(m.namespace, m.key)}</td>
                                        <td className="py-2 px-3 text-gray-500 text-[10px]">{m.namespace === "shopify" ? "Category Metafield" : "Custom"}</td>
                                        <td className="py-2 px-3 text-gray-900 font-semibold">{m.value}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <div className="bg-gray-50 p-3 rounded-xl border border-dashed border-gray-200 text-center space-y-0.5">
                                <p className="text-gray-500 font-medium text-[11px]">No product or category metafields attached.</p>
                                <p className="text-gray-400 text-[10px]">
                                  Metafields saved in Shopify Admin will automatically appear here.
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>

                    {/* Full JSON AI Input Payload Block */}
                    <div className="bg-gray-900 text-gray-100 rounded-2xl p-4 space-y-3 shadow-md">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-indigo-400 font-mono text-xs font-bold">
                          <Code className="w-4 h-4 text-indigo-400" />
                          <span>Full AI Input JSON Payload</span>
                        </div>
                        <button
                          onClick={() => copyToClipboard(JSON.stringify(product.aiInputPayload, null, 2), setCopiedJson)}
                          className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-gray-700"
                        >
                          {copiedJson ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedJson ? "Copied!" : "Copy JSON"}</span>
                        </button>
                      </div>

                      <pre className="text-[11px] font-mono text-emerald-400 max-h-60 overflow-y-auto bg-black/50 p-3 rounded-xl leading-relaxed border border-gray-800">
                        {JSON.stringify(product.aiInputPayload, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {/* TAB 3: VARIANTS TABLE */}
                {activeTab === "variants" && (
                  <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-2xs">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                      <h4 className="font-bold text-gray-900">Product Variants ({product.variants.length})</h4>
                      <span className="text-[11px] text-gray-500">Inventory breakdown per SKU</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-gray-100 bg-gray-50/60 text-gray-500 font-semibold text-[10px] uppercase">
                            <th className="py-2.5 pl-4 pr-2">Variant</th>
                            <th className="py-2.5 px-3">SKU</th>
                            <th className="py-2.5 px-3">Price</th>
                            <th className="py-2.5 px-3">Stock</th>
                            <th className="py-2.5 px-3">Barcode</th>
                            <th className="py-2.5 pr-4 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {product.variants.map((v) => (
                            <tr key={v.id} className="hover:bg-gray-50/50">
                              <td className="py-3 pl-4 pr-2 font-bold text-gray-900">{v.title}</td>
                              <td className="py-3 px-3 font-mono text-[11px] text-gray-600">{v.sku || "—"}</td>
                              <td className="py-3 px-3 font-bold text-gray-900">{v.price}</td>
                              <td className="py-3 px-3">
                                <span className={`font-bold ${v.inventoryQuantity > 0 ? "text-emerald-600" : "text-red-500"}`}>
                                  {v.inventoryQuantity}
                                </span>
                              </td>
                              <td className="py-3 px-3 font-mono text-gray-400">{v.barcode || "—"}</td>
                              <td className="py-3 pr-4 text-right">
                                {v.availableForSale ? (
                                  <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-100">In Stock</span>
                                ) : (
                                  <span className="bg-red-50 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded border border-red-100">Out of Stock</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* TAB 4: IMAGE GALLERY */}
                {activeTab === "images" && (
                  <div className="space-y-4">
                    <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
                      <h4 className="font-bold text-gray-900">Image Gallery ({product.images.length})</h4>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                        {product.images.map((img) => (
                          <button
                            key={img.id}
                            onClick={() => setSelectedImage(img.url)}
                            className={`aspect-square rounded-xl border-2 overflow-hidden bg-gray-50 transition-all cursor-pointer ${
                              selectedImage === img.url ? "border-[#4F46E5] ring-2 ring-indigo-100" : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <img src={img.url} alt={img.altText || product.title} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 5: SEO & METAFIELDS */}
                {activeTab === "seo" && (
                  <div className="space-y-4">
                    <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
                      <h4 className="font-bold text-gray-900 flex items-center gap-1.5">
                        <Globe className="w-4 h-4 text-indigo-600" />
                        <span>Search Engine Optimization (SEO)</span>
                      </h4>
                      <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 space-y-1">
                        <span className="text-[11px] font-bold text-indigo-700 block truncate">
                          {product.seoTitle || product.title}
                        </span>
                        <span className="text-[10px] text-emerald-700 font-mono block">
                          https://store.myshopify.com/products/{product.handle}
                        </span>
                        <p className="text-[11px] text-gray-600 leading-relaxed">
                          {product.seoDescription || product.descriptionText || "No search engine meta description specified."}
                        </p>
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
                      {(() => {
                        const formatMetafieldKey = (namespace: string, key: string): string => {
                          let k = key;
                          if (k.startsWith("shopify.")) k = k.replace("shopify.", "");
                          k = k.replace(/^shopify-/, "");
                          k = k.replace(/[-_]/g, " ");
                          return k
                            .split(" ")
                            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                            .join(" ");
                        };

                        const allMf = product.metafields || [];
                        const productMf = allMf.filter((m) => m.key !== "unavailable_reason" && !m.key.includes("unavailable"));

                        return (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="font-bold text-gray-900 flex items-center gap-1.5 text-xs">
                                <Box className="w-4 h-4 text-indigo-600" />
                                <span>Product & Category Metafields ({productMf.length})</span>
                              </h4>
                              {productMf.length > 0 && (
                                <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
                                  {productMf.length} Active
                                </span>
                              )}
                            </div>

                            {productMf.length > 0 ? (
                              <div className="overflow-x-auto border border-gray-200 rounded-xl">
                                <table className="w-full text-left text-[11px]">
                                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-mono">
                                    <tr>
                                      <th className="py-2 px-3">Metafield</th>
                                      <th className="py-2 px-3">Type</th>
                                      <th className="py-2 px-3">Value</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100 font-sans">
                                    {productMf.map((m, i) => (
                                      <tr key={i}>
                                        <td className="py-2 px-3 text-[#4F46E5] font-extrabold">{formatMetafieldKey(m.namespace, m.key)}</td>
                                        <td className="py-2 px-3 text-gray-500 text-[10px]">{m.namespace === "shopify" ? "Category Metafield" : "Custom"}</td>
                                        <td className="py-2 px-3 text-gray-900 font-semibold">{m.value}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <div className="bg-gray-50 p-3 rounded-xl border border-dashed border-gray-200 text-center space-y-0.5">
                                <p className="text-gray-500 font-medium text-[11px]">No product or category metafields attached.</p>
                                <p className="text-gray-400 text-[10px]">
                                  Metafields saved in Shopify Admin will automatically appear here.
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* TAB 6: PRODUCTREADY AI SECTION */}
                {activeTab === "ai" && (
                  <div className="bg-gradient-to-br from-indigo-50/50 to-purple-50/30 border border-indigo-100 rounded-2xl p-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#4F46E5] text-white flex items-center justify-center font-bold shadow-xs">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm">ProductReady AI Audit Status</h4>
                        <p className="text-[11px] text-gray-500">Automated reality score & e-commerce trust analysis</p>
                      </div>
                    </div>

                    {product.aiAnalysis.analyzed ? (
                      <div className="space-y-3 pt-2">
                        <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-indigo-100 shadow-2xs">
                          <div className="text-center">
                            <span className="text-2xl font-extrabold text-[#10B981] block">{product.aiAnalysis.realityScore}</span>
                            <span className="text-[10px] text-gray-400">Trust Score</span>
                          </div>
                          <div className="border-l border-gray-100 pl-4 space-y-1">
                            <span className="text-xs font-bold text-gray-900 block">{product.aiAnalysis.confidence} Confidence</span>
                            <p className="text-[11px] text-gray-600">{product.aiAnalysis.aiSummary}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white/80 backdrop-blur-xs border border-indigo-100 rounded-xl p-5 text-center space-y-3">
                        <Info className="w-7 h-7 text-[#4F46E5] mx-auto" />
                        <div>
                          <h5 className="font-bold text-gray-900 text-xs">Product not analyzed yet</h5>
                          <p className="text-[11px] text-gray-500 mt-0.5">Click "Analyze Product" to run ProductReady AI quality inspection.</p>
                        </div>
                        <button
                          onClick={() => onRunAnalysis && onRunAnalysis(product.id)}
                          className="px-4 py-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold text-xs rounded-xl shadow-xs inline-flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Run AI Inspection</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
