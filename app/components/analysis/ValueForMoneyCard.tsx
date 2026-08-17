import { Wallet } from "lucide-react";
import type { ValueForMoney } from "../../services/productAnalysis/types";
import { AnalysisCard } from "./AnalysisCard";

interface ValueForMoneyCardProps {
  data: ValueForMoney;
}

function scoreColor(value: number) {
  if (value >= 8) return "bg-emerald-500";
  if (value >= 6) return "bg-blue-500";
  if (value >= 4) return "bg-amber-500";
  return "bg-red-500";
}

export function ValueForMoneyCard({ data }: ValueForMoneyCardProps) {
  const rows = [
    { label: "Overall", value: data.overall },
    { label: "Quality", value: data.quality },
    { label: "Accuracy", value: data.accuracy },
    { label: "Shipping", value: data.shipping },
  ];

  return (
    <AnalysisCard
      title="Value for Money"
      subtitle="Category benchmark ratings (0–10)"
      icon={<Wallet className="w-4 h-4" />}
    >
      <div className="space-y-3.5">
        {rows.map((row) => (
          <div key={row.label}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-gray-600">{row.label}</span>
              <span className="text-xs font-bold text-gray-900">{row.value.toFixed(1)}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${scoreColor(row.value)}`}
                style={{ width: `${(row.value / 10) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </AnalysisCard>
  );
}