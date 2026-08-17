import { Lightbulb, ArrowUpRight, Clock } from "lucide-react";
import type { SuggestionItem } from "../../services/productAnalysis/types";

interface SuggestionsTabProps {
  suggestions: SuggestionItem[];
}

function impactConfig(impact: SuggestionItem["impact"]) {
  switch (impact) {
    case "High":
      return "bg-emerald-50 text-emerald-600";
    case "Medium":
      return "bg-amber-50 text-amber-600";
    case "Low":
      return "bg-gray-100 text-gray-500";
  }
}

export function SuggestionsTab({ suggestions }: SuggestionsTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-[#4F46E5]">
            <Lightbulb className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-gray-900">AI Improvement Suggestions</h3>
        </div>
        <span className="text-xs font-semibold text-gray-500">
          {suggestions.length} action items
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {suggestions.map((suggestion) => (
          <div
            key={suggestion.id}
            className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow group"
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${impactConfig(
                  suggestion.impact
                )}`}
              >
                {suggestion.impact} impact
              </span>
              <span className="flex items-center gap-1 text-[11px] font-bold text-[#4F46E5]">
                <ArrowUpRight className="w-3.5 h-3.5" />
                +{suggestion.scoreGain} score
              </span>
            </div>

            <h4 className="text-xs font-bold text-gray-900 mb-1">{suggestion.title}</h4>
            <p className="text-xs text-gray-500 leading-relaxed">{suggestion.description}</p>

            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-[11px] text-gray-400">Estimated impact</span>
              <span className="flex items-center gap-1 text-[11px] font-medium text-gray-500">
                <Clock className="w-3 h-3" />
                {suggestion.impact === "High" ? "Within 1–2 weeks" : "Within 2–4 weeks"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}