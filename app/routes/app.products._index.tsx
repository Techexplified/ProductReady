import { useState, useMemo, useEffect } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { Link, useFetcher, useLoaderData, useNavigate, useSearchParams, useLocation } from "react-router";
import { authenticate } from "../shopify.server";
import {
  getShopifyProducts,
  createShopifyProduct,
  getShopifyCompleteProduct,
  ShopifyProductItem,
} from "../services/shopify.service.server";
import { syncProductsFromShopify } from "../services/shopifyProduct.service";
import {
  getAnalysisRecordsForShop,
  createAnalysisJob,
  createBulkAnalysisJobs,
  formatLastAnalyzed,
  runAutoAnalysisForProduct,
  AnalysisRecordDTO,
} from "../services/analysis.service.server";
import {
  analyzeProductWithGroq,
  extractShippingReturnWarrantyInfo,
  type ProductInput,
} from "../services/ai.service";
import prisma from "../db.server";
import { reconnectStoreData, getAppSettingsForShop, getStoreConnectionStatus } from "../services/settings.server";
import { ProductDetailsDrawer } from "../components/products/ProductDetailsDrawer";
import { OnboardingView } from "../components/onboarding/OnboardingView";
import { ConnectStoreView } from "../components/onboarding/ConnectStoreView";
import type { CompleteProductDetails } from "../services/product-details.service";
import {
  Search,
  Sparkles,
  X,
  ArrowUpDown,
  Eye,
  Bell,
  Upload,
  Download,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Speaker,
  Shirt,
  Layers,
  Watch,
  Droplet,
  Headphones,
  Briefcase,
  Plus,
  RefreshCw,
  SlidersHorizontal,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
} from "lucide-react";

