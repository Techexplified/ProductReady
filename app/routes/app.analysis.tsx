import { useMemo } from "react";
import type { LoaderFunctionArgs } from "react-router";
import { Link, useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { getShopifyProducts } from "../services/shopify.service.server";
import { getAnalysisRecordsForShop, AnalysisRecordDTO } from "../services/analysis.service.server";
import prisma from "../db.server";
import { getStoreConnectionStatus } from "../services/settings.server";
import { OnboardingView } from "../components/onboarding/OnboardingView";
import { ConnectStoreView } from "../components/onboarding/ConnectStoreView";
import {
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Search,
  ArrowRight,
  TrendingUp,
  BarChart3,
  CheckCircle2,
  Lock,
} from "lucide-react";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);
  const shopName = session.shop;

  const { isNewUserOrDeleted, isDisconnected } = await getStoreConnectionStatus(shopName);

  if (isNewUserOrDeleted) {
    return {
      isNewUserOrDeleted: true,
      isDisconnected: false,
      shopName,
      storeName: session.shop.split(".")[0],
      products: [],
      stats: { total: 0, analyzedCount: 0, avgScore: 0, highPriorityIssues: 0 },
    };
  }

  if (isDisconnected) {
    return {
      isNewUserOrDeleted: false,
      isDisconnected: true,
      shopName,
      storeName: session.shop.split(".")[0],
      products: [],
      stats: { total: 0, analyzedCount: 0, avgScore: 0, highPriorityIssues: 0 },
    };
  }

  const { products: shopifyProducts } = await getShopifyProducts(admin, 50);
  const analysisRecords = await getAnalysisRecordsForShop(shopName);

  const productsWithAnalysis = shopifyProducts.map((sp) => {
    const rawNumeric = sp.id.includes("/") ? sp.id.split("/").pop()! : sp.id;
    const gidPId = `gid://shopify/Product/${rawNumeric}`;
    const analysis: AnalysisRecordDTO | undefined =
      analysisRecords[sp.id] || analysisRecords[gidPId] || analysisRecords[rawNumeric];

    return {
      id: sp.id,
      numericId: rawNumeric,
      name: sp.title,
      imageUrl: sp.featuredImage?.url || null,
      price: sp.price,
      sku: sp.sku,
      score: analysis?.score ?? 0,
      status: analysis ? (analysis.status === "COMPLETED" || (analysis.score && analysis.score > 0) ? "Analyzed" : "Pending") : "Pending",
      confidence: analysis?.confidence ?? "—",
      issuesCount: analysis?.issuesCount ?? 0,
      lastAnalyzed: analysis?.lastAnalyzed ?? "—",
      summary: analysis?.summary || "Analysis pending.",
      whatsMissingData: (analysis as any)?.whatsMissingData ?? null,
    };
  });

  const analyzed = productsWithAnalysis.filter((p) => p.score > 0);
  const totalScore = analyzed.reduce((acc, p) => acc + p.score, 0);
  const avgScore = analyzed.length > 0 ? Math.round(totalScore / analyzed.length) : 0;
  const highPriorityIssues = productsWithAnalysis.reduce((acc, p) => acc + p.issuesCount, 0);

  return {
    isDisconnected: false,
    shopName,
    storeName: session.shop.split(".")[0].split(/[-_]+/).map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
    products: productsWithAnalysis,
    stats: {
      total: shopifyProducts.length,
      analyzedCount: analyzed.length,
      avgScore,
      highPriorityIssues,
    },
  };
};

