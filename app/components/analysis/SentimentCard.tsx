import { MessageSquareText } from "lucide-react";
import { AnalysisCard } from "./AnalysisCard";

interface SentimentCardProps {
  positive: number;
  neutral: number;
  negative: number;
}

export function SentimentCard({ positive, neutral, negative }: SentimentCardProps) {
  const rows = [
    { label: "Positive", value: positive, color: "bg-emerald-500" },
    { label: "Neutral", value: neutral, color: "bg-gray-400" },
    { label: "Negative", value: negative, color: "bg-red-500" },
  ];

  return (
    <AnalysisCard
      title="Customer Sentiment"
      subtitle="Based on analyzed reviews"
      icon={<MessageSquareText className="w-4 h-4" />}
    >
      <div className="space-y-3.5">
        {rows.map((row) => (
          <div key={row.label}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-gray-600">{row.label}</span>
              <span className="text-xs font-bold text-gray-900">{row.value}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${row.color}`}
                style={{ width: `${row.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </AnalysisCard>
  );
}