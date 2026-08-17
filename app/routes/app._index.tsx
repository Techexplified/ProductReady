import { useState, useMemo, useEffect } from "react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { Link, useLoaderData, useNavigate, useFetcher } from "react-router";
import { authenticate } from "../shopify.server";
import { getShopifyProducts } from "../services/shopify.service.server";
import { getAnalysisRecordsForShop, AnalysisRecordDTO } from "../services/analysis.service.server";
import { reconnectStoreData, getStoreConnectionStatus } from "../services/settings.server";
import { useProducts } from "../context/ProductContext";
import { OnboardingView } from "../components/onboarding/OnboardingView";
import { ConnectStoreView } from "../components/onboarding/ConnectStoreView";
import {
  Calendar,
  Bell,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Speaker,
  Shirt,
  Coffee,
  Package,
  AlertCircle,
  AlertTriangle,
  HelpCircle,
  FileText,
  Truck,
  Check,
  Search,
  Lightbulb,
  ShieldCheck,
  Image as ImageIcon,
} from "lucide-react";

import prisma from "../db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);
  const shopName = session.shop;

  const formData = await request.formData();
  const intent = String(formData.get("intent") ?? "");

  if (intent === "connect-store" || intent === "embed-store") {
    let storeName: string | undefined;
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
      storeName = data?.shop?.name;
    } catch (e) {}

    await reconnectStoreData(shopName, storeName);
    return { success: true, isConnected: true };
  }

  return null;
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);
  const shopName = session.shop;

  const response = await admin.graphql(
    `#graphql
      query {
        shop {
          name
          myshopifyDomain
        }
      }`
  );
  const { data } = await response.json();
  const fallbackName = shopName.split(".")[0].split(/[-_]+/).map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  const storeName = data?.shop?.name ?? fallbackName;
  const myshopifyDomain = data?.shop?.myshopifyDomain ?? shopName;

  const { isNewUserOrDeleted, isDisconnected } = await getStoreConnectionStatus(shopName);

  if (isNewUserOrDeleted) {
    return {
      storeName,
      myshopifyDomain,
      products: [],
      isNewUserOrDeleted: true,
      isDisconnected: true,
    };
  }

  if (isDisconnected) {
    return {
      storeName,
      myshopifyDomain,
      products: [],
      isNewUserOrDeleted: false,
      isDisconnected: true,
    };
  }

  const { products: shopifyProducts } = await getShopifyProducts(admin, 50);
  const analysisRecords = await getAnalysisRecordsForShop(shopName);

  const products = shopifyProducts.map((sp) => {
    const rawNumeric = sp.id.includes("/") ? sp.id.split("/").pop()! : sp.id;
    const gidPId = `gid://shopify/Product/${rawNumeric}`;
    const analysis: AnalysisRecordDTO | undefined =
      analysisRecords[sp.id] || analysisRecords[gidPId] || analysisRecords[rawNumeric];

    return {
      id: sp.id,
      name: sp.title,
      imageUrl: sp.featuredImage?.url || null,
      category: "General",
      price: sp.price,
      sku: sp.sku,
      score: analysis?.score ?? 0,
      status: analysis ? (analysis.status === "COMPLETED" || (analysis.score && analysis.score > 0) ? "Analyzed" : "Pending") : "Pending",
      confidence: analysis?.confidence ?? "—",
      iconType: "default",
      views: analysis?.views ?? 0,
      ctr: analysis?.ctr ?? "0.0%",
      issuesCount: analysis?.issuesCount ?? 0,
      lastAnalyzed: analysis?.lastAnalyzed ?? "—",
      whatsMissingData: (analysis as any)?.whatsMissingData ?? null,
    };
  });

  return {
    storeName,
    products,
  };
};