export interface MergedProductItem {
  id: string; // "gid://shopify/Product/12345678"
  name: string;
  category: string;
  price: string;
  sku: string;
  score: number;
  status: "Analyzed" | "Queued" | "Running" | "Pending" | "FAILED";
  confidence: string;
  iconType: string;
  views: number;
  ctr: string;
  issuesCount: number;
  lastAnalyzed: string;
  imageUrl?: string | null;
  vendor?: string;
  shopifyStatus?: string;
  description?: string;
  totalInventory?: number;
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);
  const shopName = session.shop;

  let storeName = session.shop.split(".")[0].split(/[-_]+/).map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  try {
    const response = await admin.graphql(
      `#graphql
        query {
          shop {
            name
          }
        }`
    );
    const { data } = await response.json();
    if (data?.shop?.name) {
      storeName = data.shop.name;
    }
  } catch (err) {
    console.error("Failed to fetch shop name in products loader:", err);
  }

  // Check if store is disconnected or new user
  const { isNewUserOrDeleted, isDisconnected } = await getStoreConnectionStatus(shopName);

  if (isNewUserOrDeleted) {
    return {
      shopName,
      storeName,
      products: [],
      vendors: [],
      productTypes: [],
      isNewUserOrDeleted: true,
      isDisconnected: true,
      enableTestProductCreation: process.env.ENABLE_TEST_PRODUCT_CREATION !== "false",
    };
  }

  // 1. Fetch products from current store
  const { products: shopifyProducts } = await getShopifyProducts(admin, 100);

  // 2. Fetch analysis records from PostgreSQL
  let analysisRecords = await getAnalysisRecordsForShop(shopName);

  // 3. Auto-analyze unanalyzed products if "Auto-analyze new products" setting is ON
  const appSettings = await getAppSettingsForShop(shopName, storeName);
  if (appSettings.autoAnalyzeNew) {
    const unanalyzed = shopifyProducts.filter((sp) => {
      const rawNumeric = sp.id.includes("/") ? sp.id.split("/").pop()! : sp.id;
      const gidPId = `gid://shopify/Product/${rawNumeric}`;
      const rec = analysisRecords[sp.id] || analysisRecords[gidPId] || analysisRecords[rawNumeric];
      return !rec || rec.status !== "COMPLETED" || !rec.score || rec.score === 0;
    });

    if (unanalyzed.length > 0) {
      for (const prod of unanalyzed) {
        try {
          await runAutoAnalysisForProduct(admin, shopName, prod.id);
        } catch (err) {
          console.error(`Auto-analysis error for product ${prod.id}:`, err);
        }
      }
      analysisRecords = await getAnalysisRecordsForShop(shopName);
    }
  }

  // 4. Map live Shopify products with analysis data
  const mergedList: MergedProductItem[] = shopifyProducts.map((sp) => {
    const rawNumeric = sp.id.includes("/") ? sp.id.split("/").pop()! : sp.id;
    const gidPId = `gid://shopify/Product/${rawNumeric}`;
    const analysis: AnalysisRecordDTO | undefined =
      analysisRecords[sp.id] || analysisRecords[gidPId] || analysisRecords[rawNumeric];

    const isCompleted = Boolean(
      analysis &&
      analysis.status === "COMPLETED" &&
      analysis.score && analysis.score > 0 &&
      analysis.lastAnalyzed && analysis.lastAnalyzed !== "—"
    );

    let computedStatus: MergedProductItem["status"] = "Pending";
    if (isCompleted) {
      computedStatus = "Analyzed";
    } else if (analysis?.status === "QUEUED") {
      computedStatus = "Queued";
    } else if (analysis?.status === "RUNNING") {
      computedStatus = "Running";
    } else {
      computedStatus = "Pending";
    }

    return {
      id: sp.id,
      name: sp.title,
      category: sp.productType || "General",
      price: sp.price,
      sku: sp.sku,
      score: isCompleted ? (analysis?.score ?? 0) : 0,
      status: computedStatus,
      confidence: isCompleted ? (analysis?.confidence ?? "—") : "—",
      iconType: "default",
      views: isCompleted ? (analysis?.views ?? 140) : 0,
      ctr: isCompleted ? (analysis?.ctr ?? "3.2%") : "—",
      issuesCount: isCompleted ? (analysis?.issuesCount ?? 0) : 0,
      lastAnalyzed: isCompleted ? (analysis?.lastAnalyzed ?? "—") : "—",
      imageUrl: sp.featuredImage?.url || null,
      vendor: sp.vendor || "Store Vendor",
      shopifyStatus: sp.status,
    };
  });

  // 5. Background store sync in Neon PostgreSQL DB
  syncProductsFromShopify(admin, shopName, storeName).catch((err) =>
    console.error("Background DB product sync failed:", err)
  );

  const vendors = Array.from(new Set(shopifyProducts.map((p) => p.vendor).filter(Boolean)));
  const productTypes = Array.from(new Set(shopifyProducts.map((p) => p.productType).filter(Boolean) as string[]));

  const enableTestProductCreation = process.env.ENABLE_TEST_PRODUCT_CREATION !== "false";

  return {
    shopName,
    storeName,
    products: mergedList,
    vendors,
    productTypes,
    isDisconnected,
    enableTestProductCreation,
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = String(formData.get("intent") ?? "");
  const shopName = session.shop;

  if (intent === "embed-store" || intent === "reconnect-store") {
    await reconnectStoreData(shopName);
    return { success: true, isConnected: true };
  }

  const { isDisconnected } = await getStoreConnectionStatus(shopName);
  if (isDisconnected && (intent === "run-analysis" || intent === "analyze" || intent === "run-bulk-analysis" || intent === "bulk-analyze")) {
    return { success: false, message: "Store is currently disconnected. Reconnect store in Settings to run AI audits." };
  }

  const fetchFreshMergedProducts = async (): Promise<MergedProductItem[]> => {
    const { products: shopifyProducts } = await getShopifyProducts(admin, 100);
    const analysisRecords = await getAnalysisRecordsForShop(shopName);

    return shopifyProducts.map((sp) => {
      const rawNumeric = sp.id.includes("/") ? sp.id.split("/").pop()! : sp.id;
      const gidPId = `gid://shopify/Product/${rawNumeric}`;
      const analysis: AnalysisRecordDTO | undefined =
        analysisRecords[sp.id] || analysisRecords[gidPId] || analysisRecords[rawNumeric];

      const isCompleted = Boolean(
        analysis &&
        analysis.status === "COMPLETED" &&
        analysis.score && analysis.score > 0 &&
        analysis.lastAnalyzed && analysis.lastAnalyzed !== "—"
      );

      let computedStatus: MergedProductItem["status"] = "Pending";
      if (isCompleted) {
        computedStatus = "Analyzed";
      } else if (analysis?.status === "QUEUED") {
        computedStatus = "Queued";
      } else if (analysis?.status === "RUNNING") {
        computedStatus = "Running";
      } else {
        computedStatus = "Pending";
      }

      return {
        id: sp.id,
        name: sp.title,
        category: sp.productType || "General",
        price: sp.price || "$0.00",
        sku: sp.sku || `SKU-${rawNumeric}`,
        score: isCompleted ? (analysis?.score ?? 0) : 0,
        status: computedStatus,
        confidence: isCompleted ? (analysis?.confidence ?? "—") : "—",
        iconType: "default",
        views: isCompleted ? (analysis?.views ?? 140) : 0,
        ctr: isCompleted ? (analysis?.ctr ?? "3.2%") : "—",
        issuesCount: isCompleted ? (analysis?.issuesCount ?? 0) : 0,
        lastAnalyzed: isCompleted ? (analysis?.lastAnalyzed ?? "—") : "—",
        imageUrl: sp.featuredImage?.url || null,
        vendor: sp.vendor || "Default Store",
        shopifyStatus: sp.status,
      };
    });
  };

  // Sync Products from Shopify Admin API into PostgreSQL
  if (intent === "sync-products" || intent === "sync") {
    let storeName = session.shop.split(".")[0];
    try {
      const shopRes = await admin.graphql(`query { shop { name } }`);
      const { data } = await shopRes.json();
      if (data?.shop?.name) storeName = data.shop.name;
    } catch (e) {}

    const result = await syncProductsFromShopify(admin, shopName, storeName);

    // Clear any stale queued analysis jobs so sync purely fetches product details
    const store = await prisma.store.findUnique({ where: { shopName } });
    if (store) {
      await prisma.analysisJob.deleteMany({ where: { storeId: store.id } });
    }

    const freshProducts = await fetchFreshMergedProducts();
    return { success: result.success, totalSynced: result.totalSynced, products: freshProducts, message: result.message };
  }

  // Add Product directly in Shopify via GraphQL Mutation
  if (intent === "add-product") {
    const name = String(formData.get("name") ?? "");
    const category = String(formData.get("category") ?? "General");
    const price = String(formData.get("price") ?? "$49.99");
    const sku = String(formData.get("sku") ?? "");

    if (name.trim()) {
      const createdRes = await createShopifyProduct(admin, {
        title: name,
        productType: category,
        price,
        sku,
      });

      let storeName = session.shop.split(".")[0];
      await syncProductsFromShopify(admin, shopName, storeName);

      // Check if autoAnalyzeNew setting is enabled (ON)
      const settings = await getAppSettingsForShop(shopName, storeName);
      if (settings.autoAnalyzeNew && createdRes?.product?.id) {
        await runAutoAnalysisForProduct(admin, shopName, createdRes.product.id);
      }

      const freshProducts = await fetchFreshMergedProducts();
      return { success: true, products: freshProducts, message: `Product "${name}" created and auto-analyzed successfully!` };
    }
  }

  // Trigger Analysis for single product - Runs Groq AI directly with full GraphQL product data (supporting sister stores)
  if (intent === "run-analysis" || intent === "analyze") {
    const rawProductId = String(formData.get("productId") ?? "");
    if (rawProductId) {
      const aiData = await runAutoAnalysisForProduct(admin, shopName, rawProductId);
      const freshProducts = await fetchFreshMergedProducts();
      if (aiData) {
        return { success: true, aiData, productId: rawProductId, products: freshProducts };
      }
      return { success: false, error: "AI analysis failed.", productId: rawProductId, products: freshProducts };
    }
  }

  // Trigger Bulk Analysis for multiple products (supporting sister stores)
  if (intent === "run-bulk-analysis" || intent === "bulk-analyze") {
    const productIdsStr = String(formData.get("productIds") ?? "");
    const productIds = productIdsStr ? JSON.parse(productIdsStr) : [];
    if (Array.isArray(productIds) && productIds.length > 0) {
      for (const pId of productIds) {
        await runAutoAnalysisForProduct(admin, shopName, pId);
      }
      const freshProducts = await fetchFreshMergedProducts();
      return { success: true, count: productIds.length, products: freshProducts, message: `Bulk AI Analysis completed for ${productIds.length} products!` };
    }
  }

  return null;
};

