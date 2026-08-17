import { RefreshCw, Sparkles } from "lucide-react";

export function LoadingSkeleton() {
  const skeletonCards = [
    { className: "sm:col-span-1 lg:col-span-1", h: "h-64" },
    { className: "sm:col-span-1 lg:col-span-2", h: "h-64" },
    { className: "sm:col-span-1 lg:col-span-1", h: "h-64" },
    { className: "sm:col-span-1 lg:col-span-1", h: "h-64" },
    { className: "sm:col-span-1 lg:col-span-2", h: "h-64" },
    { className: "sm:col-span-1 lg:col-span-1", h: "h-64" },
    { className: "sm:col-span-1 lg:col-span-1", h: "h-64" },
    { className: "sm:col-span-1 lg:col-span-1", h: "h-64" },
    { className: "sm:col-span-1 lg:col-span-1", h: "h-64" },
  ];

  return (
    <div className="space-y-6">
      {/* AI Analyzing Banner */}
      <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-indigo-50 border border-indigo-100 rounded-3xl p-8 text-center space-y-3 shadow-2xs">
        <div className="w-12 h-12 rounded-2xl bg-white text-[#4F46E5] flex items-center justify-center mx-auto shadow-xs border border-indigo-100">
          <RefreshCw className="w-6 h-6 animate-spin text-[#4F46E5]" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-center gap-1.5 text-sm font-extrabold text-indigo-900 tracking-tight">
            <Sparkles className="w-4 h-4 text-[#4F46E5]" />
            <span>Re-analyzing Product Details...</span>
          </div>
          <p className="text-xs text-gray-600 max-w-md mx-auto">
            Auditing description, media quality, return policies, and pricing trust signals. Updating scores...
          </p>
        </div>
      </div>

      {/* Cards grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 pt-2">
        {skeletonCards.map((card, i) => (
          <div
            key={i}
            className={`bg-white rounded-2xl p-5 border border-gray-100 shadow-sm animate-pulse ${card.className}`}
          >
            <div className={`${card.h} rounded-xl`}>
              <div className="w-24 h-3 bg-gray-200 rounded-lg mb-4" />
              <div className="w-32 h-4 bg-gray-200 rounded-lg mb-6" />
              <div className="space-y-3">
                <div className="h-3 bg-gray-200 rounded-full" />
                <div className="h-3 bg-gray-200 rounded-full w-5/6" />
                <div className="h-3 bg-gray-200 rounded-full w-4/6" />
                <div className="h-3 bg-gray-200 rounded-full w-3/6" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}