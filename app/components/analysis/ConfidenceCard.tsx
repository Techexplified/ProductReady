import { ScanSearch, Image, Eye, BrainCircuit } from "lucide-react";
import type { ConfidenceDetails } from "../../services/productAnalysis/types";
import { AnalysisCard } from "./AnalysisCard";

interface ConfidenceCardProps {
  details: ConfidenceDetails;
}

function verificationBadge(value: string) {
  if (value === "Passed" || value === "Verified") {
    return "bg-emerald-50 text-emerald-600";
  }
  if (value === "Needs Review" || value === "Pending") {
    return "bg-amber-50 text-amber-600";
  }
  return "bg-red-50 text-red-600";
}

export function ConfidenceCard({ details }: ConfidenceCardProps) {
  const rows = [
    {
      label: "Reviews analyzed",
      value: details.reviewsAnalyzed.toLocaleString(),
      icon: <ScanSearch className="w-4 h-4" />,
    },
    {
      label: "Customer images",
      value: details.customerImages.toLocaleString(),
      icon: <Image className="w-4 h-4" />,
    },
  ];

  return (
    <AnalysisCard title="Analysis Confidence" subtitle="Data coverage & verification">
      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500">
                {row.icon}
              </div>
              <span className="text-xs text-gray-600">{row.label}</span>
            </div>
            <span className="text-sm font-bold text-gray-900">{row.value}</span>
          </div>
        ))}

        <div className="pt-3 border-t border-gray-100 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-[#4F46E5]">
                <Eye className="w-4 h-4" />
              </div>
              <span className="text-xs text-gray-600">Visual verification</span>
            </div>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${verificationBadge(
                details.visualVerification
              )}`}
            >
              {details.visualVerification}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-[#4F46E5]">
                <BrainCircuit className="w-4 h-4" />
              </div>
              <span className="text-xs text-gray-600">AI verification</span>
            </div>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${verificationBadge(
                details.aiVerification
              )}`}
            >
              {details.aiVerification}
            </span>
          </div>
        </div>
      </div>
    </AnalysisCard>
  );
}