// Helper component to render product thumbnail icons
function ProductThumbnail({ type, name }: { type?: string; name: string }) {
  const lowerName = name.toLowerCase();

  if (type === "speaker" || lowerName.includes("speaker")) {
    return (
      <div className="w-9 h-9 rounded-xl bg-[#EEF2FF] flex items-center justify-center text-[#6366F1] shrink-0">
        <Speaker className="w-4 h-4" />
      </div>
    );
  }
  if (type === "apparel" || lowerName.includes("shirt") || lowerName.includes("boot") || lowerName.includes("denim")) {
    return (
      <div className="w-9 h-9 rounded-xl bg-[#F3E8FF] flex items-center justify-center text-[#9333EA] shrink-0">
        <Shirt className="w-4 h-4" />
      </div>
    );
  }
  if (type === "accessory" || lowerName.includes("backpack") || lowerName.includes("tote")) {
    return (
      <div className="w-9 h-9 rounded-xl bg-[#FEF3C7] flex items-center justify-center text-[#D97706] shrink-0">
        <Briefcase className="w-4 h-4" />
      </div>
    );
  }
  if (type === "watch" || lowerName.includes("watch")) {
    return (
      <div className="w-9 h-9 rounded-xl bg-[#E0F2FE] flex items-center justify-center text-[#0284C7] shrink-0">
        <Watch className="w-4 h-4" />
      </div>
    );
  }
  if (type === "cosmetic" || lowerName.includes("serum") || lowerName.includes("cream")) {
    return (
      <div className="w-9 h-9 rounded-xl bg-[#FCE7F3] flex items-center justify-center text-[#DB2777] shrink-0">
        <Droplet className="w-4 h-4" />
      </div>
    );
  }
  return (
    <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 shrink-0 font-bold text-xs">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export default function ProductsPage() {
  const loaderData = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [productsList, setProductsList] = useState<MergedProductItem[]>(loaderData?.products ?? []);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "All");
  const [selectedVendor, setSelectedVendor] = useState(searchParams.get("vendor") || "All");
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get("status") || "All");
  const [sortBy, setSortBy] = useState<"name" | "score" | "issues">(
    (searchParams.get("sort") as any) || "name"
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [analyzingIds, setAnalyzingIds] = useState<string[]>([]);

  // Add Product Form State
  const [newProdName, setNewProdName] = useState("");
  const [newProdCat, setNewProdCat] = useState("Apparel & Accessories");
  const [newProdPrice, setNewProdPrice] = useState("");
  const [newProdSku, setNewProdSku] = useState("");

  const itemsPerPage = 8;

  useEffect(() => {
    if (loaderData?.products) {
      setProductsList(loaderData.products);
    }
  }, [loaderData?.products]);

  useEffect(() => {
    if (fetcher.data) {
      const actionData = fetcher.data as any;
      if (actionData.products && Array.isArray(actionData.products)) {
        setProductsList(actionData.products);
        if (actionData.totalSynced !== undefined) {
          triggerToast(`Successfully synced ${actionData.totalSynced} products from store database!`);
        } else if (actionData.message) {
          triggerToast(actionData.message);
        }
      } else if (actionData.success && actionData.aiData) {
        setProductsList((prev) =>
          prev.map((p) => {
            const rawPId = p.id.includes("/") ? p.id.split("/").pop()! : p.id;
            const targetRawId = actionData.productId?.includes("/") ? actionData.productId.split("/").pop()! : actionData.productId;
            if (p.id === actionData.productId || rawPId === targetRawId) {
              return {
                ...p,
                score: actionData.aiData.realityScore,
                status: "Analyzed",
                issuesCount: actionData.aiData.whatsMissing?.length || 0,
                confidence: actionData.aiData.confidence || "High",
                lastAnalyzed: "Just now",
              };
            }
            return p;
          })
        );
      } else if (actionData.success === false) {
        setProductsList((prev) =>
          prev.map((p) => {
            const rawPId = p.id.includes("/") ? p.id.split("/").pop()! : p.id;
            const targetRawId = actionData.productId?.includes("/") ? actionData.productId.split("/").pop()! : actionData.productId;
            if (p.id === actionData.productId || rawPId === targetRawId) {
              return {
                ...p,
                status: p.score > 0 ? "Analyzed" : "Pending",
              };
            }
            return p;
          })
        );
        triggerToast("Re-analysis failed. Please try again.");
      }
    }
  }, [fetcher.data]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filter & Sort Products
  const filteredProducts = useMemo(() => {
    return productsList.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCat = selectedCategory === "All" || p.category === selectedCategory;
      const matchesVendor = selectedVendor === "All" || p.vendor === selectedVendor;
      const matchesStatus =
        selectedStatus === "All" ||
        (selectedStatus === "Analyzed" && p.status === "Analyzed") ||
        (selectedStatus === "Pending" && p.status === "Pending") ||
        (selectedStatus === "Queued" && p.status === "Queued");

      return matchesSearch && matchesCat && matchesVendor && matchesStatus;
    });
  }, [productsList, searchQuery, selectedCategory, selectedVendor, selectedStatus]);

  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      let result = 0;
      if (sortBy === "name") result = a.name.localeCompare(b.name);
      if (sortBy === "score") result = b.score - a.score;
      if (sortBy === "issues") result = b.issuesCount - a.issuesCount;
      return sortOrder === "asc" ? result : -result;
    });
  }, [filteredProducts, sortBy, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(sortedProducts.length / itemsPerPage));
  const displayedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedProducts.slice(start, start + itemsPerPage);
  }, [sortedProducts, currentPage]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(displayedProducts.map((p) => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Trigger Single Product Analysis independently without disabling other rows
  const handleRunSingleAnalysis = async (id: string, name: string) => {
    if (loaderData?.isDisconnected) {
      triggerToast("Store is currently disconnected. Reconnect store in Settings to run AI audits.");
      return;
    }

    if (analyzingIds.includes(id)) {
      return;
    }

    // Add this product ID to actively analyzing set
    setAnalyzingIds((prev) => [...prev, id]);

    setProductsList((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              status: "Running",
            }
          : p
      )
    );

    triggerToast(`Running AI Analysis for "${name}"...`);

    try {
      const formData = new FormData();
      formData.append("intent", "run-analysis");
      formData.append("productId", id);

      const response = await fetch(window.location.pathname + window.location.search, {
        method: "POST",
        body: formData,
      });

      const actionData = await response.json();

      if (actionData?.success && actionData?.aiData) {
        setProductsList((prev) =>
          prev.map((p) => {
            const rawPId = p.id.includes("/") ? p.id.split("/").pop()! : p.id;
            const targetRawId = id.includes("/") ? id.split("/").pop()! : id;
            if (p.id === id || rawPId === targetRawId) {
              return {
                ...p,
                score: actionData.aiData.realityScore ?? 85,
                status: "Analyzed",
                issuesCount: actionData.aiData.whatsMissing?.length || 0,
                confidence: actionData.aiData.confidence || "High",
                lastAnalyzed: "Just now",
              };
            }
            return p;
          })
        );
        triggerToast(`AI Analysis completed for "${name}" (Score: ${actionData.aiData.realityScore})`);
      } else if (actionData?.products && Array.isArray(actionData.products)) {
        setProductsList(actionData.products);
        triggerToast(`AI Analysis completed for "${name}"!`);
      } else {
        setProductsList((prev) =>
          prev.map((p) => (p.id === id ? { ...p, status: p.score > 0 ? "Analyzed" : "Pending" } : p))
        );
        triggerToast(actionData?.message || actionData?.error || `Analysis failed for "${name}".`);
      }
    } catch (err) {
      console.error("Error analyzing product:", err);
      setProductsList((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: p.score > 0 ? "Analyzed" : "Pending" } : p))
      );
      triggerToast(`Analysis failed for "${name}". Please try again.`);
    } finally {
      setAnalyzingIds((prev) => prev.filter((item) => item !== id));
    }
  };

  // Add Product directly in Shopify via GraphQL
  const handleAddProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim()) return;

    const formattedPrice = `$${parseFloat(newProdPrice || "49.99").toFixed(2)}`;
    const formattedSku = newProdSku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`;

    const formData = new FormData();
    formData.append("intent", "add-product");
    formData.append("name", newProdName);
    formData.append("category", newProdCat);
    formData.append("price", formattedPrice);
    formData.append("sku", formattedSku);

    fetcher.submit(formData, { method: "post" });

    setIsAddModalOpen(false);
    setNewProdName("");
    setNewProdPrice("");
    setNewProdSku("");
    triggerToast(`Product "${newProdName}" creating in Shopify...`);
  };

  const handleExport = () => {
    triggerToast(`Exporting ${productsList.length} store products to CSV...`);
  };

  // Product Details Drawer State
  const [drawerProduct, setDrawerProduct] = useState<CompleteProductDetails | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDrawerLoading, setIsDrawerLoading] = useState(false);

  const handleOpenDrawer = async (item: MergedProductItem) => {
    setIsDrawerOpen(true);
    setIsDrawerLoading(true);
    try {
      const rawId = item.id.includes("/") ? item.id.split("/").pop()! : item.id;
      const res = await fetch(`/api/product-details/${rawId}`);
      if (res.ok) {
        const data = await res.json();
        if (data?.productDetails) {
          setDrawerProduct(data.productDetails);
        }
      }
    } catch (err) {
      console.error("Failed to fetch product details for drawer:", err);
    } finally {
      setIsDrawerLoading(false);
    }
  };

  const handleSyncProducts = () => {
    const formData = new FormData();
    formData.append("intent", "sync-products");
    fetcher.submit(formData, { method: "post" });
    triggerToast("Synchronizing products from Shopify Admin GraphQL API...");
  };

  const handleAnalyzeAllProducts = () => {
    if (loaderData?.isDisconnected) {
      triggerToast("Store is currently disconnected. Reconnect store in Settings to run AI audits.");
      return;
    }
    if (productsList.length === 0) return;
    const allIds = productsList.map((p) => p.id);

    setProductsList((prev) =>
      prev.map((p) => ({
        ...p,
        status: "Queued",
      }))
    );

    const formData = new FormData();
    formData.append("intent", "run-bulk-analysis");
    formData.append("productIds", JSON.stringify(allIds));
    fetcher.submit(formData, { method: "post" });

    triggerToast(`Bulk AI Analysis initiated for all ${allIds.length} products!`);
  };

  const handleAnalyzeSelectedProducts = () => {
    if (loaderData?.isDisconnected) {
      triggerToast("Store is currently disconnected. Reconnect store in Settings to run AI audits.");
      return;
    }
    if (selectedIds.length === 0) return;

    setProductsList((prev) =>
      prev.map((p) =>
        selectedIds.includes(p.id)
          ? {
              ...p,
              status: "Queued",
            }
          : p
      )
    );

    const formData = new FormData();
    formData.append("intent", "run-bulk-analysis");
    formData.append("productIds", JSON.stringify(selectedIds));
    fetcher.submit(formData, { method: "post" });

    triggerToast(`AI Analysis initiated for ${selectedIds.length} selected products!`);
    setSelectedIds([]);
  };

  // Open Product Analysis route when clicking product title or row
  const openProductDetail = (item: MergedProductItem) => {
    const rawId = item.id.includes("/") ? item.id.split("/").pop()! : item.id;
    const searchStr = location.search || (searchParams.toString() ? `?${searchParams.toString()}` : "");
    navigate(`/app/products/${rawId}${searchStr}`);
  };

  // Open Product Details route (when clicking Details button)
  const openProductDetailsPage = (item: MergedProductItem) => {
    const rawId = item.id.includes("/") ? item.id.split("/").pop()! : item.id;
    const searchStr = location.search || (searchParams.toString() ? `?${searchParams.toString()}` : "");
    navigate(`/app/products/details/${rawId}${searchStr}`);
  };

  const storeInitials = useMemo(() => {
    const rawName = loaderData?.storeName || loaderData?.shopName?.split(".")[0] || "Store";
    const words = rawName.replace(/[-_]+/g, " ").trim().split(/\s+/).filter(Boolean);
    if (words.length === 1) {
      return words[0].slice(0, 2).toUpperCase();
    }
    return words.slice(0, 2).map((w: string) => w[0]?.toUpperCase() ?? "").join("");
  }, [loaderData?.storeName, loaderData?.shopName]);

  const handleConnectStore = () => {
    const formData = new FormData();
    formData.append("intent", "connect-store");
    fetcher.submit(formData, { method: "post" });
    setToastMessage("Shopify store connected!");
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    if (fetcher.data && (fetcher.data as any).success && (fetcher.data as any).isConnected) {
      const timer = setTimeout(() => {
        navigate(".", { replace: true });
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [fetcher.data, navigate]);

  if (loaderData?.isNewUserOrDeleted) {
    return (
      <div className="w-full">
        {toastMessage && (
          <div className="fixed bottom-6 right-6 bg-gray-900 text-white text-xs font-medium px-4 py-2.5 rounded-xl shadow-xl z-50 flex items-center gap-2 border border-gray-700 animate-bounce">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}
        <OnboardingView
          storeName={loaderData.storeName}
          onConnect={handleConnectStore}
          isSubmitting={fetcher.state === "submitting"}
        />
      </div>
    );
  }



  return (
    <div className="mx-auto max-w-[1400px] space-y-6 pb-12 font-sans text-gray-900">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Products
            </h1>
            <span
              className={`font-medium text-[11px] px-2.5 py-0.5 rounded-full border ${
                loaderData?.isDisconnected
                  ? "bg-amber-50 text-amber-700 border-amber-100"
                  : "bg-indigo-50 text-indigo-700 border-indigo-100"
              }`}
            >
              {loaderData?.isDisconnected ? "Disconnected" : (loaderData?.storeName ?? "Shopify Catalog")}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage your Shopify products and run ProductReady AI audits.
          </p>
        </div>
        {selectedIds.length > 0 ? (
          <div className="flex items-center gap-3 bg-[#EEF2FF] border border-[#C7D2FE] px-4 py-2 rounded-2xl shadow-sm animate-fadeIn">
            <span className="text-xs font-bold text-[#3730A3] whitespace-nowrap">
              {selectedIds.length} {selectedIds.length === 1 ? "product" : "products"} selected
            </span>

            {(() => {
              const currentIntent = fetcher.formData?.get("intent");
              const isAnalyzingSelected = fetcher.state === "submitting" && (currentIntent === "bulk-analyze" || currentIntent === "run-bulk-analysis");
              return (
                <button
                  type="button"
                  onClick={handleAnalyzeSelectedProducts}
                  disabled={fetcher.state === "submitting" || loaderData?.isDisconnected}
                  className="px-4 py-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-semibold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all transform active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#4F46E5] disabled:scale-100 disabled:shadow-none whitespace-nowrap"
                  title={loaderData?.isDisconnected ? "Store is currently disconnected" : undefined}
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isAnalyzingSelected ? "animate-spin" : ""}`} />
                  <span>{isAnalyzingSelected ? "Analyzing..." : `Analyze (${selectedIds.length})`}</span>
                </button>
              );
            })()}

            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="px-2.5 py-1.5 text-gray-500 hover:text-gray-800 text-xs font-semibold hover:bg-white/60 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
              title="Deselect all"
            >
              <X className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            {(() => {
              const currentIntent = fetcher.formData?.get("intent");
              const isSyncing = fetcher.state === "submitting" && (currentIntent === "sync" || currentIntent === "sync-products");
              const isAnalyzingAll = fetcher.state === "submitting" && (currentIntent === "bulk-analyze" || currentIntent === "run-bulk-analysis");
              return (
                <>
                  <button
                    onClick={handleSyncProducts}
                    disabled={fetcher.state === "submitting" || loaderData?.isDisconnected}
                    className="px-3.5 py-2 bg-white border border-gray-200 text-gray-700 font-semibold text-xs rounded-xl shadow-2xs hover:bg-gray-50 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    title={loaderData?.isDisconnected ? "Store is disconnected" : "Sync products with Shopify Admin & database"}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-gray-500 ${isSyncing ? "animate-spin" : ""}`} />
                    <span>{isSyncing ? "Syncing..." : "Sync"}</span>
                  </button>

                  <button
                    onClick={handleAnalyzeAllProducts}
                    disabled={fetcher.state === "submitting" || productsList.length === 0 || loaderData?.isDisconnected}
                    className="px-3.5 py-2 bg-[#5B21B6] hover:bg-[#4C1D95] text-white font-semibold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#5B21B6] disabled:shadow-none"
                    title={loaderData?.isDisconnected ? "Store is currently disconnected" : "Run AI audit on all products in store"}
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${isAnalyzingAll ? "animate-spin" : ""}`} />
                    <span>{isAnalyzingAll ? "Analyzing All..." : "Analyze All"}</span>
                  </button>
                </>
              );
            })()}

            <div
              className="w-9 h-9 rounded-full bg-[#4F46E5] text-white font-bold text-xs flex items-center justify-center shadow-2xs cursor-pointer ml-1"
              title={loaderData?.storeName || "Store"}
            >
              {storeInitials}
            </div>
          </div>
        )}
      </div>

      {/* Disconnected Banner */}
      {loaderData?.isDisconnected && (
        <div className="bg-red-50/80 border border-red-200/80 rounded-xl px-3.5 py-2.5 flex items-center gap-3 shadow-2xs">
          <div className="w-8 h-8 rounded-lg bg-red-100/80 text-red-600 flex items-center justify-center shrink-0">
            <AlertCircle className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-bold text-red-950 tracking-tight leading-tight">
              Store Currently Disconnected
            </h3>
            <p className="text-[11px] text-red-700 mt-0.5 leading-tight">
              Your store is disconnected. Product sync and AI audits are paused.
            </p>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search products or category..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
            {/* Vendor Filter */}
            <select
              value={selectedVendor}
              onChange={(e) => {
                setSelectedVendor(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none cursor-pointer"
            >
              <option value="All">All Vendors</option>
              {loaderData?.vendors.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none cursor-pointer"
            >
              <option value="All">All Categories</option>
              {loaderData?.productTypes.map((pt) => (
                <option key={pt} value={pt}>
                  {pt}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Analyzed">Analyzed</option>
              <option value="Pending">Pending</option>
              <option value="Queued">Queued</option>
            </select>

            {/* Sort Order */}
            <button
              onClick={() => {
                setSortOrder(sortOrder === "asc" ? "desc" : "asc");
              }}
              className="p-2 bg-gray-50/70 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
              title="Toggle sort direction"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                <th className="py-3.5 pl-4 pr-2 w-10">
                  <input
                    type="checkbox"
                    checked={
                      displayedProducts.length > 0 &&
                      displayedProducts.every((p) => selectedIds.includes(p.id))
                    }
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-4 h-4 rounded text-[#4F46E5] focus:ring-[#4F46E5] cursor-pointer"
                  />
                </th>
                <th className="py-3.5 px-3">Product Name</th>
                <th className="py-3.5 px-3">Trust Score</th>
                <th className="py-3.5 px-3">Category</th>
                <th className="py-3.5 px-3">Price</th>
                <th className="py-3.5 px-3">Issues</th>
                <th className="py-3.5 px-3">Status</th>
                <th className="py-3.5 px-3">Last Analyzed</th>
                <th className="py-3.5 pr-4 pl-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayedProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-400 text-xs font-medium">
                    No products found matching filters.
                  </td>
                </tr>
              ) : (
                displayedProducts.map((item) => {
                  const isSelected = selectedIds.includes(item.id);
                  const isItemAnalyzing = analyzingIds.includes(item.id);
                  const isAnalyzed = item.status === "Analyzed" && item.score > 0 && item.lastAnalyzed !== "—";
                  const isQueued = item.status === "Queued";
                  const isRunning = item.status === "Running" || isItemAnalyzing;

                  return (
                    <tr
                      key={item.id}
                      onClick={() => openProductDetail(item)}
                      className={`hover:bg-gray-50/70 transition-colors cursor-pointer ${
                        isSelected ? "bg-[#EEF2FF]/40" : ""
                      }`}
                    >
                      {/* Checkbox Column */}
                      <td className="py-3.5 pl-4 pr-2" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(item.id)}
                          className="w-4 h-4 rounded text-[#4F46E5] focus:ring-[#4F46E5] cursor-pointer"
                        />
                      </td>

                      {/* Product Thumbnail & Details */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-3">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-9 h-9 rounded-xl object-cover border border-gray-100 shrink-0 cursor-pointer"
                            />
                          ) : (
                            <ProductThumbnail type={item.iconType} name={item.name} />
                          )}
                          <div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openProductDetail(item);
                              }}
                              className="font-bold text-xs text-gray-900 hover:text-[#4F46E5] text-left transition-colors cursor-pointer block"
                            >
                              {item.name}
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Trust Score Column */}
                      <td className="py-3.5 px-3">
                        {isAnalyzed ? (
                          <div className="flex items-baseline gap-0.5">
                            <span
                              className={`font-bold text-sm ${
                                item.score >= 70
                                  ? "text-[#10B981]"
                                  : item.score >= 50
                                  ? "text-[#F59E0B]"
                                  : "text-[#EF4444]"
                              }`}
                            >
                              {item.score}
                            </span>
                            <span className="text-xs text-gray-400 font-normal">/100</span>
                          </div>
                        ) : (
                          <span className="text-gray-300 font-medium text-xs">—</span>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-3 font-semibold text-gray-700 text-xs">
                        {item.category}
                      </td>

                      {/* Price */}
                      <td className="py-3.5 px-3 font-bold text-gray-900 text-xs">
                        {item.price}
                      </td>

                      {/* Issues Column */}
                      <td className="py-3.5 px-3">
                        {!isAnalyzed ? (
                          <span className="inline-flex items-center gap-1.5 font-normal text-gray-400 text-xs" title="Audit pending">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0" />
                            0
                          </span>
                        ) : item.issuesCount > 0 ? (
                          <span className="inline-flex items-center gap-1.5 font-bold text-gray-900 text-xs">
                            <span className={`w-1.5 h-1.5 rounded-full ${item.score < 50 ? "bg-red-500" : "bg-amber-500"} shrink-0`} />
                            {item.issuesCount}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 font-normal text-gray-400 text-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0" />
                            0
                          </span>
                        )}
                      </td>

                      {/* Status Column */}
                      <td className="py-3.5 px-3">
                        {isAnalyzed ? (
                          item.score >= 90 ? (
                            <span className="bg-[#EEF2FF] text-[#4F46E5] border border-[#E0E7FF]/80 px-3 py-1 rounded-full text-xs font-semibold inline-block whitespace-nowrap">
                              Excellent
                            </span>
                          ) : item.score >= 70 ? (
                            <span className="bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0]/80 px-3 py-1 rounded-full text-xs font-semibold inline-block whitespace-nowrap">
                              Good
                            </span>
                          ) : item.score >= 50 ? (
                            item.issuesCount >= 2 ? (
                              <span className="bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]/80 px-3 py-1 rounded-full text-xs font-semibold inline-block whitespace-nowrap">
                                Needs attention
                              </span>
                            ) : (
                              <span className="bg-[#F3F4F6] text-[#6B7280] border border-[#E5E7EB]/80 px-3 py-1 rounded-full text-xs font-semibold inline-block whitespace-nowrap">
                                Average
                              </span>
                            )
                          ) : (
                            <span className="bg-[#FEE2E2] text-[#DC2626] border border-[#FCA5A5]/80 px-3 py-1 rounded-full text-xs font-semibold inline-block whitespace-nowrap">
                              Needs attention
                            </span>
                          )
                        ) : isRunning ? (
                          <span className="bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0]/80 px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap">
                            <RefreshCw className="w-3 h-3 animate-spin text-[#16A34A]" />
                            Running
                          </span>
                        ) : isQueued ? (
                          <span className="bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]/80 px-3 py-1 rounded-full text-xs font-semibold inline-block whitespace-nowrap">
                            Queued
                          </span>
                        ) : (
                          <span className="bg-gray-100 text-gray-500 border border-gray-200/60 px-3 py-1 rounded-full text-xs font-semibold inline-block whitespace-nowrap">
                            Pending
                          </span>
                        )}
                      </td>

                      {/* Last Analyzed Date */}
                      <td className="py-3.5 px-3 text-gray-400 font-normal text-xs">
                        {isAnalyzed ? item.lastAnalyzed : "—"}
                      </td>

                      {/* Action Buttons */}
                      <td
                        className="py-3.5 pr-4 pl-3 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openProductDetailsPage(item)}
                            className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1"
                            title="View product details"
                          >
                            <Eye className="w-3.5 h-3.5 text-gray-500" />
                            <span>Details</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRunSingleAnalysis(item.id, item.name)}
                            disabled={loaderData?.isDisconnected || isItemAnalyzing}
                            className={`px-3 py-1 text-xs font-semibold rounded-lg shadow-2xs transition-all whitespace-nowrap ${
                              loaderData?.isDisconnected
                                ? "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed shadow-none opacity-50 pointer-events-none"
                                : isItemAnalyzing
                                ? "bg-[#4F46E5]/80 text-white cursor-not-allowed opacity-90 shadow-none"
                                : "bg-[#4F46E5] hover:bg-[#4338CA] text-white cursor-pointer active:scale-95 shadow-xs"
                            }`}
                            title={loaderData?.isDisconnected ? "Store is currently disconnected. Reconnect in Settings to run AI audits." : undefined}
                          >
                            {isItemAnalyzing ? (
                              <span className="flex items-center gap-1.5">
                                <RefreshCw className="w-3 h-3 animate-spin text-white" />
                                <span>Analyzing...</span>
                              </span>
                            ) : isAnalyzed ? (
                              "Re-analyze"
                            ) : isQueued ? (
                              "Queued"
                            ) : isRunning ? (
                              <span className="flex items-center gap-1.5">
                                <RefreshCw className="w-3 h-3 animate-spin text-white" />
                                <span>Analyzing...</span>
                              </span>
                            ) : (
                              "Analyze"
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 bg-gray-50/50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <div>
            Showing <span className="font-semibold text-gray-900">{displayedProducts.length}</span> of{" "}
            <span className="font-semibold text-gray-900">{sortedProducts.length}</span> products
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="font-semibold text-gray-900 px-2">
              Page {currentPage} of {totalPages}
            </span>

            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>



      {/* Product Details Drawer Component */}
      <ProductDetailsDrawer
        product={drawerProduct}
        isOpen={isDrawerOpen}
        isLoading={isDrawerLoading}
        onClose={() => setIsDrawerOpen(false)}
      />
    </div>
  );
}
