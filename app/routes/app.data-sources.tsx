import { useMemo } from "react";
import type { LoaderFunctionArgs } from "react-router";
import { Link, useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { getStoreConnectionStatus } from "../services/settings.server";
import { OnboardingView } from "../components/onboarding/OnboardingView";
import { ConnectStoreView } from "../components/onboarding/ConnectStoreView";
import {
  Database,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  FileText,
  Lock,
  ExternalLink,
  Server,
  Zap,
} from "lucide-react";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);
  const shopName = session.shop;

  const { isNewUserOrDeleted, isDisconnected } = await getStoreConnectionStatus(shopName);

  // Query shop name and policies
  let storeName = session.shop.split(".")[0];
  let myshopifyDomain = session.shop;
  let policiesFound = 0;

  try {
    const response = await admin.graphql(
      `#graphql
        query {
          shop {
            name
            myshopifyDomain
            shopPolicies {
              type
            }
          }
        }`
    );
    const { data } = await response.json();
    storeName = data?.shop?.name || storeName;
    myshopifyDomain = data?.shop?.myshopifyDomain || myshopifyDomain;
    policiesFound = data?.shop?.shopPolicies?.length || 0;
  } catch (e) { }

  const analysisCount = dbStore
    ? await prisma.analysis.count({ where: { storeId: dbStore.id } })
    : 0;

  return {
    isNewUserOrDeleted,
    isDisconnected,
    shopName,
    storeName,
    myshopifyDomain,
    policiesFound,
    analysisCount,
    lastSyncAt: dbStore?.updatedAt?.toLocaleString() || new Date().toLocaleString(),
  };
};

export default function DataSourcesPage() {
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
          <Server className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-gray-900">Store Currently Disconnected</h2>
        <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
          Your Shopify store is disconnected. Reconnect your store in Settings to enable live policy and product data sources.
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

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto font-sans text-gray-900 pb-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Data Sources & Integrations
            </h1>
            <span className="bg-emerald-50 text-emerald-700 font-medium text-[11px] px-2.5 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Active Sync
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Connected data providers, AI models, and store policy sources powering ProductReady AI.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/app/settings"
            className="px-3.5 py-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-semibold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Manage Integrations</span>
          </Link>
          <div
            className="w-9 h-9 rounded-full bg-[#4F46E5] text-white font-bold text-xs flex items-center justify-center shadow-2xs cursor-pointer"
            title={loaderData?.storeName || "Store"}
          >
            {storeInitials}
          </div>
        </div>
      </div>

      {/* Main Grid of Data Sources */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Source 1: Shopify GraphQL API */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-2xs space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                <img src="/shopify-logo.png" alt="Shopify" className="w-6 h-6 object-contain" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Shopify Admin GraphQL API</h3>
                <p className="text-[11px] text-gray-400">{loaderData.myshopifyDomain}</p>
              </div>
            </div>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${!loaderData.isDisconnected ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-amber-50 text-amber-700 border border-amber-100"}`}>
              {!loaderData.isDisconnected ? "Connected" : "Disconnected"}
            </span>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            Pulls product titles, descriptions, pricing, media galleries, inventory, variants, and custom metafields directly from your store.
          </p>
          <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
            <span>API Version: 2026-10 (2026 GraphQL)</span>
            <span className="flex items-center gap-1 font-semibold text-purple-600">
              <Zap className="w-3 h-3" /> Live Sync
            </span>
          </div>
        </div>

        {/* Source 2: Groq AI Audit Engine */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-2xs space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">ProductReady AI Audit Engine</h3>
                <p className="text-[11px] text-gray-400">Groq LLaMA-3.3 70B Model</p>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
              Active
            </span>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            Evaluates product readiness, computes trust scores, detects missing policy information, and generates conversion-boosting recommendations.
          </p>
          <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
            <span>Latency: ~350ms</span>
            <span className="font-semibold text-indigo-600">High Speed Inference</span>
          </div>
        </div>

        {/* Source 3: PostgreSQL Database */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-2xs space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">PostgreSQL Cloud Storage</h3>
                <p className="text-[11px] text-gray-400">Neon Cloud Serverless DB</p>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
              Operational
            </span>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            Stores persistent AI audit scores, historical analysis records, store owner metadata, and custom widget display settings.
          </p>
          <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
            <span>Records Cached: {loaderData.analysisCount} analyses</span>
            <span className="font-semibold text-blue-600">Secure Storage</span>
          </div>
        </div>

        {/* Source 4: Store Policies & Metafields */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-2xs space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Shop Policies & Metafields</h3>
                <p className="text-[11px] text-gray-400">Shipping, Refunds & Metafields</p>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
              {loaderData.policiesFound > 0 ? `${loaderData.policiesFound} Policies Active` : "Enabled"}
            </span>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            Extracts shipping, refund, and warranty policy text to eliminate false-positive missing information warnings during AI audits.
          </p>
          <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
            <span>Last Sync: {loaderData.lastSyncAt}</span>
            <span className="font-semibold text-amber-600">Auto Extracted</span>
          </div>
        </div>
      </div>

      {/* Security Footer Note */}
      <div className="bg-[#FAF7FF] border border-[#F3E8FF] rounded-2xl p-4 shadow-2xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-100/90 text-purple-700 flex items-center justify-center shrink-0">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-gray-900">Data Isolation & Protection Guarantee</h4>
            <p className="text-[11px] text-gray-500">
              All data queries are strictly scoped to your store domain (`session.shop`). We never share or expose data between stores.
            </p>
          </div>
        </div>

        <a
          href="https://shopify.dev/docs/apps/store/privacy-policy"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs font-semibold text-purple-700 hover:text-purple-900 transition-colors whitespace-nowrap"
        >
          <span>Data Privacy Docs</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
