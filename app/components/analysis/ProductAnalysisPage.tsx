import { useState, useMemo, useEffect } from "react";
import { Link, useLocation, useParams, useFetcher } from "react-router";
import {
  ArrowLeft,
  RefreshCw,
  ScanSearch,
  Package,
  Info,
  TrendingUp,
  Shield,
  Eye,
  Truck,
  RotateCcw,
  AlertTriangle,
  HelpCircle,
  CheckCircle2,
  XCircle,
  Tag,
  Layers,
  Globe,
  Box,
  FileText,
  DollarSign,
  Calendar,
  Sparkles,
} from "lucide-react";
import { useProducts } from "../../context/ProductContext";
import { fetchProductAnalysis, reanalyzeProduct, type ProductAnalysis } from "../../services/productAnalysis";
import { buildAnalysis } from "../../services/productAnalysis/builder";
import { OverviewTab } from "./OverviewTab";
import { SuggestionsTab } from "./SuggestionsTab";
import { ImagesTab } from "./ImagesTab";
import { DataSourcesTab } from "./DataSourcesTab";
import { LoadingSkeleton } from "./LoadingSkeleton";
import type { ShopifyCompleteProduct } from "../../services/shopify.service.server";
import type { AiProductAnalysisResult, ProductInput } from "../../services/ai.service";

type TabId = "Overview" | "Content" | "Shipping" | "Specifications" | "Media" | "TrustElements" | "ProductDetails";

interface SubScoreTab {
  id: TabId;
  label: string;
  score?: number;
}

/* ---------- SVG Trust Score Ring ---------- */
function TrustRing({ score, size = 76 }: { score: number; size?: number }) {
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(score, 100));
  const offset = c - (pct / 100) * c;
  const color = score >= 80 ? "#10B981" : score >= 50 ? "#F59E0B" : "#EF4444";
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#F3F4F6" strokeWidth={6} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={6}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset 0.8s ease" }}
      />
      <text x="50%" y="48%" dominantBaseline="central" textAnchor="middle" fill={color} style={{ fontSize: 22, fontWeight: 800 }}>
        {score}
      </text>
      <text x="50%" y="72%" dominantBaseline="central" textAnchor="middle" fill="#9CA3AF" style={{ fontSize: 9, fontWeight: 600 }}>
        /100
      </text>
    </svg>
  );
}

