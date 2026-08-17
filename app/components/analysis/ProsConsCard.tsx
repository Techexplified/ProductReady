import { ThumbsUp, ThumbsDown } from "lucide-react";
import { AnalysisCard } from "./AnalysisCard";

interface ProsCardProps {
  pros: string[];
}

export function ProsCard({ pros }: ProsCardProps) {
  return (
    <AnalysisCard
      title="Top Pros"
      subtitle="Highlighted from customer feedback"
      icon={
        <div className="w-6 h-6 rounded-md bg-emerald-50 flex items-center justify-center">
          <ThumbsUp className="w-3.5 h-3.5 text-emerald-600" />
        </div>
      }
    >
      <div className="space-y-2.5">
        {pros.map((pro) => (
          <div key={pro} className="flex items-start gap-2">
            <svg
              className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-xs text-gray-600 leading-relaxed">{pro}</span>
          </div>
        ))}
      </div>
    </AnalysisCard>
  );
}

interface ConsCardProps {
  cons: string[];
}

export function ConsCard({ cons }: ConsCardProps) {
  return (
    <AnalysisCard
      title="Top Cons"
      subtitle="Highlighted from customer feedback"
      icon={
        <div className="w-6 h-6 rounded-md bg-red-50 flex items-center justify-center">
          <ThumbsDown className="w-3.5 h-3.5 text-red-500" />
        </div>
      }
    >
      <div className="space-y-2.5">
        {cons.map((con) => (
          <div key={con} className="flex items-start gap-2">
            <svg
              className="w-4 h-4 text-red-400 shrink-0 mt-0.5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-xs text-gray-600 leading-relaxed">{con}</span>
          </div>
        ))}
      </div>
    </AnalysisCard>
  );
}