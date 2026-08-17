import { useState, useEffect } from "react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { useLoaderData, useFetcher } from "react-router";
import { authenticate } from "../shopify.server";
import {
  getAppSettingsForShop,
  saveAppSettingsForShop,
  disconnectStoreData,
  reconnectStoreData,
  touchStoreSyncTime,
  deleteStoreAccount,
  getStoreConnectionStatus,
} from "../services/settings.server";
import { getBillingDetailsForShop } from "../services/billing.server";
import { OnboardingView } from "../components/onboarding/OnboardingView";
import { ConnectStoreView } from "../components/onboarding/ConnectStoreView";
import prisma from "../db.server";
import {
  Rocket,
  Pencil,
  Calendar,
  Bell,
  Shield,
  Trash2,
  ExternalLink,
  Check,
  X,
  AlertTriangle,
  ShieldCheck,
  Store,
  RotateCw,
  Package,
  Truck,
  FileText,
  Lock,
  Info,
  Link as LinkIcon,
  Search,
  TrendingUp,
  Mail,
  CheckCircle2,
  ChevronDown,
  Copy,
} from "lucide-react";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);
  const shopName = session.shop;

  let storeName = "Demo Store";
  let myshopifyDomain = session.shop;
  let ownerEmail: string | undefined;

  try {
    const response = await admin.graphql(`
      #graphql
      query getShopInfo {
        shop {
          name
          email
          myshopifyDomain
        }
      }
    `);
    const shopJson = await response.json();
    const shop = shopJson.data?.shop;
    if (shop) {
      storeName = shop.name || storeName;
      myshopifyDomain = shop.myshopifyDomain || myshopifyDomain;
      ownerEmail = shop.email || undefined;
    }
  } catch (e) {
    console.error("Failed to query shop details in settings loader:", e);
  }

  const { isNewUserOrDeleted } = await getStoreConnectionStatus(shopName);

  const appSettings = await getAppSettingsForShop(shopName, storeName);
  const billingDetails = await getBillingDetailsForShop(shopName, admin);

  return {
    shopName,
    storeName,
    ownerEmail,
    myshopifyDomain,
    appSettings,
    billingDetails,
    isNewUserOrDeleted,
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);
  const shopName = session.shop;

  const formData = await request.formData();
  const intent = String(formData.get("intent") ?? "");

  if (intent === "save-settings" || intent === "toggle-preference") {
    const updated = await saveAppSettingsForShop(shopName, {
      autoAnalyzeNew: formData.get("autoAnalyzeNew") === "true",
      allowAiSuggestions: formData.get("allowAiSuggestions") === "true",
      detectCommonIssues: formData.get("detectCommonIssues") === "true",
      includeCustomerPhotos: formData.get("includeCustomerPhotos") === "true",
    });

    return { success: true, message: "Settings saved successfully!", settings: updated, isConnected: true };
  }

  if (intent === "disconnect-store") {
    const result = await disconnectStoreData(shopName);
    return { ...result, isConnected: false };
  }

  if (intent === "connect-store" || intent === "reconnect-store") {
    let storeName: string | undefined;
    let ownerEmail: string | undefined;
    try {
      const res = await admin.graphql(`
        #graphql
        query {
          shop {
            name
            email
          }
        }
      `);
      const { data } = await res.json();
      storeName = data?.shop?.name;
      ownerEmail = data?.shop?.email;
    } catch (e) {}

    const result = await reconnectStoreData(shopName, storeName, ownerEmail);
    return { ...result, isConnected: true };
  }

  if (intent === "sync-now") {
    const lastSyncAt = await touchStoreSyncTime(shopName);
    return { success: true, message: "Store data synced successfully!", lastSyncAt, isConnected: true };
  }

  if (intent === "delete-account") {
    const result = await deleteStoreAccount(shopName);
    return { ...result, isConnected: false };
  }

  return null;
};