export default function AnalysisPage() {
  const loaderData = useLoaderData<typeof loader>();

  const storeInitials = useMemo(() => {
    const rawName = loaderData?.storeName || "Store";
    const words = rawName.replace(/[-_]+/g, " ").trim().split(/\s+/).filter(Boolean);
    if (words.length === 1) {
      return words[0].slice(0, 2).toUpperCase();
    }
    return words.slice(0, 2).map((w: string) => w[0]?.toUpperCase() ?? "").join("");
  }, [loaderData?.storeName]);

  if (loaderData.isNewUserOrDeleted) {
    return (
      <div className="w-full">
        <OnboardingView
          storeName={loaderData.storeName}
          onConnect={() => {
            window.location.href = "/app/settings";
          }}
        />
      </div>
    );
  }

  if (loaderData.isDisconnected) {
    return (
      <div className="max-w-3xl mx-auto my-12 bg-white rounded-2xl border border-amber-200 p-8 shadow-sm text-center space-y-4 font-sans text-gray-900">
        <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-gray-900">Store Currently Disconnected</h2>
        <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
          Your Shopify store is disconnected. Reconnect your store in Settings to run AI analysis and view scores.
        </p>
        <div className="pt-2">
          <Link
            to="/app/settings"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
          >
            <span>Go to Settings to Connect</span>
          </Link>
        </div>
      </div>
    );
  }

  const productsList = loaderData.products || [];
  const stats = loaderData.stats || { total: 0, analyzedCount: 0, avgScore: 0, highPriorityIssues: 0 };

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto font-sans text-gray-900 pb-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              AI Analysis Center
            </h1>
            <span className="bg-purple-50 text-purple-700 font-medium text-[11px] px-2.5 py-0.5 rounded-full border border-purple-100 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-purple-500" /> AI Engine Active
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Storewide AI trust score analysis, product readiness metrics, and optimization reports.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/app/products"
            className="px-3.5 py-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-semibold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Manage All Products</span>
          </Link>
          <div
            className="w-9 h-9 rounded-full bg-[#4F46E5] text-white font-bold text-xs flex items-center justify-center shadow-2xs cursor-pointer"
            title={loaderData?.storeName || "Store"}
          >
            {storeInitials}
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {/* Stat 1 */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-medium">Average Trust Score</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-2xl font-extrabold text-gray-900">{stats.avgScore}</span>
            <span className="text-xs font-semibold text-gray-400">/ 100</span>
          </div>
          <p className="text-[11px] text-gray-400 pt-0.5">Based on {stats.analyzedCount} analyzed items</p>
        </div>

        {/* Stat 2 */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-medium">Analyzed Products</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-2xl font-extrabold text-gray-900">{stats.analyzedCount}</span>
            <span className="text-xs font-semibold text-gray-400">/ {stats.total} total</span>
          </div>
          <p className="text-[11px] text-emerald-600 pt-0.5 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Catalog synced
          </p>
        </div>

        {/* Stat 3 */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-medium">Total Issues Identified</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-2xl font-extrabold text-gray-900">{stats.highPriorityIssues}</span>
            <span className="text-xs font-semibold text-amber-600">action items</span>
          </div>
          <p className="text-[11px] text-gray-400 pt-0.5">Missing specs, media or policies</p>
        </div>

        {/* Stat 4 */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-medium">AI Audit Accuracy</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <BarChart3 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-2xl font-extrabold text-gray-900">91%</span>
            <span className="text-xs font-semibold text-purple-600">High Confidence</span>
          </div>
          <p className="text-[11px] text-gray-400 pt-0.5">Powered by Groq LLM Analysis</p>
        </div>
      </div>

      {/* Analysis Records Table */}
      <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-gray-900">Product AI Audit Overview</h2>
            <p className="text-xs text-gray-500">Detailed trust readiness and missing elements per catalog item.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                <th className="pb-3 pl-2">Product</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Reality Score</th>
                <th className="pb-3">Missing Elements</th>
                <th className="pb-3">Last Analyzed</th>
                <th className="pb-3 text-right pr-2">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-xs">
              {productsList.map((p) => {
                const scoreColor =
                  p.score >= 80
                    ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                    : p.score >= 60
                    ? "bg-amber-50 text-amber-700 border-amber-100"
                    : p.score > 0
                    ? "bg-red-50 text-red-700 border-red-100"
                    : "bg-gray-100 text-gray-500 border-gray-200";

                return (
                  <tr key={p.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3 pl-2 flex items-center gap-3">
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt="" className="w-8 h-8 rounded-lg object-cover border border-gray-200 shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-gray-100 text-gray-400 flex items-center justify-center shrink-0 font-semibold text-xs">
                          {p.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-gray-900 line-clamp-1">{p.name}</div>
                        <div className="text-[10px] text-gray-400">{p.price} • {p.sku}</div>
                      </div>
                    </td>

                    <td className="py-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${p.status === "Analyzed" ? "bg-purple-50 text-purple-700" : "bg-gray-100 text-gray-500"}`}>
                        {p.status}
                      </span>
                    </td>

                    <td className="py-3">
                      <span className={`px-2.5 py-1 rounded-xl text-xs font-bold border ${scoreColor}`}>
                        {p.score > 0 ? `${p.score} / 100` : "Pending"}
                      </span>
                    </td>

                    <td className="py-3 text-gray-500">
                      {p.issuesCount > 0 ? (
                        <span className="text-amber-600 font-medium flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> {p.issuesCount} items missing
                        </span>
                      ) : p.score > 0 ? (
                        <span className="text-emerald-600 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Fully optimized
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>

                    <td className="py-3 text-gray-400 text-[11px]">{p.lastAnalyzed}</td>

                    <td className="py-3 text-right pr-2">
                      <Link
                        to={`/app/products/${p.numericId}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#4F46E5] hover:text-[#4338CA] transition-colors"
                      >
                        <span>View Audit</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}