export function ProductAnalysisPage({
  initialProducts,
  initialAnalysis,
  completeProduct,
  normalizedAiInput,
  aiData,
}: {
  initialProducts?: any[];
  initialAnalysis?: ProductAnalysis | null;
  completeProduct?: ShopifyCompleteProduct | null;
  normalizedAiInput?: ProductInput | null;
  aiData?: AiProductAnalysisResult | null;
}) {
  const { productId } = useParams();
  const location = useLocation();
  const contextData = useProducts();

  const product = useMemo(() => {
    if (initialProducts && initialProducts.length > 0) return initialProducts[0];
    if (!productId) return contextData.products[0] || null;
    const decodedId = decodeURIComponent(productId);
    return (
      contextData.products.find((p) => {
        if (p.id === productId || p.id === decodedId) return true;
        const rawPId = p.id.includes("/") ? p.id.split("/").pop()! : p.id;
        const rawParamId = decodedId.includes("/") ? decodedId.split("/").pop()! : decodedId;
        return rawPId === rawParamId;
      }) || contextData.products[0] || null
    );
  }, [initialProducts, contextData.products, productId]);

  const backToProductsPath = `/app/products${location.search}`;
  const [analysis, setAnalysis] = useState<ProductAnalysis | null>(() => {
    if (initialAnalysis) return initialAnalysis;
    if (product) return buildAnalysis(product, false, aiData || undefined);
    return null;
  });
  const [isLoading, setIsLoading] = useState(!initialAnalysis && !aiData && !completeProduct);
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("Overview");
  const [selectedImgUrl, setSelectedImgUrl] = useState<string | null>(
    completeProduct?.featuredImage?.url || completeProduct?.images[0]?.url || product?.imageUrl || null
  );

  const fetcher = useFetcher<any>();
  const isSubmitting = fetcher.state === "submitting" || fetcher.state === "loading";

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialAnalysis) {
      setAnalysis(initialAnalysis);
      setIsLoading(false);
    } else if (aiData && product) {
      setAnalysis(buildAnalysis(product, false, aiData));
      setIsLoading(false);
    }
  }, [initialAnalysis, aiData, product]);

  useEffect(() => {
    if (fetcher.data) {
      if (fetcher.data.success && fetcher.data.aiData && product) {
        const freshAnalysis = buildAnalysis(product, true, fetcher.data.aiData);
        setAnalysis(freshAnalysis);
        setErrorMessage(null);
      } else if (fetcher.data.success === false) {
        setErrorMessage(fetcher.data.error || "Re-analysis failed. Please try again.");
      }
      setIsLoading(false);
      setIsReanalyzing(false);
    }
  }, [fetcher.data, product]);

  const loadAnalysis = async (reanalyze = false) => {
    if (!product) return;
    setIsLoading(true);
    setIsReanalyzing(reanalyze);
    try {
      const data = reanalyze ? await reanalyzeProduct(product) : await fetchProductAnalysis(product);
      setAnalysis(data);
    } catch (e) {
      console.error("Analysis reload error:", e);
    } finally {
      setIsLoading(false);
      setIsReanalyzing(false);
    }
  };

  const handleReanalyze = () => {
    setIsLoading(true);
    setIsReanalyzing(true);
    fetcher.submit({ intent: "reanalyze" }, { method: "post" });
  };

  useEffect(() => {
    if (!initialAnalysis && product) {
      loadAnalysis(false);
    }
  }, [product, initialAnalysis]);

  /* Sub-score tabs derived from analysis score breakdown */
  const subTabs: SubScoreTab[] = useMemo(() => {
    if (!analysis) return [];
    const sb = analysis.scoreBreakdown;
    return [
      { id: "Overview" as TabId, label: "Overview", score: analysis.realityScore },
      { id: "Content" as TabId, label: "Content", score: sb[0]?.value ?? 85 },
      { id: "Shipping" as TabId, label: "Shipping & Returns", score: sb[3]?.value ?? 62 },
      { id: "Specifications" as TabId, label: "Specifications", score: sb[1]?.value ?? 71 },
      { id: "Media" as TabId, label: "Media", score: sb[2]?.value ?? 88 },
      { id: "TrustElements" as TabId, label: "Trust Elements", score: Math.round((sb[0]?.value + sb[2]?.value) / 2) || 79 },
      { id: "ProductDetails" as TabId, label: "Product Details" },
    ];
  }, [analysis]);

  const isHighTrust = (analysis?.realityScore ?? 80) >= 80;

  return (
    <div className="mx-auto max-w-[1150px] space-y-6 relative pb-28 font-sans text-gray-900">
      
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between gap-3 text-xs text-red-700 shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
            <span className="font-semibold">{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-red-500 hover:text-red-800 font-bold px-2 py-1 rounded-lg hover:bg-red-100/60"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ── Hero Header Card ── */}
      <div
        className="rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden"
        style={{ background: "linear-gradient(135deg, #FAFBFF 0%, #F0F2FF 50%, #EEF2FF 100%)" }}
      >
        <div className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5">
          {/* Left: Back + Product info */}
          <div className="flex items-center gap-4">
            <Link
              to={backToProductsPath}
              className="p-2.5 rounded-xl bg-white/80 border border-gray-200/60 text-gray-500 hover:text-[#4F46E5] hover:bg-white hover:shadow-md transition-all cursor-pointer shrink-0 backdrop-blur-sm"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center text-[#6366F1] shrink-0 overflow-hidden">
              {completeProduct?.featuredImage?.url || product?.imageUrl ? (
                <img src={completeProduct?.featuredImage?.url || product?.imageUrl} alt={completeProduct?.title || product?.name} className="w-full h-full object-cover" />
              ) : (
                <Package className="w-6 h-6" />
              )}
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900 tracking-tight leading-snug">
                {completeProduct?.title || product?.name}
              </h1>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="bg-white/70 backdrop-blur-sm text-gray-600 px-2.5 py-0.5 rounded-lg text-[11px] font-medium border border-gray-200/60">
                  {completeProduct?.variants[0]?.sku || product?.sku || `SKU-${product?.id?.slice(-4)}`}
                </span>
                <span className="bg-[#EEF2FF] text-[#4F46E5] px-2.5 py-0.5 rounded-lg text-[11px] font-medium border border-indigo-100/60">
                  {completeProduct?.category?.fullName || completeProduct?.productType || product?.category || "General"}
                </span>
                {product?.price && (
                  <span className="text-xs font-bold text-gray-900 ml-1">
                    {product.price}
                  </span>
                )}
                <span className="text-gray-300">•</span>
                <span className="text-[11px] text-gray-500">Last audited: {analysis?.lastAnalyzed || "Just now"}</span>
              </div>
            </div>
          </div>

          {/* Right: Trust Score Ring + Status + Actions */}
          <div className="flex items-center gap-5 self-end md:self-auto">
            <div className="flex items-center gap-4">
              <TrustRing score={analysis?.realityScore ?? 82} size={72} />
              <div className="space-y-1.5">
                <div className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">Trust Score</div>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap shrink-0 ${
                  isHighTrust
                    ? "bg-emerald-50 text-emerald-600 border border-emerald-200/80"
                    : "bg-amber-50 text-amber-600 border border-amber-200/80"
                }`}>
                  <Shield className="w-3 h-3 shrink-0" />
                  <span>{isHighTrust ? "Good standing" : "Needs attention"}</span>
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleReanalyze}
              disabled={isLoading || isSubmitting || isReanalyzing}
              className="px-4 py-2.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-medium rounded-xl shadow-sm transition-all transform active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer inline-flex items-center gap-2 whitespace-nowrap"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading || isSubmitting || isReanalyzing ? "animate-spin" : ""}`} />
              <span>{isLoading || isSubmitting || isReanalyzing ? "Analyzing…" : "Re-analyze"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Analysis Content ── */}
      <div style={{ animation: "fadeIn 0.3s ease" }}>
        {isLoading || isSubmitting || isReanalyzing ? (
          <LoadingSkeleton />
        ) : (
          analysis && <OverviewTab data={analysis} />
        )}

        {/* Product Details Tab */}
        {activeTab === "ProductDetails" && (
          <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <Package className="w-5 h-5 text-[#4F46E5]" />
                <h2 className="text-lg font-extrabold text-gray-900 tracking-tight">PRODUCT DETAILS</h2>
              </div>
            </div>

            {/* Media & Core Summary Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
              {/* Left: Gallery */}
              <div className="space-y-3">
                <div className="aspect-square w-full rounded-2xl bg-gray-50 border border-gray-200 overflow-hidden shadow-2xs flex items-center justify-center">
                  {selectedImgUrl ? (
                    <img src={selectedImgUrl} alt={completeProduct?.title || "Product"} className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-12 h-12 text-gray-300" />
                  )}
                </div>

                {/* Thumbnail Carousel */}
                {completeProduct?.images && completeProduct.images.length > 0 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {completeProduct.images.map((img) => (
                      <button
                        key={img.id}
                        onClick={() => setSelectedImgUrl(img.url)}
                        className={`w-14 h-14 rounded-xl border-2 overflow-hidden bg-gray-50 shrink-0 transition-all cursor-pointer ${
                          selectedImgUrl === img.url ? "border-[#4F46E5] ring-2 ring-indigo-100" : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <img src={img.url} alt={img.altText || "Thumbnail"} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Middle & Right: Basic Info Grid */}
              <div className="md:col-span-2 space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-indigo-50 text-indigo-700 font-bold text-[11px] px-2.5 py-0.5 rounded-lg border border-indigo-100">
                      {completeProduct?.category?.fullName || completeProduct?.productType || "General"}
                    </span>
                    <span className="bg-gray-100 text-gray-700 font-bold text-[11px] px-2.5 py-0.5 rounded-lg border border-gray-200">
                      Vendor: {completeProduct?.vendor || "N/A"}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-lg border ${
                        completeProduct?.status === "ACTIVE"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      Status: {completeProduct?.status || "ACTIVE"}
                    </span>
                  </div>

                  <h1 className="text-xl font-bold text-gray-900 tracking-tight leading-snug pt-1">
                    {completeProduct?.title || product?.name}
                  </h1>
                  <p className="text-xs text-gray-500 font-mono">Handle: /{completeProduct?.handle || "product"}</p>
                </div>

                {/* Price & Inventory Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50/80 p-4 rounded-2xl border border-gray-200/70">
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase block">Price</span>
                    <span className="text-lg font-extrabold text-gray-900">
                      {completeProduct?.variants[0]?.price || product?.price || "$0.00"}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase block">Compare-At</span>
                    <span className="text-sm font-bold text-gray-400 line-through">
                      {completeProduct?.variants[0]?.compareAtPrice || "—"}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase block">Total Stock</span>
                    <span className={`text-sm font-bold ${(completeProduct?.totalInventory ?? 0) > 0 ? "text-emerald-600" : "text-red-500"}`}>
                      {completeProduct?.totalInventory ?? 0} units
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase block">Available for Sale</span>
                    <span className="text-sm font-bold text-emerald-600">
                      {completeProduct?.variants[0]?.availableForSale ? "YES" : "NO"}
                    </span>
                  </div>
                </div>

                {/* Dates Grid */}
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="bg-white border border-gray-200 p-2.5 rounded-xl">
                    <span className="text-[10px] text-gray-400 font-semibold block">Created At</span>
                    <span className="font-bold text-gray-800">
                      {completeProduct?.createdAt ? new Date(completeProduct.createdAt).toLocaleDateString() : "—"}
                    </span>
                  </div>

                  <div className="bg-white border border-gray-200 p-2.5 rounded-xl">
                    <span className="text-[10px] text-gray-400 font-semibold block">Updated At</span>
                    <span className="font-bold text-gray-800">
                      {completeProduct?.updatedAt ? new Date(completeProduct.updatedAt).toLocaleDateString() : "—"}
                    </span>
                  </div>

                  <div className="bg-white border border-gray-200 p-2.5 rounded-xl">
                    <span className="text-[10px] text-gray-400 font-semibold block">Published At</span>
                    <span className="font-bold text-gray-800">
                      {completeProduct?.publishedAt ? new Date(completeProduct.publishedAt).toLocaleDateString() : "Live"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Description HTML Section */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>Product Description</span>
              </h3>
              <div
                className="text-xs text-gray-700 leading-relaxed max-h-64 overflow-y-auto pr-2 border-t border-gray-100 pt-3 prose prose-xs"
                dangerouslySetInnerHTML={{ __html: completeProduct?.descriptionHtml || `<p>${product?.description || "No description provided."}</p>` }}
              />
            </div>

            {/* Variants Table */}
            {completeProduct?.variants && completeProduct.variants.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-2xs space-y-2">
                <div className="p-4 bg-gray-50/60 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="font-bold text-gray-900 text-xs">Product Variants ({completeProduct.variants.length})</h3>
                  <span className="text-[11px] text-gray-400">Inventory breakdown per variant</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/30 text-gray-500 font-semibold text-[10px] uppercase">
                        <th className="py-2.5 pl-4 pr-2">Variant Title</th>
                        <th className="py-2.5 px-3">SKU</th>
                        <th className="py-2.5 px-3">Barcode</th>
                        <th className="py-2.5 px-3">Price</th>
                        <th className="py-2.5 px-3">Compare At</th>
                        <th className="py-2.5 px-3">Stock</th>
                        <th className="py-2.5 pr-4 text-right">Sale Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {completeProduct.variants.map((v) => (
                        <tr key={v.id} className="hover:bg-gray-50/50">
                          <td className="py-3 pl-4 pr-2 font-bold text-gray-900">{v.title}</td>
                          <td className="py-3 px-3 font-mono text-[11px] text-gray-600">{v.sku || "—"}</td>
                          <td className="py-3 px-3 font-mono text-[11px] text-gray-400">{v.barcode || "—"}</td>
                          <td className="py-3 px-3 font-bold text-gray-900">{v.price}</td>
                          <td className="py-3 px-3 text-gray-400">{v.compareAtPrice || "—"}</td>
                          <td className="py-3 px-3 font-bold text-emerald-600">{v.inventoryQuantity} units</td>
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

            {/* Collections, SEO & Metafields Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-2">
                <h4 className="font-bold text-gray-900 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span>Collections ({completeProduct?.collections.length ?? 0})</span>
                </h4>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {completeProduct?.collections && completeProduct.collections.length > 0 ? (
                    completeProduct.collections.map((col) => (
                      <span key={col.id} className="bg-indigo-50 text-indigo-700 font-semibold px-2.5 py-1 rounded-lg border border-indigo-100 text-[11px]">
                        {col.title} ({col.handle})
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-400">No collections assigned</span>
                  )}
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-2">
                <h4 className="font-bold text-gray-900 flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-indigo-600" />
                  <span>SEO Information</span>
                </h4>
                <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-200 space-y-1">
                  <span className="font-bold text-indigo-700 block truncate">{completeProduct?.seo?.title || completeProduct?.title}</span>
                  <p className="text-[11px] text-gray-600 leading-relaxed">
                    {completeProduct?.seo?.description || "No search engine meta description specified."}
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

                  const allMf = completeProduct?.metafields || [];
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

                      {/* Product & Category Metafields */}
                      {productMf.length > 0 ? (
                        <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 font-mono text-[10px]">
                          {productMf.map((m, idx) => (
                            <div key={m.id || `pmf-${idx}`} className="bg-gray-50 p-2.5 rounded-xl border border-gray-200 space-y-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[#4F46E5] font-extrabold text-[11px] font-sans">
                                  {formatMetafieldKey(m.namespace, m.key)}
                                </span>
                                <span className="text-[9px] text-gray-400 font-sans bg-white px-1.5 py-0.5 rounded border border-gray-200 shrink-0">
                                  {m.namespace === "shopify" ? "Category Metafield" : "Custom Metafield"}
                                </span>
                              </div>
                              <p className="text-gray-900 font-semibold text-[11px] font-sans break-words">{m.value}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-gray-50/80 p-2.5 rounded-xl border border-dashed border-gray-200 text-center space-y-0.5">
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
          </div>
        )}
      </div>

      {/* ── Sticky Re-analyze Footer ── */}
      <div className="fixed bottom-4 left-4 right-4 max-w-[1100px] mx-auto z-40">
        <div
          className="rounded-2xl p-3.5 px-5 shadow-xl flex items-center justify-between gap-3 text-xs border border-white/40"
          style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.97), rgba(238,242,255,0.97))", backdropFilter: "blur(16px)" }}
        >
          <div className="flex items-center gap-2.5 text-gray-600">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
              <Info className="w-3.5 h-3.5 text-[#4F46E5]" />
            </div>
            <div>
              <span className="font-semibold text-gray-700 hidden sm:inline">After making changes,</span>
              <span className="hidden sm:inline"> click Re-analyze to update your Trust Score.</span>
              <span className="sm:hidden font-semibold">Re-analyze after changes.</span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleReanalyze}
            disabled={isLoading || isSubmitting || isReanalyzing}
            className="px-5 py-2.5 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 shadow-md hover:shadow-lg transform active:scale-95 disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)" }}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading || isSubmitting || isReanalyzing ? "animate-spin" : ""}`} />
            <span>{isLoading || isSubmitting || isReanalyzing ? "Analyzing…" : "Re-analyze Now"}</span>
            <TrendingUp className="w-3.5 h-3.5 ml-0.5" />
          </button>
        </div>
      </div>

    </div>
  );
}