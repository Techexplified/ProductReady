import { Gauge } from "lucide-react";
import type { ConfidenceLevel } from "../../services/productAnalysis/types";
import { AnalysisCard } from "./AnalysisCard";

interface RealityScoreCardProps {
  score: number;
  confidence: ConfidenceLevel;
  starRating: number;
}

function scoreColor(score: number) {
  if (score >= 85) return { stroke: "#10B981", text: "#059669" };
  if (score >= 70) return { stroke: "#4F46E5", text: "#4338CA" };
  if (score >= 55) return { stroke: "#F59E0B", text: "#D97706" };
  return { stroke: "#EF4444", text: "#DC2626" };
}

function confidenceColor(confidence: ConfidenceLevel) {
  switch (confidence) {
    case "High":
      return "bg-emerald-50 text-emerald-600";
    case "Medium":
      return "bg-amber-50 text-amber-600";
    case "Low":
      return "bg-red-50 text-red-600";
  }
}

export function RealityScoreCard({ score, confidence, starRating }: RealityScoreCardProps) {
  const color = scoreColor(score);
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const fullStars = Math.floor(starRating);
  const hasHalf = starRating - fullStars >= 0.5;

  return (
    <AnalysisCard title="Reality Score" subtitle="ProductReady AI composite rating" icon={<Gauge className="w-4 h-4" />}>
      <div className="flex flex-col items-center py-2">
        {/* Circular progress gauge */}
        <div className="relative w-32 h-32">
          <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke="#E5E7EB"
              strokeWidth="10"
            />
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke={color.stroke}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-extrabold text-gray-900">{score}</span>
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">/100</span>
          </div>
        </div>

        {/* Confidence label */}
        <span className={`mt-3 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${confidenceColor(confidence)}`}>
          {confidence} confidence
        </span>

        {/* Star rating */}
        <div className="mt-2 flex items-center gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <svg
              key={i}
              className={`w-4 h-4 ${
                i < fullStars
                  ? "text-amber-400 fill-current"
                  : i === fullStars && hasHalf
                    ? "text-amber-400 fill-current opacity-70"
                    : "text-gray-300 fill-current"
              }`}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.363-1.118l-2.8-2.034c-.784-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
          <span className="ml-1.5 text-xs font-bold text-gray-500">{starRating.toFixed(1)}</span>
        </div>

        <p className="mt-2 text-[11px] text-gray-400 text-center max-w-[180px]">
          Based on aggregated customer signals and AI verification
        </p>
      </div>
    </AnalysisCard>
  );
}