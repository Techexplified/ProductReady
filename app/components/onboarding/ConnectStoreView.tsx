import { useState } from "react";
import { Link } from "react-router";
import {
  ArrowLeft,
  HelpCircle,
  Lock,
  Package,
  Truck,
  FileText,
  Store,
  CheckCircle2,
  MoreVertical,
  RotateCw,
  ExternalLink,
  Link as LinkIcon,
  Search,
  TrendingUp,
  Mail,
  Info,
  Check,
  X,
} from "lucide-react";

interface ConnectStoreViewProps {
  storeName?: string;
  myshopifyDomain?: string;
  planName?: string;
  connectedOn?: string;
  lastSyncAt?: string;
  isConnected?: boolean;
  onConnect?: () => void;
  onSync?: () => void;
  isSubmitting?: boolean;
}

export function ConnectStoreView({
  storeName = "Demo Store",
  myshopifyDomain = "demo-store.myshopify.com",
  planName = "Basic",
  connectedOn = "May 18, 2024 at 09:35 AM",
  lastSyncAt = "May 18, 2024 at 09:35 AM",
  isConnected = false,
  onConnect,
  onSync,
  isSubmitting = false,
}: ConnectStoreViewProps) {
  const [showSupportEmail, setShowSupportEmail] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const shopifyAdminUrl = `https://${myshopifyDomain}/admin`;

  const handleCopyEmail = () => {
    navigator.clipboard.writeText("support@explified.com");
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  return (
    <div className="w-full max-w-[1200px] mx-auto font-sans text-gray-900 pb-16 pt-2 space-y-6">
      {/* Top Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            to="/app"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors cursor-pointer mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Connect your store
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Connect your Shopify store to start analyzing your products and improve their readiness.
          </p>
        </div>
      </div>

      {/* Main 2-Column Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          {/* Card 1: Connect to Shopify */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-2xs space-y-4">
            <div className="flex items-start gap-4">
              {/* Green Shopify Icon Circle */}
              <div className="w-14 h-14 rounded-full bg-[#E6F4EA] border border-emerald-100 flex items-center justify-center p-3 shrink-0 shadow-2xs">
                <img
                  src="/shopify-logo.png"
                  alt="Shopify Logo"
                  className="w-8 h-8 object-contain"
                />
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <h2 className="text-base font-bold text-gray-900">
                  Connect to Shopify
                </h2>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Securely connect your Shopify store to allow us to analyze your products.
                </p>

                <div className="flex items-center gap-1.5 text-xs text-gray-600 font-medium pt-1">
                  <Lock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span>We only read your store data and never make changes.</span>
                </div>

                {/* Primary Button */}
                <div className="pt-3">
                  <button
                    type="button"
                    onClick={onConnect}
                    disabled={isSubmitting}
                    className="px-5 py-2.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 cursor-pointer disabled:opacity-75"
                  >
                    <img
                      src="/shopify-logo.png"
                      alt="Shopify Logo"
                      className="w-4 h-4 object-contain brightness-0 invert"
                    />
                    <span>{isSubmitting ? "Connecting..." : "Connect with Shopify"}</span>
                  </button>
                  <p className="text-[11px] text-gray-400 mt-2">
                    You'll be redirected to Shopify to install the app.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Connected Store Details */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Connected Store
                </h2>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    isConnected
                      ? "text-emerald-700 bg-emerald-50 border-emerald-100"
                      : "text-amber-700 bg-amber-50 border-amber-100"
                  }`}
                >
                  {isConnected ? "Connected" : "Disconnected"}
                </span>
              </div>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-1 items-start">
              {/* Store Info */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-50 text-[#4F46E5] flex items-center justify-center shrink-0 border border-indigo-100">
                  <Store className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-gray-900 truncate">
                    {storeName}
                  </div>
                  <a
                    href={shopifyAdminUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] font-semibold text-[#4F46E5] hover:text-[#4338CA] inline-flex items-center gap-0.5 truncate"
                  >
                    <span>{myshopifyDomain}</span>
                    <ExternalLink className="w-3 h-3 ml-0.5 shrink-0" />
                  </a>
                  <div className="mt-1">
                    <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                      Shopify Plan: {planName}
                    </span>
                  </div>
                </div>
              </div>

              {/* Connected on */}
              <div className="space-y-0.5">
                <div className="text-[11px] font-medium text-gray-400">Connected on</div>
                <div className="text-xs font-semibold text-gray-800">{connectedOn}</div>
                <div className="pt-0.5">
                  <span
                    className={`text-[10px] font-semibold flex items-center gap-1 ${
                      isConnected ? "text-emerald-700" : "text-amber-700"
                    }`}
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{isConnected ? "Connection is secure" : "Re-connection required"}</span>
                  </span>
                </div>
              </div>

              {/* Last Sync */}
              <div className="space-y-0.5">
                <div className="text-[11px] font-medium text-gray-400">Last Sync</div>
                <div className="text-xs font-semibold text-gray-800">{lastSyncAt}</div>
                <button
                  type="button"
                  onClick={onSync}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg shadow-2xs cursor-pointer mt-1 transition-colors"
                >
                  <span>Sync Now</span>
                  <RotateCw className="w-3 h-3 text-gray-500" />
                </button>
              </div>
            </div>
          </div>

          {/* Card 3: What we access */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-2xs space-y-4">
            <div>
              <h2 className="text-sm font-bold text-gray-900">What we access</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                We only access the data needed to analyze your products.
              </p>
            </div>

            {/* 4 Feature Boxes Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Products */}
              <div className="p-3.5 bg-gray-50/60 rounded-xl border border-gray-100 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-[#7C3AED] flex items-center justify-center shrink-0 border border-purple-100/50">
                  <Package className="w-4.5 h-4.5" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <h3 className="text-xs font-bold text-gray-900">Products</h3>
                  <p className="text-[11px] text-gray-500 leading-snug">
                    Product details, variants, images, description, etc.
                  </p>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 pt-1">
                    <Check className="w-3 h-3" /> Read access
                  </span>
                </div>
              </div>

              {/* Shipping */}
              <div className="p-3.5 bg-gray-50/60 rounded-xl border border-gray-100 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-[#7C3AED] flex items-center justify-center shrink-0 border border-purple-100/50">
                  <Truck className="w-4.5 h-4.5" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <h3 className="text-xs font-bold text-gray-900">Shipping</h3>
                  <p className="text-[11px] text-gray-500 leading-snug">
                    Shipping settings and delivery profiles.
                  </p>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 pt-1">
                    <Check className="w-3 h-3" /> Read access
                  </span>
                </div>
              </div>

              {/* Policies */}
              <div className="p-3.5 bg-gray-50/60 rounded-xl border border-gray-100 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-[#7C3AED] flex items-center justify-center shrink-0 border border-purple-100/50">
                  <FileText className="w-4.5 h-4.5" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <h3 className="text-xs font-bold text-gray-900">Policies</h3>
                  <p className="text-[11px] text-gray-500 leading-snug">
                    Return and refund policy details.
                  </p>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 pt-1">
                    <Check className="w-3 h-3" /> Read access
                  </span>
                </div>
              </div>

              {/* Store Info */}
              <div className="p-3.5 bg-gray-50/60 rounded-xl border border-gray-100 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-[#7C3AED] flex items-center justify-center shrink-0 border border-purple-100/50">
                  <Store className="w-4.5 h-4.5" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <h3 className="text-xs font-bold text-gray-900">Store Info</h3>
                  <p className="text-[11px] text-gray-500 leading-snug">
                    Store name, URL, and basic settings.
                  </p>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 pt-1">
                    <Check className="w-3 h-3" /> Read access
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-100 flex items-center gap-1.5 text-xs text-gray-500 font-medium">
              <Lock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span>You can disconnect anytime. Your data is never sold or shared.</span>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols) - Sidebar */}
        <div className="lg:col-span-4 space-y-5">
          {/* Card 1: How it works Timeline */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-2xs space-y-4">
            <h2 className="text-sm font-bold text-gray-900">How it works</h2>

            <div className="space-y-4 relative">
              {/* Vertical timeline line */}
              <div className="absolute top-3 left-4 bottom-3 w-0.5 bg-purple-100 -z-0" />

              {/* Step 1 */}
              <div className="flex items-start gap-3.5 relative z-10">
                <div className="w-8 h-8 rounded-full bg-purple-50 text-[#7C3AED] flex items-center justify-center shrink-0 border border-purple-100 shadow-2xs">
                  <LinkIcon className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <h3 className="text-xs font-bold text-gray-900">1. Connect</h3>
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    Authorize the app to connect your Shopify store securely.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3.5 relative z-10">
                <div className="w-8 h-8 rounded-full bg-purple-50 text-[#7C3AED] flex items-center justify-center shrink-0 border border-purple-100 shadow-2xs">
                  <RotateCw className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <h3 className="text-xs font-bold text-gray-900">2. Sync data</h3>
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    We sync your products and store settings.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-3.5 relative z-10">
                <div className="w-8 h-8 rounded-full bg-purple-50 text-[#7C3AED] flex items-center justify-center shrink-0 border border-purple-100 shadow-2xs">
                  <Search className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <h3 className="text-xs font-bold text-gray-900">3. Analyze</h3>
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    We analyze your products and identify what's missing.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex items-start gap-3.5 relative z-10">
                <div className="w-8 h-8 rounded-full bg-purple-50 text-[#7C3AED] flex items-center justify-center shrink-0 border border-purple-100 shadow-2xs">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <h3 className="text-xs font-bold text-gray-900">4. Improve</h3>
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    Follow our recommendations to improve product readiness.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Need Help? */}
          <div className="bg-[#FAF8FF] border border-[#F3E8FF] rounded-2xl p-5 shadow-2xs space-y-3">
            <h2 className="text-sm font-bold text-gray-900">Need help?</h2>
            <p className="text-xs text-gray-500 leading-relaxed">
              If you face any issues while connecting your store, we're here to help.
            </p>

            <button
              type="button"
              onClick={() => setShowSupportEmail(!showSupportEmail)}
              className="w-full py-2 px-4 bg-white hover:bg-gray-50 border border-gray-200/80 text-[#4F46E5] font-semibold text-xs rounded-xl flex items-center justify-center gap-2 shadow-2xs transition-colors cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Contact Support</span>
            </button>

            {showSupportEmail && (
              <div className="pt-2 border-t border-purple-100 space-y-2 animate-fadeIn">
                <div className="text-[11px] text-gray-600 font-medium">
                  Official Support Email:
                </div>
                <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-purple-100 text-xs">
                  <span className="font-semibold text-gray-800">support@explified.com</span>
                  <button
                    type="button"
                    onClick={handleCopyEmail}
                    className="text-[10px] font-bold text-[#4F46E5] hover:underline"
                  >
                    {copiedEmail ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Terms & Privacy Banner */}
      <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-3.5 text-xs text-indigo-900 flex items-center gap-2 shadow-2xs">
        <Info className="w-4 h-4 text-indigo-600 shrink-0" />
        <span>
          By connecting, you agree to our{" "}
          <a
            href="https://shopify.dev/docs/apps/store/terms"
            target="_blank"
            rel="noreferrer"
            className="font-bold text-[#4F46E5] hover:underline"
          >
            Terms of Service
          </a>{" "}
          and{" "}
          <a
            href="https://shopify.dev/docs/apps/store/privacy-policy"
            target="_blank"
            rel="noreferrer"
            className="font-bold text-[#4F46E5] hover:underline"
          >
            Privacy Policy
          </a>
          .
        </span>
      </div>
    </div>
  );
}
