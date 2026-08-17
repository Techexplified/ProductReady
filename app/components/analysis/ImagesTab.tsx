import { Image as ImageIcon, ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";
import type { CustomerImage } from "../../services/productAnalysis/types";

interface ImagesTabProps {
  images: CustomerImage[];
}

function verificationConfig(status: CustomerImage["verification"]) {
  switch (status) {
    case "Verified":
      return {
        badge: "bg-emerald-50 text-emerald-600",
        icon: <ShieldCheck className="w-4 h-4" />,
        border: "border-emerald-200",
      };
    case "Suspicious":
      return {
        badge: "bg-amber-50 text-amber-600",
        icon: <ShieldAlert className="w-4 h-4" />,
        border: "border-amber-200",
      };
    case "Failed":
      return {
        badge: "bg-red-50 text-red-500",
        icon: <ShieldX className="w-4 h-4" />,
        border: "border-red-200",
      };
  }
}

export function ImagesTab({ images }: ImagesTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-[#4F46E5]">
            <ImageIcon className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-gray-900">Customer-uploaded Images</h3>
        </div>
        <span className="text-xs font-semibold text-gray-500">{images.length} images scanned</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {images.map((img) => {
          const config = verificationConfig(img.verification);
          return (
            <div
              key={img.id}
              className={`bg-white rounded-2xl p-4 border ${config.border} shadow-sm hover:shadow-md transition-shadow`}
            >
              {/* Placeholder image tile */}
              <div className="aspect-video rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-gray-100 flex items-center justify-center mb-3">
                <ImageIcon className="w-8 h-8 text-[#4F46E5]/30" />
              </div>

              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-bold text-gray-900">{img.label}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{img.source}</p>
                </div>
                <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${config.badge}`}>
                  {config.icon}
                  {img.verification}
                </span>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px]">
                <span className="text-gray-500">{img.angle}</span>
                <span className="font-mono text-gray-400">{img.detectedLabel}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}