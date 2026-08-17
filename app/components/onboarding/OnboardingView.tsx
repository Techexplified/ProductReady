import { Lock, Search, BarChart3, TrendingUp, ShieldCheck, ArrowRight, CheckCircle2 } from "lucide-react";

interface OnboardingViewProps {
  storeName?: string;
  onConnect?: () => void;
  isSubmitting?: boolean;
}

export function OnboardingView({ onConnect, isSubmitting }: OnboardingViewProps) {
  return (
    <div className="w-full max-w-[620px] mx-auto flex flex-col items-center font-sans text-gray-900 px-4 py-3 select-none h-[calc(100vh-100px)] justify-between">
      {/* Hero Section */}
      <div className="flex flex-col items-center text-center space-y-2 shrink-0">
        {/* Shopify Logo Badge */}
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#E8DEF8] to-[#F3E8FF] border border-[#E9D5FF]/60 flex items-center justify-center shadow-sm">
          <img src="/shopify-logo.png" alt="Shopify" className="w-7 h-7 object-contain" />
        </div>

        <div className="space-y-1">
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">
            Connect your store
          </h1>
          <p className="text-xs text-gray-500 max-w-sm leading-relaxed">
            Link your Shopify store so we can analyze your products and help you build customer trust.
          </p>
        </div>
      </div>

      {/* Main Action Card */}
      <div className="w-full bg-white border border-gray-200/80 rounded-2xl p-4 shadow-sm space-y-3 shrink-0">
        <button
          type="button"
          onClick={onConnect}
          disabled={isSubmitting}
          className="w-full py-2.5 px-5 bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
        >
          <img src="/shopify-logo.png" alt="" className="w-4 h-4 object-contain brightness-0 invert" />
          <span>{isSubmitting ? "Connecting..." : "Connect your Shopify store"}</span>
          <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
        </button>

        <div className="flex items-center justify-center gap-3 text-[10px] text-gray-400 font-medium">
          <span className="flex items-center gap-1">
            <Lock className="w-3 h-3" /> Secure connection
          </span>
          <span className="w-1 h-1 rounded-full bg-gray-200" />
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> Read-only access
          </span>
        </div>
      </div>

      {/* Steps Timeline */}
      <div className="w-full bg-white border border-gray-200/80 rounded-2xl p-4 shadow-sm shrink-0">
        <h2 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
          How it works
        </h2>

        <div className="flex items-start justify-between gap-2">
          {/* Step 1 */}
          <div className="flex-1 flex flex-col items-center text-center gap-1.5">
            <div className="w-7 h-7 rounded-full bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center text-[11px] font-bold border border-[#E0E7FF]">
              1
            </div>
            <h3 className="text-[11px] font-semibold text-gray-900">Connect</h3>
            <p className="text-[10px] text-gray-400 leading-snug">Authorize securely</p>
          </div>

          <div className="w-8 h-px bg-gray-200 mt-3.5 shrink-0" />

          {/* Step 2 */}
          <div className="flex-1 flex flex-col items-center text-center gap-1.5">
            <div className="w-7 h-7 rounded-full bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center text-[11px] font-bold border border-[#E0E7FF]">
              2
            </div>
            <h3 className="text-[11px] font-semibold text-gray-900">Analyze</h3>
            <p className="text-[10px] text-gray-400 leading-snug">We scan products</p>
          </div>

          <div className="w-8 h-px bg-gray-200 mt-3.5 shrink-0" />

          {/* Step 3 */}
          <div className="flex-1 flex flex-col items-center text-center gap-1.5">
            <div className="w-7 h-7 rounded-full bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center text-[11px] font-bold border border-[#E0E7FF]">
              3
            </div>
            <h3 className="text-[11px] font-semibold text-gray-900">Improve</h3>
            <p className="text-[10px] text-gray-400 leading-snug">Boost trust & sales</p>
          </div>
        </div>
      </div>

      {/* What you get - 4 cols */}
      <div className="w-full grid grid-cols-4 gap-2 shrink-0">
        <div className="bg-white border border-gray-200/80 rounded-xl p-3 shadow-sm flex flex-col items-center text-center gap-1.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Search className="w-3.5 h-3.5" />
          </div>
          <h4 className="text-[11px] font-semibold text-gray-900 leading-tight">Product audits</h4>
          <p className="text-[10px] text-gray-400 leading-snug">AI-powered analysis</p>
        </div>

        <div className="bg-white border border-gray-200/80 rounded-xl p-3 shadow-sm flex flex-col items-center text-center gap-1.5">
          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <BarChart3 className="w-3.5 h-3.5" />
          </div>
          <h4 className="text-[11px] font-semibold text-gray-900 leading-tight">Trust scores</h4>
          <p className="text-[10px] text-gray-400 leading-snug">Readiness at a glance</p>
        </div>

        <div className="bg-white border border-gray-200/80 rounded-xl p-3 shadow-sm flex flex-col items-center text-center gap-1.5">
          <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-3.5 h-3.5" />
          </div>
          <h4 className="text-[11px] font-semibold text-gray-900 leading-tight">Actionable tips</h4>
          <p className="text-[10px] text-gray-400 leading-snug">Improvement guides</p>
        </div>

        <div className="bg-white border border-gray-200/80 rounded-xl p-3 shadow-sm flex flex-col items-center text-center gap-1.5">
          <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-3.5 h-3.5" />
          </div>
          <h4 className="text-[11px] font-semibold text-gray-900 leading-tight">Data safety</h4>
          <p className="text-[10px] text-gray-400 leading-snug">Read-only access</p>
        </div>
      </div>

      {/* Footer Security Note */}
      <div className="w-full flex items-center justify-center gap-3 text-[10px] text-gray-400 shrink-0">
        <span className="flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Disconnect anytime
        </span>
        <span className="w-1 h-1 rounded-full bg-gray-200" />
        <span className="flex items-center gap-1">
          <Lock className="w-3 h-3 text-gray-300" /> Data never sold or shared
        </span>
      </div>
    </div>
  );
}
