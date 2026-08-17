import { X } from "lucide-react";
import type { ScoreBreakdownItem } from "../../services/productAnalysis/types";

interface ScoreBreakdownModalProps {
  open: boolean;
  onClose: () => void;
  items: ScoreBreakdownItem[];
}

export function ScoreBreakdownModal({ open, onClose, items }: ScoreBreakdownModalProps) {
  if (!open) return null;

  const totalWeight = items.reduce((acc, item) => acc + item.weight, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 space-y-5 border border-gray-100">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <h3 className="font-bold text-gray-900 text-base">Score Breakdown</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Weighted dimensions that make up the Reality Score
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.label}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-gray-700">{item.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-400 font-medium">
                    {Math.round((item.weight / totalWeight) * 100)}% weight
                  </span>
                  <span className="text-xs font-bold text-gray-900">{item.value}</span>
                </div>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    item.value >= 80 ? "bg-emerald-500" : item.value >= 60 ? "bg-[#4F46E5]" : "bg-amber-500"
                  }`}
                  style={{ width: `${item.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}