import { AlertTriangle } from "lucide-react";
import type { IssueItem } from "../../services/productAnalysis/types";
import { AnalysisCard } from "./AnalysisCard";

interface CommonIssuesCardProps {
  issues: IssueItem[];
}

export function CommonIssuesCard({ issues }: CommonIssuesCardProps) {
  return (
    <AnalysisCard
      title="Common Issues"
      subtitle="Detected in customer feedback"
      icon={<AlertTriangle className="w-4 h-4" />}
      action={
        <button className="text-[11px] font-semibold text-[#4F46E5] hover:text-[#4338CA] hover:underline cursor-pointer">
          View All
        </button>
      }
    >
      <div className="space-y-3.5">
        {issues.map((issue) => (
          <div key={issue.title}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-gray-700">{issue.title}</span>
              <span className="text-xs font-bold text-gray-900">{issue.percentage}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  issue.percentage >= 30
                    ? "bg-red-500"
                    : issue.percentage >= 20
                      ? "bg-amber-500"
                      : "bg-amber-400"
                }`}
                style={{ width: `${Math.min(issue.percentage, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </AnalysisCard>
  );
}