export default function DashboardPage() {
  const loaderData = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const navigate = useNavigate();
  const contextData = useProducts();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleConnect = () => {
    const formData = new FormData();
    formData.append("intent", "embed-store");
    fetcher.submit(formData, { method: "post" });
    setToastMessage("Shopify store embedded & connected!");
    setTimeout(() => setToastMessage(null), 3000);
  };

  // After successful connect action, reload the page so the loader re-runs
  // and picks up the new connected state from the database
  useEffect(() => {
    if (fetcher.data && (fetcher.data as any).success && (fetcher.data as any).isConnected) {
      // Small delay so the toast is visible before reload
      const timer = setTimeout(() => {
        navigate(".", { replace: true });
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [fetcher.data, navigate]);

  const products = loaderData?.products && loaderData.products.length > 0
    ? loaderData.products
    : contextData.products;

  // Filter analyzed products
  const analyzedProducts = useMemo(
    () => products.filter((p) => (p.status === "Analyzed" || p.status === "Completed" || p.status === "Active") && p.score > 0),
    [products]
  );

  // Calculate average score ONLY over analyzed products
  const avgScore = useMemo(() => {
    if (analyzedProducts.length === 0) return 0;
    const total = analyzedProducts.reduce((acc, p) => acc + (p.score || 0), 0);
    return Math.round(total / analyzedProducts.length);
  }, [analyzedProducts]);

  // Total products analyzed counter
  const totalAnalyzed = analyzedProducts.length;

  // Compute total high priority issues from analyzed/store products
  const highPriorityIssues = useMemo(() => {
    return products.reduce(
      (acc, p) => acc + (p.issuesCount || (p.score > 0 && p.score < 80 ? 1 : 0)),
      0
    );
  }, [products]);

  // Calculate distribution numbers dynamically
  const distributionData = useMemo(() => {
    let excellent = 0;
    let good = 0;
    let average = 0;
    let poor = 0;

    analyzedProducts.forEach((p) => {
      const s = p.score || 0;
      if (s >= 90) excellent++;
      else if (s >= 70) good++;
      else if (s >= 50) average++;
      else if (s > 0) poor++;
    });

    return {
      total: analyzedProducts.length,
      excellent,
      good,
      average,
      poor,
    };
  }, [analyzedProducts]);

  // Top issues list derived dynamically from real DB whatsMissingData findings (MAX 5 issues)
  const topIssuesList = useMemo(() => {
    if (products.length === 0) return [];

    const issueCounts: Record<string, { count: number; rawTitle: string; iconType: string; impact: string }> = {};

    products.forEach((p: any) => {
      if (p.whatsMissingData) {
        try {
          const items = JSON.parse(p.whatsMissingData);
          if (Array.isArray(items)) {
            items.forEach((item: any) => {
              const title = (item.title || item.label || "Missing details").trim();
              if (title) {
                if (!issueCounts[title]) {
                  issueCounts[title] = {
                    count: 0,
                    rawTitle: title,
                    iconType: item.iconType || "specs",
                    impact: item.impact || "Medium",
                  };
                }
                issueCounts[title].count += 1;
              }
            });
          }
        } catch (e) {}
      }
    });

    const entries = Object.values(issueCounts);
    if (entries.length === 0) return [];

    // Sort entries by highest count descending
    entries.sort((a, b) => b.count - a.count);

    // Limit to MAX 5 issues
    const top5 = entries.slice(0, 5);
    const totalAnalyzed = analyzedProducts.length || 1;

    return top5.map((item) => {
      const isHigh = item.impact === "High";
      const pct = Math.round((item.count / totalAnalyzed) * 100);
      return {
        label: item.rawTitle,
        count: item.count,
        impact: item.impact,
        isHigh,
        pct,
        barWidth: `${Math.max(pct, 12)}%`,
      };
    });
  }, [products, analyzedProducts.length]);

  // Products needing attention derived dynamically from real store products needing audit or with score < 80
  const attentionProducts = useMemo(() => {
    if (products.length === 0) return [];

    const needy = products.filter((p) => p.score === 0 || (p.score > 0 && p.score < 80) || p.issuesCount > 0);

    const sorted = [...needy].sort((a, b) => {
      const scoreA = a.score || 0;
      const scoreB = b.score || 0;
      return scoreA - scoreB;
    });

    return sorted.slice(0, 3).map((p) => {
      const lowerName = p.name.toLowerCase();
      let icon = Package;
      let iconBg = "bg-indigo-100/70 text-indigo-500";

      if (lowerName.includes("speaker")) {
        icon = Speaker;
        iconBg = "bg-indigo-100/70 text-indigo-500";
      } else if (lowerName.includes("jacket") || lowerName.includes("shirt") || lowerName.includes("apparel")) {
        icon = Shirt;
        iconBg = "bg-amber-100/70 text-amber-600";
      } else if (lowerName.includes("mug") || lowerName.includes("coffee") || lowerName.includes("cup")) {
        icon = Coffee;
        iconBg = "bg-red-100/70 text-red-500";
      }

      // Extract real issue title from product's whatsMissingData AI audit report
      let issueText = "";
      if (p.whatsMissingData) {
        try {
          const parsed = typeof p.whatsMissingData === "string" ? JSON.parse(p.whatsMissingData) : p.whatsMissingData;
          if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.title) {
            issueText = parsed[0].title;
          }
        } catch (e) {}
      }

      if (!issueText) {
        issueText = p.score === 0
          ? "Analysis pending"
          : p.score < 50
          ? "Critical trust issues"
          : p.score < 65
          ? "Missing delivery estimate"
          : p.score < 80
          ? "Needs policy optimization"
          : "Good standing";
      }

      const issueColor = p.score === 0
        ? "text-gray-600 bg-gray-100 border-gray-200"
        : p.score < 60
        ? "text-red-600 bg-red-50/70 border-red-100"
        : p.score < 80
        ? "text-amber-600 bg-amber-50/70 border-amber-100"
        : "text-emerald-600 bg-emerald-50/70 border-emerald-100";

      return {
        id: p.id,
        name: p.name,
        imageUrl: p.imageUrl,
        score: p.score,
        scoreColor: p.score >= 70 ? "text-emerald-500" : p.score >= 50 ? "text-amber-500" : p.score > 0 ? "text-red-500" : "text-gray-400",
        issue: issueText,
        issueColor,
        icon,
        iconBg,
      };
    });
  }, [products]);

  const storeInitials = useMemo(() => {
    const rawName = loaderData?.storeName || "Store";
    const words = rawName.replace(/[-_]+/g, " ").trim().split(/\s+/).filter(Boolean);
    if (words.length === 1) {
      return words[0].slice(0, 2).toUpperCase();
    }
    return words.slice(0, 2).map((w: string) => w[0]?.toUpperCase() ?? "").join("");
  }, [loaderData?.storeName]);

  // Dynamic Donut chart segments (only non-zero segments rendered to avoid stroke linecap dot artifacts)
  const donutSegments = useMemo(() => {
    const tot = distributionData.total || 0;
    if (tot === 0) return [];

    const C = 88; // Circumference = 2 * Math.PI * 14 = ~88
    const rawSegments = [
      { key: "excellent", count: distributionData.excellent, color: "#10B981" },
      { key: "good", count: distributionData.good, color: "#4F46E5" },
      { key: "average", count: distributionData.average, color: "#F59E0B" },
      { key: "poor", count: distributionData.poor, color: "#EF4444" },
    ];

    const active = rawSegments.filter((s) => s.count > 0);

    if (active.length === 1) {
      return [
        {
          key: active[0].key,
          color: active[0].color,
          dashArray: `${C} 0`,
          dashOffset: "0",
        },
      ];
    }

    let cumulative = 0;
    return active.map((s) => {
      const len = (s.count / tot) * C;
      const offset = cumulative;
      cumulative += len;
      return {
        key: s.key,
        color: s.color,
        dashArray: `${len} ${C - len}`,
        dashOffset: `-${offset}`,
      };
    });
  }, [distributionData]);

  // IF NEW USER OR DELETED DATA: Render Onboarding View
  if (loaderData?.isNewUserOrDeleted) {
    return (
      <div className="w-full">
        {toastMessage && (
          <div className="fixed bottom-6 right-6 bg-gray-900 text-white text-xs font-medium px-4 py-2.5 rounded-xl shadow-xl z-50 flex items-center gap-2 border border-gray-700 animate-bounce">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}
        <OnboardingView
          storeName={loaderData.storeName}
          onConnect={handleConnect}
          isSubmitting={fetcher.state === "submitting"}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3.5 max-w-[1400px] mx-auto font-sans text-gray-900 pb-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-gray-900 text-white text-xs font-medium px-4 py-2.5 rounded-xl shadow-xl z-50 flex items-center gap-2 border border-gray-700 animate-bounce">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
              Dashboard
            </h1>
            <span className="bg-indigo-50 text-[#4F46E5] font-semibold text-[10px] px-2 py-0.5 rounded-full border border-indigo-100">
              {loaderData?.storeName ?? "Store DB"}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Overview of your store's product insights and performance.
          </p>
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-full bg-[#4F46E5] text-white font-semibold text-xs flex items-center justify-center shadow-2xs cursor-pointer"
            title={loaderData?.storeName ?? "Store"}
          >
            {storeInitials}
          </div>
        </div>
      </div>

      {/* Disconnected Banner */}
      {loaderData?.isDisconnected && (
        <div className="bg-red-50/80 border border-red-200/80 rounded-xl px-3.5 py-2.5 flex items-center gap-3 shadow-2xs">
          <div className="w-8 h-8 rounded-lg bg-red-100/80 text-red-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4" />
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

      {/* Top Section: 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Metric 1: Average Trust Score */}
        <div className="bg-white rounded-xl p-3.5 border border-gray-200/80 shadow-2xs hover:border-indigo-100 hover:shadow-xs transition-all flex flex-col justify-between">
          <div>
            <p className="text-[11px] font-medium text-gray-500">
              Average Trust Score
            </p>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl font-bold text-gray-900 tracking-tight">
                {analyzedProducts.length > 0 ? avgScore : "—"}
              </span>
              <span className="text-xs font-normal text-gray-400">/100</span>
            </div>
          </div>
          <div className="mt-2.5 flex items-center gap-1 text-[11px] font-medium text-emerald-600">
            <TrendingUp className="w-3 h-3" />
            <span>{analyzedProducts.length > 0 ? "vs. target 80+" : "No audits yet"}</span>
          </div>
        </div>

        {/* Metric 2: Products Analyzed */}
        <div className="bg-white rounded-xl p-3.5 border border-gray-200/80 shadow-2xs hover:border-indigo-100 hover:shadow-xs transition-all flex flex-col justify-between">
          <div>
            <p className="text-[11px] font-medium text-gray-500">
              Products Analyzed
            </p>
            <h2 className="text-xl font-bold text-gray-900 mt-1 tracking-tight">
              {totalAnalyzed}
            </h2>
          </div>
          <div className="mt-2.5 flex items-center gap-1 text-[11px] font-medium text-emerald-600">
            <TrendingUp className="w-3 h-3" />
            <span>Out of {products.length} total products</span>
          </div>
        </div>

        {/* Metric 3: High Priority Issues */}
        <div className="bg-white rounded-xl p-3.5 border border-gray-200/80 shadow-2xs hover:border-indigo-100 hover:shadow-xs transition-all flex flex-col justify-between">
          <div>
            <p className="text-[11px] font-medium text-gray-500">
              High Priority Issues
            </p>
            <h2 className="text-xl font-bold text-gray-900 mt-1 tracking-tight">
              {highPriorityIssues}
            </h2>
          </div>
          <div className="mt-2.5 flex items-center gap-1 text-[11px] font-medium text-red-500">
            <TrendingDown className="w-3 h-3" />
            <span>{highPriorityIssues > 0 ? "Flagged in audit" : "No issues detected"}</span>
          </div>
        </div>
      </div>

      {/* Middle Section: Score Distribution & Top Issues Found */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Trust Score Distribution Card */}
        <div className="lg:col-span-5 bg-white rounded-xl p-4 border border-gray-200/80 shadow-2xs flex flex-col justify-between">
          <h3 className="text-sm font-bold text-gray-900 tracking-tight mb-2">
            Trust Score Distribution
          </h3>

          <div className="flex flex-col sm:flex-row items-center justify-around gap-4 my-auto">
            {/* Donut Chart SVG with Center Count */}
            <div className="relative w-32 h-32 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                {/* Background Ring */}
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  stroke="#F3F4F6"
                  strokeWidth="3.5"
                />

                {/* Render active segments only */}
                {donutSegments.map((seg) => (
                  <circle
                    key={seg.key}
                    cx="18"
                    cy="18"
                    r="14"
                    fill="none"
                    stroke={seg.color}
                    strokeWidth="3.5"
                    strokeDasharray={seg.dashArray}
                    strokeDashoffset={seg.dashOffset}
                    strokeLinecap={donutSegments.length > 1 ? "round" : "butt"}
                  />
                ))}
              </svg>

              {/* Inner Donut Content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xl font-bold text-gray-900 tracking-tight">
                  {distributionData.total}
                </span>
                <span className="text-[10px] font-medium text-gray-400">
                  Total Products
                </span>
              </div>
            </div>

            {/* Legend List */}
            <div className="space-y-2 w-full sm:w-auto">
              <div className="flex items-center gap-2 text-[11px]">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-gray-600 font-medium">Excellent (90–100)</span>
                <span className="font-bold text-gray-900 ml-auto sm:ml-3">
                  {distributionData.excellent}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#4F46E5] shrink-0" />
                <span className="text-gray-600 font-medium">Good (70–89)</span>
                <span className="font-bold text-gray-900 ml-auto sm:ml-3">
                  {distributionData.good}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                <span className="text-gray-600 font-medium">Average (50–69)</span>
                <span className="font-bold text-gray-900 ml-auto sm:ml-3">
                  {distributionData.average}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
                <span className="text-gray-600 font-medium">Poor (0–49)</span>
                <span className="font-bold text-gray-900 ml-auto sm:ml-3">
                  {distributionData.poor}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Issues Found Card */}
        <div className="lg:col-span-7 bg-white rounded-xl p-4 border border-gray-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-gray-900 tracking-tight">
                Top Issues Found
              </h3>
              <span className="bg-indigo-50 text-[#4F46E5] font-semibold text-[10px] px-2 py-0.5 rounded-full border border-indigo-100">
                {topIssuesList.length} types
              </span>
            </div>
            <span className="text-[10px] text-gray-400 font-medium">Impact</span>
          </div>

          <div className="space-y-1.5 my-auto">
            {topIssuesList.length === 0 ? (
              <div className="py-4 text-center text-xs text-gray-400 font-medium">
                No flagged issues detected across your store's products.
              </div>
            ) : (
              topIssuesList.map((issue, idx) => (
                <div
                  key={idx}
                  className="py-1 px-2 hover:bg-gray-50/80 rounded-lg transition-colors space-y-1"
                >
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${
                          issue.isHigh ? "bg-red-50 text-red-500" : "bg-amber-50 text-amber-500"
                        }`}
                      >
                        {issue.isHigh ? <AlertCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                      </div>
                      <span className="font-semibold text-gray-800 truncate text-[11px]">
                        {issue.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                          issue.isHigh
                            ? "bg-red-50 text-red-600 border-red-100"
                            : "bg-amber-50 text-amber-600 border-amber-100"
                        }`}
                      >
                        {issue.impact}
                      </span>
                      <span className="text-[10px] font-bold text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">
                        {issue.count}
                      </span>
                    </div>
                  </div>

                  <div className="pl-6 flex items-center gap-2">
                    <div className="w-40 sm:w-56 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          issue.isHigh ? "bg-red-500" : "bg-amber-500"
                        }`}
                        style={{ width: issue.barWidth }}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-2 pt-2 border-t border-gray-100">
            <Link
              to="/app/products"
              className="text-[11px] font-semibold text-[#4F46E5] hover:text-[#4338CA] inline-flex items-center gap-1 transition-colors"
            >
              <span>View all products</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Section: 2 Columns - Products Needing Attention (Left ~70%) + How it works (Right ~30%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Products Needing Attention */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-5 border border-gray-200/80 shadow-2xs space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-1">
            <h3 className="text-sm font-bold text-gray-900 tracking-tight">
              Products Needing Attention
            </h3>
            <Link
              to="/app/products"
              className="text-xs font-semibold text-[#6366F1] hover:text-[#4F46E5] inline-flex items-center gap-1 transition-colors"
            >
              <span>View all products</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {attentionProducts.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-400 font-medium">
              All products are in good standing.
            </div>
          ) : (
            <div className="space-y-3">
              {attentionProducts.map((prod, idx) => {
                const IconComp = prod.icon || Package;
                const scoreBadgeBg =
                  prod.score === 0
                    ? "bg-gray-100 text-gray-600"
                    : prod.score < 50
                    ? "bg-red-50 text-red-600 border border-red-100"
                    : prod.score < 70
                    ? "bg-amber-50 text-amber-700 border border-amber-100"
                    : "bg-emerald-50 text-emerald-700 border border-emerald-100";

                return (
                  <div
                    key={idx}
                    onClick={() => {
                      const rawId = prod.id.includes("/") ? prod.id.split("/").pop()! : prod.id;
                      navigate(`/app/products/${rawId}`);
                    }}
                    className="p-3 bg-white hover:bg-gray-50/80 border border-gray-200/80 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-4"
                  >
                    {/* Product Info */}
                    <div className="flex items-center gap-3 min-w-0">
                      {prod.imageUrl ? (
                        <img
                          src={prod.imageUrl}
                          alt={prod.name}
                          className="w-11 h-11 rounded-xl object-cover border border-gray-200/70 shrink-0 bg-gray-50"
                        />
                      ) : (
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${prod.iconBg}`}>
                          <IconComp className="w-5 h-5" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <h4 className="font-bold text-gray-900 text-xs tracking-tight truncate">
                          {prod.name}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[11px] text-gray-400 font-medium">Trust Score</span>
                          <span className={`text-[11px] font-bold px-1.5 py-0.2 rounded-md ${scoreBadgeBg}`}>
                            {prod.score > 0 ? prod.score : "—"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Middle Issue Alert */}
                    <div className="flex items-center gap-1.5 text-xs text-gray-700 font-medium shrink-0">
                      <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                      <span>{prod.issue}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: How it works Card */}
        <div className="lg:col-span-4 bg-[#FAF9FF] border border-[#F3E0FF]/60 rounded-2xl p-5 shadow-2xs flex flex-col justify-between space-y-4">
          <h3 className="text-sm font-bold text-gray-900 tracking-tight">
            How it works
          </h3>

          <div className="space-y-4">
            {/* Step 1 */}
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-white shadow-2xs text-[#7C3AED] flex items-center justify-center shrink-0 mt-0.5 border border-[#F3E0FF]">
                <Search className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <h4 className="font-bold text-gray-900 text-xs">1. We analyze</h4>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  We check your product pages for key trust factors.
                </p>
              </div>
            </div>

            <div className="border-t border-[#F3E0FF]/50" />

            {/* Step 2 */}
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-white shadow-2xs text-[#7C3AED] flex items-center justify-center shrink-0 mt-0.5 border border-[#F3E0FF]">
                <Lightbulb className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <h4 className="font-bold text-gray-900 text-xs">2. You improve</h4>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  Follow our recommendations to fix what's missing.
                </p>
              </div>
            </div>

            <div className="border-t border-[#F3E0FF]/50" />

            {/* Step 3 */}
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-white shadow-2xs text-[#7C3AED] flex items-center justify-center shrink-0 mt-0.5 border border-[#F3E0FF]">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <h4 className="font-bold text-gray-900 text-xs">3. Build trust</h4>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  Better information builds customer confidence and sales.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
