import { BadgeCheck, BadgeX, Target, UserX } from "lucide-react";
import type { WorthBuying } from "../../services/productAnalysis/types";
import { AnalysisCard } from "./AnalysisCard";

interface WorthBuyingCardProps {
  data: WorthBuying;
}

export function WorthBuyingCard({ data }: WorthBuyingCardProps) {
  const isYes = data.recommendation === "YES";

  return (
    <AnalysisCard title="Worth Buying?" subtitle="ProductReady final recommendation">
      <div className="flex items-center gap-4">
        <div
          className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${
            isYes ? "bg-emerald-50" : "bg-red-50"
          }`}
        >
          {isYes ? <BadgeCheck className="w-7 h-7 text-emerald-500" /> : <BadgeX className="w-7 h-7 text-red-500" />}
        </div>
        <div>
          <span
            className={`text-xl font-extrabold tracking-tight ${
              isYes ? "text-emerald-600" : "text-red-500"
            }`}
          >
            {data.recommendation}
          </span>
          <p className="text-[11px] text-gray-400 font-medium mt-0.5">
            {isYes ? "Recommended with high confidence" : "Not recommended in current state"}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <div className="flex items-start gap-2.5">
          <div className="w-6 h-6 rounded-md bg-emerald-50 flex items-center justify-center shrink-0 mt-0.5">
            <Target className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-gray-700 uppercase tracking-wide">Best for</p>
            <p className="text-xs text-gray-500 mt-0.5">{data.bestFor}</p>
          </div>
        </div>
        <div className="flex items-start gap-2.5">
          <div className="w-6 h-6 rounded-md bg-red-50 flex items-center justify-center shrink-0 mt-0.5">
            <UserX className="w-3.5 h-3.5 text-red-500" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-gray-700 uppercase tracking-wide">Not ideal for</p>
            <p className="text-xs text-gray-500 mt-0.5">{data.notIdealFor}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-600 leading-relaxed">{data.summary}</p>
      </div>
    </AnalysisCard>
  );
}