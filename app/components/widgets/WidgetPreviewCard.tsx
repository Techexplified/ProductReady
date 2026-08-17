import { useState } from "react";
import {
  Monitor,
  Smartphone,
  ShieldCheck,
  Check,
  X,
  Sparkles,
  ThumbsUp,
  ShoppingBag,
  ShoppingCart,
  ArrowRight,
  Star,
  CheckCircle2,
} from "lucide-react";
import type { WidgetTheme, WidgetContentConfig, WidgetBehaviorConfig } from "../../types/widget.types";

interface WidgetPreviewCardProps {
  theme: WidgetTheme;
  contentConfig: WidgetContentConfig;
  behaviorConfig: WidgetBehaviorConfig;
  location?: string; // "Product Page" | "Collection Page" | "Cart Page" | "Home Page"
  storeName?: string;
}

export function WidgetPreviewCard({
  theme,
  contentConfig,
  behaviorConfig,
  location = "Product Page",
  storeName = "My Store",
}: WidgetPreviewCardProps) {
  const [deviceMode, setDeviceMode] = useState<"desktop" | "mobile">("desktop");

  const primaryColor = theme.primaryColor || "#4F46E5";
  const isVertical = theme.layout === "vertical";
  const isCompact = theme.layout === "compact";
  const isHorizontal = theme.layout === "horizontal";

  // URL per location
  const getUrl = () => {
    switch (location) {
      case "Collection Page":
        return "https://myawesomestore.myshopify.com/collections/audio-accessories";
      case "Cart Page":
        return "https://myawesomestore.myshopify.com/cart";
      case "Home Page":
        return "https://myawesomestore.myshopify.com";
      case "Product Page":
      default:
        return "https://myawesomestore.myshopify.com/products/bluetooth-speaker-pro";
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs overflow-hidden flex flex-col w-full">
      {/* Top Preview Controls Bar */}
      <div className="px-4 py-3 bg-gray-50/80 border-b border-gray-200/70 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-gray-800 tracking-tight">Widget Preview</span>
          <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
            {location}
          </span>
        </div>

        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-0.5">
          <button
            type="button"
            onClick={() => setDeviceMode("desktop")}
            className={`p-1.5 rounded-md text-xs font-medium transition-colors ${
              deviceMode === "desktop"
                ? "bg-indigo-50 text-[#4F46E5]"
                : "text-gray-400 hover:text-gray-600"
            }`}
            title="Desktop view"
          >
            <Monitor className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setDeviceMode("mobile")}
            className={`p-1.5 rounded-md text-xs font-medium transition-colors ${
              deviceMode === "mobile"
                ? "bg-indigo-50 text-[#4F46E5]"
                : "text-gray-400 hover:text-gray-600"
            }`}
            title="Mobile view"
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Simulated Browser Frame */}
      <div className="p-4 bg-gray-100/60 flex-1 overflow-y-auto flex justify-center items-start">
        <div
          className={`bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden transition-all duration-300 ${
            deviceMode === "mobile" ? "w-[340px]" : "w-full max-w-[680px]"
          }`}
        >
          {/* Simulated Browser URL Bar */}
          <div className="px-3 py-2 bg-gray-100 border-b border-gray-200 flex items-center gap-2 text-[11px] text-gray-400">
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            </div>
            <div className="flex-1 bg-white border border-gray-200 rounded-md px-2 py-0.5 text-center text-gray-500 truncate text-[10px] font-mono">
              {getUrl()}
            </div>
          </div>

          {/* SIMULATED PAGE CONTENT PER LOCATION */}
          <div className="p-4 space-y-4">
            {/* LOCATION 1: COLLECTION PAGE */}
            {location === "Collection Page" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Audio Accessories Collection</h3>
                    <p className="text-[11px] text-gray-400">4 AI-Verified Store Products</p>
                  </div>
                  <span className="text-[10px] text-gray-400 font-medium">Sort: Featured</span>
                </div>

                {/* Grid of Products */}
                <div className={`grid gap-3 ${deviceMode === "mobile" ? "grid-cols-1" : "grid-cols-2"}`}>
                  {[
                    { name: "Bluetooth Speaker Pro", price: "$79.99", score: 91, reviews: 462 },
                    { name: "Wireless Headphones", price: "$129.99", score: 94, reviews: 812 },
                  ].map((p, idx) => (
                    <div
                      key={idx}
                      className="border border-gray-200/80 rounded-xl p-3 bg-white space-y-2 hover:border-indigo-300 transition-colors shadow-2xs"
                    >
                      <div className="aspect-video bg-indigo-50/60 rounded-lg flex items-center justify-center text-indigo-400">
                        <Sparkles className="w-5 h-5 text-indigo-500" />
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-gray-900 block leading-tight">
                          {p.name}
                        </span>
                        <span className="text-xs font-bold text-gray-700 block">{p.price}</span>
                      </div>

                      {/* EMBEDDED COLLECTION WIDGET BADGE */}
                      <div
                        className="pt-2 border-t border-gray-100 p-2 rounded-lg bg-gray-50/80 space-y-1.5"
                        style={{ borderColor: `${primaryColor}30` }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            {contentConfig.showTrustBadge && (
                              <ShieldCheck className="w-3.5 h-3.5" style={{ color: primaryColor }} />
                            )}
                            <span className="text-[10px] font-extrabold text-gray-800">
                              ProductReady Score
                            </span>
                          </div>
                          {contentConfig.showRealityScore && (
                            <span
                              className="text-[10px] font-extrabold px-1.5 py-0.5 rounded text-white"
                              style={{ backgroundColor: primaryColor }}
                            >
                              {p.score}/100
                            </span>
                          )}
                        </div>

                        {contentConfig.showWorthBuying && (
                          <div className="flex items-center justify-between text-[9px] text-gray-500 font-semibold">
                            <span>AI Verified Quality</span>
                            <span className="text-emerald-700 bg-emerald-50 px-1 rounded font-bold">
                              YES
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* LOCATION 2: CART PAGE */}
            {location === "Cart Page" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 text-gray-700" />
                    <span>Your Cart (2 items)</span>
                  </h3>
                  <span className="text-[11px] text-gray-400">Total: $99.98</span>
                </div>

                {/* Cart Items */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-500 shrink-0">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-gray-900 block leading-tight">
                          Bluetooth Speaker Pro
                        </span>
                        <span className="text-[10px] text-gray-400">Qty: 1 × $79.99</span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-gray-900">$79.99</span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 shrink-0">
                        <ShoppingBag className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-gray-900 block leading-tight">
                          Fast USB-C Cable
                        </span>
                        <span className="text-[10px] text-gray-400">Qty: 1 × $19.99</span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-gray-900">$19.99</span>
                  </div>
                </div>

                {/* EMBEDDED CART TRUST WIDGET */}
                <div
                  className="p-3.5 rounded-xl border space-y-2 bg-white"
                  style={{
                    borderColor: `${primaryColor}40`,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {contentConfig.showTrustBadge && (
                        <div
                          className="w-5 h-5 rounded flex items-center justify-center text-white shrink-0"
                          style={{ backgroundColor: primaryColor }}
                        >
                          <ShieldCheck className="w-3 h-3" />
                        </div>
                      )}
                      <span className="text-xs font-extrabold text-gray-900">
                        100% ProductReady Verified Guarantee
                      </span>
                    </div>
                    {contentConfig.showConfidence && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Authentic Order
                      </span>
                    )}
                  </div>

                  {contentConfig.showAiSummary && (
                    <p className="text-[10px] text-gray-600 leading-relaxed">
                      All products in your cart are verified clean with a 91/100 ProductReady Score and 30-day risk-free buyer protection guarantee.
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  className="w-full py-2.5 bg-gray-900 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer hover:bg-black transition-colors"
                >
                  <span>Proceed to Checkout ($99.98)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* LOCATION 3: HOME PAGE */}
            {location === "Home Page" && (
              <div className="space-y-3">
                {/* TOP ANNOUNCEMENT BANNER WIDGET */}
                <div
                  className="p-2.5 rounded-xl text-white flex items-center justify-between px-3 shadow-2xs"
                  style={{ backgroundColor: primaryColor }}
                >
                  <div className="flex items-center gap-2 text-xs font-bold">
                    {contentConfig.showTrustBadge && <ShieldCheck className="w-4 h-4 text-white" />}
                    <span>Over 10,000+ Store Products AI Verified by ProductReady</span>
                  </div>
                  {contentConfig.showWorthBuying && (
                    <span className="text-[10px] font-extrabold bg-white/20 px-2 py-0.5 rounded-md">
                      VERIFIED STORE
                    </span>
                  )}
                </div>

                {/* Hero Store banner */}
                <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-5 text-center space-y-2">
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">
                    SUMMER SALE 2026
                  </span>
                  <h2 className="text-base font-extrabold text-gray-900">
                    Premium Audio Accessories
                  </h2>
                  <p className="text-[11px] text-gray-500 max-w-xs mx-auto">
                    Shop authentic tech products backed by AI customer review audits and instant trust verification.
                  </p>
                </div>
              </div>
            )}

            {/* LOCATION 4: PRODUCT PAGE (DEFAULT) */}
            {location === "Product Page" && (
              <div className={`grid gap-4 ${deviceMode === "mobile" ? "grid-cols-1" : "grid-cols-12"}`}>
                {/* Product Image */}
                <div
                  className={`${
                    deviceMode === "mobile" ? "w-full" : "col-span-5"
                  } aspect-square bg-indigo-50/60 rounded-xl border border-indigo-100/60 flex flex-col items-center justify-center text-indigo-400 space-y-2 p-4`}
                >
                  <div className="w-12 h-12 rounded-xl bg-white border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-2xs">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-gray-700">Bluetooth Speaker Pro</span>
                </div>

                {/* Product Info & Embedded Widget */}
                <div className={`${deviceMode === "mobile" ? "w-full" : "col-span-7"} space-y-2`}>
                  <div className="space-y-1">
                    <h2 className="text-base font-bold text-gray-900 leading-tight">
                      Bluetooth Speaker Pro
                    </h2>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-900">$79.99</span>
                      <span className="text-xs text-gray-400 line-through">$99.99</span>
                    </div>
                  </div>

                  {/* EMBEDDED PRODUCT WIDGET */}
                  <div
                    className="mt-3 transition-all duration-300"
                    style={{
                      borderRadius: theme.borderRadius || "16px",
                      borderColor: `${primaryColor}30`,
                    }}
                  >
                    <div
                      className="border rounded-2xl p-3.5 space-y-3 bg-white"
                      style={{
                        borderColor: `${primaryColor}40`,
                        boxShadow:
                          theme.shadow === "large"
                            ? "0 10px 15px -3px rgba(0,0,0,0.08)"
                            : "0 2px 8px rgba(0,0,0,0.04)",
                      }}
                    >
                      {/* Top Header */}
                      <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                          {contentConfig.showTrustBadge && (
                            <div
                              className="w-6 h-6 rounded-lg flex items-center justify-center text-white"
                              style={{ backgroundColor: primaryColor }}
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                            </div>
                          )}
                          <div>
                            <span className="text-xs font-bold text-gray-900 block leading-tight">
                              ProductReady Reality Score
                            </span>
                            <span className="text-[10px] text-gray-400">AI-verified product analysis</span>
                          </div>
                        </div>

                        {contentConfig.showConfidence && (
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            High Confidence
                          </span>
                        )}
                      </div>

                      {/* Content Layout */}
                      <div
                        className={`grid gap-3 ${
                          isVertical || isCompact ? "grid-cols-1" : "grid-cols-12"
                        }`}
                      >
                        {/* Reality Score Gauge */}
                        {contentConfig.showRealityScore && (
                          <div
                            className={`flex items-center gap-3 bg-gray-50/80 p-2.5 rounded-xl border border-gray-100 ${
                              isHorizontal ? "col-span-5 flex-col items-start justify-center" : ""
                            }`}
                          >
                            <div className="relative w-14 h-14 shrink-0">
                              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                <circle
                                  cx="18"
                                  cy="18"
                                  r="14"
                                  fill="none"
                                  stroke="#E5E7EB"
                                  strokeWidth="3.5"
                                />
                                <circle
                                  cx="18"
                                  cy="18"
                                  r="14"
                                  fill="none"
                                  stroke={primaryColor}
                                  strokeWidth="3.5"
                                  strokeDasharray="88 88"
                                  strokeDashoffset="8"
                                  strokeLinecap="round"
                                />
                              </svg>
                              <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-xs font-extrabold text-gray-900">91</span>
                                <span className="text-[8px] text-gray-400">/100</span>
                              </div>
                            </div>

                            <div className="space-y-0.5 text-[10px] text-gray-600 font-medium">
                              <div className="flex items-center gap-1">
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span>Based on 462 reviews</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span>128 customer photos</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* AI Summary */}
                        {contentConfig.showAiSummary && (
                          <div
                            className={`bg-indigo-50/50 p-2.5 rounded-xl border border-indigo-100/60 ${
                              isHorizontal ? "col-span-7" : ""
                            }`}
                          >
                            <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-900 mb-1">
                              <Sparkles className="w-3 h-3 text-indigo-600" />
                              <span>AI Summary</span>
                            </div>
                            <p className="text-[10px] text-gray-700 leading-relaxed">
                              Customers love the sound quality and build. Most say it looks exactly like the photos and is worth the price.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Pros & Cons */}
                      {contentConfig.showProsCons && (
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <div className="bg-emerald-50/50 p-2 rounded-xl border border-emerald-100/70 space-y-1">
                            <span className="text-[10px] font-bold text-emerald-900 flex items-center gap-1">
                              <ThumbsUp className="w-2.5 h-2.5 text-emerald-600" /> Top Pros
                            </span>
                            <ul className="space-y-0.5 text-[9px] text-emerald-800 font-medium">
                              <li className="flex items-center gap-1">
                                <Check className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                                <span>Excellent sound quality</span>
                              </li>
                            </ul>
                          </div>

                          <div className="bg-rose-50/50 p-2 rounded-xl border border-rose-100/70 space-y-1">
                            <span className="text-[10px] font-bold text-rose-900 flex items-center gap-1">
                              <X className="w-2.5 h-2.5 text-rose-600" /> Top Cons
                            </span>
                            <ul className="space-y-0.5 text-[9px] text-rose-800 font-medium">
                              <li className="flex items-center gap-1">
                                <X className="w-2.5 h-2.5 text-rose-500 shrink-0" />
                                <span>Slightly bulky</span>
                              </li>
                            </ul>
                          </div>
                        </div>
                      )}

                      {/* Worth Buying Badge */}
                      {contentConfig.showWorthBuying && (
                        <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] font-bold text-gray-800 block leading-tight">
                              Worth Buying?
                            </span>
                            <span className="text-[9px] text-gray-400">Highly recommended</span>
                          </div>
                          <span
                            className="text-xs font-bold px-3 py-1 rounded-lg text-white shadow-2xs"
                            style={{ backgroundColor: primaryColor }}
                          >
                            YES
                          </span>
                        </div>
                      )}

                      {/* Footer attribution */}
                      <div className="text-center pt-1">
                        <span className="text-[9px] text-gray-400 font-medium">
                          Powered by <span className="font-bold text-gray-700">ProductReady</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