function formatClientDate(date: Date = new Date()): string {
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SettingsPage() {
  const { storeName, myshopifyDomain, appSettings, billingDetails, isNewUserOrDeleted } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();

  const [isConnected, setIsConnected] = useState<boolean>(appSettings.isConnected ?? true);
  const [isDeleted, setIsDeleted] = useState<boolean>(false);
  const [lastSyncAt, setLastSyncAt] = useState<string>(appSettings.lastSyncAt || formatClientDate());
  const connectedOn = appSettings.connectedOn || formatClientDate();

  // Interactive Preference Toggles
  const [autoAnalyzeNew, setAutoAnalyzeNew] = useState<boolean>(appSettings.autoAnalyzeNew ?? false);
  const [analyzeUpdated, setAnalyzeUpdated] = useState<boolean>(appSettings.allowAiSuggestions ?? false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSupportEmail, setShowSupportEmail] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  useEffect(() => {
    if (appSettings.isConnected !== undefined) {
      setIsConnected(appSettings.isConnected);
    }
    if (appSettings.lastSyncAt) {
      setLastSyncAt(appSettings.lastSyncAt);
    }
    if (appSettings.autoAnalyzeNew !== undefined) setAutoAnalyzeNew(appSettings.autoAnalyzeNew);
    if (appSettings.allowAiSuggestions !== undefined) setAnalyzeUpdated(appSettings.allowAiSuggestions);
  }, [appSettings]);

  useEffect(() => {
    if (fetcher.data) {
      const d = fetcher.data as any;
      if ("isConnected" in d) {
        setIsConnected(Boolean(d.isConnected));
      }
      if ("lastSyncAt" in d && d.lastSyncAt) {
        setLastSyncAt(String(d.lastSyncAt));
      }
      if (d.settings) {
        if (d.settings.autoAnalyzeNew !== undefined) setAutoAnalyzeNew(d.settings.autoAnalyzeNew);
        if (d.settings.allowAiSuggestions !== undefined) setAnalyzeUpdated(d.settings.allowAiSuggestions);
      }
    }
  }, [fetcher.data]);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText("support@explified.com");
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleToggle = (
    key: "autoAnalyzeNew" | "analyzeUpdated",
    value: boolean
  ) => {
    let nextAuto = autoAnalyzeNew;
    let nextUpdated = analyzeUpdated;
    let label = "";

    if (key === "autoAnalyzeNew") {
      nextAuto = value;
      setAutoAnalyzeNew(value);
      label = "Auto-analyze new products";
    } else if (key === "analyzeUpdated") {
      nextUpdated = value;
      setAnalyzeUpdated(value);
      label = "Analyze updated products";
    }

    const formData = new FormData();
    formData.append("intent", "toggle-preference");
    formData.append("autoAnalyzeNew", String(nextAuto));
    formData.append("allowAiSuggestions", String(nextUpdated));

    fetcher.submit(formData, { method: "post" });

    setToastMessage(`${label} ${value ? "enabled" : "disabled"}`);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleSyncNow = () => {
    const formData = new FormData();
    formData.append("intent", "sync-now");
    fetcher.submit(formData, { method: "post" });
    setToastMessage("Syncing store data...");
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleDisconnectStore = () => {
    const formData = new FormData();
    formData.append("intent", "disconnect-store");
    fetcher.submit(formData, { method: "post" });
    setShowDisconnectModal(false);
    setIsConnected(false);
    setToastMessage("Store disconnected!");
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleConnectStore = () => {
    const formData = new FormData();
    formData.append("intent", "connect-store");
    fetcher.submit(formData, { method: "post" });
    setIsDeleted(false);
    setIsConnected(true);
    setToastMessage("Store connected successfully!");
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleDeleteData = () => {
    const formData = new FormData();
    formData.append("intent", "delete-account");
    fetcher.submit(formData, { method: "post" });
    setShowDeleteModal(false);
    setIsConnected(false);
    setIsDeleted(true);
    setToastMessage("All data deleted!");
    setTimeout(() => setToastMessage(null), 3000);
  };

  const shopifyAdminUrl = `https://${myshopifyDomain}/admin`;
  const planName = billingDetails?.planName || "Basic";

  // IF BRAND NEW USER OR DELETED DATA: Render Onboarding View
  if (isNewUserOrDeleted || isDeleted) {
    return (
      <div>
        {toastMessage && (
          <div className="fixed bottom-6 right-6 bg-gray-900 text-white text-xs font-medium px-4 py-2.5 rounded-xl shadow-xl z-50 flex items-center gap-2 border border-gray-700 animate-bounce">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}
        <OnboardingView
          storeName={storeName}
          onConnect={handleConnectStore}
          isSubmitting={fetcher.state === "submitting"}
        />
      </div>
    );
  }

  // IF STORE IS DISCONNECTED (via Disconnect Store): Render ConnectStoreView
  if (!isConnected) {
    return (
      <div>
        {toastMessage && (
          <div className="fixed bottom-6 right-6 bg-gray-900 text-white text-xs font-medium px-4 py-2.5 rounded-xl shadow-xl z-50 flex items-center gap-2 border border-gray-700 animate-bounce">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}
        <ConnectStoreView
          storeName={storeName}
          myshopifyDomain={myshopifyDomain}
          planName={planName}
          connectedOn={connectedOn}
          lastSyncAt={lastSyncAt}
          isConnected={false}
          onConnect={handleConnectStore}
          onSync={handleSyncNow}
          isSubmitting={fetcher.state === "submitting"}
        />
      </div>
    );
  }

  // IF STORE IS CONNECTED: Render full settings
  return (
    <div className="max-w-[1100px] mx-auto space-y-5 font-sans text-gray-900 pb-16 pt-2">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-gray-900 text-white text-xs font-medium px-4 py-2.5 rounded-xl shadow-xl z-50 flex items-center gap-2 border border-gray-700 animate-bounce">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Settings</h1>
        <p className="text-xs text-gray-500 mt-0.5">Manage your store and analysis preferences.</p>
      </div>

      {/* Card 1: Store Information */}
      <div className="bg-white rounded-2xl border border-gray-200/70 p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Store Information</h2>
          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
            Connected
          </span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-1">
          <div className="flex items-center gap-8 md:gap-12 flex-wrap">
            {/* Connected Store */}
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-[#E6F4EA] flex items-center justify-center shrink-0 border border-emerald-100 shadow-2xs p-1">
                <img src="/shopify-logo.png" alt="Shopify Logo" className="w-8 h-8 object-contain" />
              </div>
              <div>
                <div className="text-[11px] font-medium text-gray-400">Connected Store</div>
                <div className="text-sm font-bold text-gray-900 leading-snug">{storeName}</div>
                <a
                  href={shopifyAdminUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-[#4F46E5] hover:text-[#4338CA] inline-flex items-center gap-1 mt-0.5"
                >
                  View in Shopify <ExternalLink className="w-3 h-3 ml-0.5" />
                </a>
              </div>
            </div>

            {/* Store URL */}
            <div>
              <div className="text-[11px] font-medium text-gray-400">Store URL</div>
              <div className="text-sm font-bold text-gray-900 mt-0.5">{myshopifyDomain}</div>
              <div className="pt-0.5">
                <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                  Plan: {planName}
                </span>
              </div>
            </div>

            {/* Connected on */}
            <div className="space-y-0.5">
              <div className="text-[11px] font-medium text-gray-400">Connected on</div>
              <div className="text-xs font-semibold text-gray-800">{connectedOn}</div>
              <span className="text-[10px] font-semibold text-emerald-700 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" /> Secure Connection
              </span>
            </div>

            {/* Last Sync */}
            <div className="space-y-0.5">
              <div className="text-[11px] font-medium text-gray-400">Last Sync</div>
              <div className="text-xs font-semibold text-gray-800">{lastSyncAt}</div>
              <button
                type="button"
                onClick={handleSyncNow}
                className="inline-flex items-center gap-1 px-3 py-1 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg shadow-2xs cursor-pointer mt-0.5"
              >
                <span>Sync Now</span>
                <RotateCw className="w-3 h-3 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Action: Disconnect Store */}
          <div>
            <button
              type="button"
              onClick={() => setShowDisconnectModal(true)}
              className="px-4 py-2 border border-[#C7D2FE] text-[#4F46E5] hover:bg-[#EEF2FF] rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shadow-2xs"
            >
              Disconnect Store
            </button>
          </div>
        </div>
      </div>

      {/* Card 2: Analysis Preferences */}
      <div className="bg-white rounded-2xl border border-gray-200/70 p-6 shadow-2xs space-y-5">
        <div>
          <h2 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Analysis Preferences</h2>
          <p className="text-xs text-gray-400 mt-0.5">Choose how and when we analyze your products.</p>
        </div>

        <div className="space-y-4 text-xs divide-y divide-gray-100">
          {/* Row 1: Auto-analyze new products */}
          <div className="flex items-center justify-between pt-1 gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-[#F5F3FF] text-[#7C3AED] flex items-center justify-center shrink-0">
                <Rocket className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-xs">Auto-analyze new products</h3>
                <p className="text-gray-400 text-[11px]">Automatically analyze products when they are created.</p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={autoAnalyzeNew}
              onClick={() => handleToggle("autoAnalyzeNew", !autoAnalyzeNew)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                autoAnalyzeNew ? "bg-[#4F46E5]" : "bg-gray-200"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  autoAnalyzeNew ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Row 2: Analyze updated products */}
          <div className="flex items-center justify-between pt-4 gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-[#F5F3FF] text-[#7C3AED] flex items-center justify-center shrink-0">
                <Pencil className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-xs">Analyze updated products</h3>
                <p className="text-gray-400 text-[11px]">Re-analyze products when you make changes.</p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={analyzeUpdated}
              onClick={() => handleToggle("analyzeUpdated", !analyzeUpdated)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                analyzeUpdated ? "bg-[#4F46E5]" : "bg-gray-200"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  analyzeUpdated ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Card 3: Data & Privacy */}
      <div className="bg-white rounded-2xl border border-gray-200/70 p-6 shadow-2xs space-y-5">
        <div>
          <h2 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Data & Privacy</h2>
          <p className="text-xs text-gray-400 mt-0.5">Manage your data and privacy settings.</p>
        </div>

        <div className="space-y-4 text-xs">
          {/* Delete all data */}
          <div className="flex items-center justify-between pt-1 gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-xs">Delete all data</h3>
                <p className="text-gray-400 text-[11px]">Permanently delete all your data from our system.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 font-semibold rounded-xl text-xs transition-colors cursor-pointer whitespace-nowrap shadow-2xs"
            >
              Delete Data
            </button>
          </div>
        </div>
      </div>

      {/* Footer Section: About */}
      <div className="bg-white rounded-2xl border border-gray-200/70 p-6 shadow-2xs space-y-4 transition-all duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">About</h2>
            <p className="text-xs text-gray-400 mt-0.5">Application version and support.</p>
          </div>

          <div className="flex items-center gap-6 self-end sm:self-auto">
            <span className="text-xs font-bold text-gray-700">Version 1.0.0</span>
            <button
              type="button"
              onClick={() => setShowSupportEmail(!showSupportEmail)}
              className="px-4 py-2 border border-[#C7D2FE] text-[#4F46E5] hover:bg-[#EEF2FF] rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap inline-flex items-center gap-1.5 shadow-2xs"
            >
              <span>Contact Support</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showSupportEmail ? "rotate-180" : ""}`} />
            </button>
          </div>
        </div>

        {/* Slide Down Expanded Container */}
        {showSupportEmail && (
          <div className="pt-2 border-t border-gray-100 transition-all duration-300">
            <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Official Gmail Support</span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active 24/7
                </span>
              </div>

              <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-gray-200/80 gap-2">
                <a
                  href="https://mail.google.com/mail/?view=cm&fs=1&to=support@explified.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-bold text-gray-900 hover:text-[#4F46E5] transition-colors truncate"
                >
                  support@explified.com
                </a>

                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="px-2.5 py-1 bg-gray-50 hover:bg-gray-100 text-gray-700 text-[11px] font-semibold rounded border border-gray-200 transition-colors flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs"
                >
                  {copiedEmail ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-gray-500" />}
                  <span>{copiedEmail ? "Copied!" : "Copy"}</span>
                </button>
              </div>

              <div className="flex items-center justify-between text-[11px] text-gray-500 pt-0.5">
                <a
                  href="mailto:support@explified.com"
                  className="font-semibold text-[#4F46E5] hover:underline flex items-center gap-1"
                >
                  Send Direct Email <ExternalLink className="w-3 h-3" />
                </a>
                <span className="text-[10px] text-gray-400 font-medium">Response ~2h</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Disconnect Modal */}
      {showDisconnectModal && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-gray-900 text-sm">Disconnect Store</h3>
              </div>
              <button
                onClick={() => setShowDisconnectModal(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Are you sure you want to disconnect <strong>{storeName}</strong>? All widget configs and analysis cache will be cleared.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDisconnectModal(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDisconnectStore}
                className="px-4 py-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-semibold rounded-xl text-xs cursor-pointer shadow-2xs"
              >
                Confirm Disconnect
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Data Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                  <Trash2 className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-gray-900 text-sm">Delete All Data</h3>
              </div>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              This action cannot be undone. All product analysis records, score history, and widget configurations will be permanently deleted from our database.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteData}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-xs cursor-pointer shadow-2xs"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
