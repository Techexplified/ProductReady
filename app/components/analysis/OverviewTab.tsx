import { useState } from "react";
import type { ProductAnalysis } from "../../services/productAnalysis/types";
import {
  AlertTriangle,
  AlertCircle,
  FileText,
  HelpCircle,
  Sparkles,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  ArrowRight,
  ImageIcon,
  BookOpen,
  Truck,
  RotateCcw,
} from "lucide-react";

interface OverviewTabProps {
  data: ProductAnalysis;
}

/* ── Issue definition for dynamic rendering ── */
interface IssueCard {
  icon: React.ReactNode;
  title: string;
  description: string;
  impact: "High" | "Medium" | "Low";
  bgColor: string;
  borderColor: string;
}

interface RecommendationCard {
  icon: React.ReactNode;
  title: string;
  description: string;
  difficulty: "Easy fix" | "Moderate" | "Advanced";
  time: string;
}

function getIssueIcon(type?: string, impact?: string) {
  if (type === "truck" || type === "delivery") return <Truck className="w-4 h-4 text-red-500 shrink-0" />;
  if (type === "returns") return <RotateCcw className="w-4 h-4 text-red-500 shrink-0" />;
  if (type === "image") return <ImageIcon className="w-4 h-4 text-amber-500 shrink-0" />;
  if (type === "specs") return <FileText className="w-4 h-4 text-amber-500 shrink-0" />;
  if (type === "faq") return <HelpCircle className="w-4 h-4 text-gray-400 shrink-0" />;
  return impact === "High" ? <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" /> : <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />;
}

export function OverviewTab({ data }: OverviewTabProps) {
  const isHighTrust = data.realityScore >= 80;
  const sb = data.scoreBreakdown || [];

  const categoryScores = [
    { label: "Content", score: sb[0]?.value ?? 85 },
    { label: "Shipping & Returns", score: sb[3]?.value ?? 62 },
    { label: "Specifications", score: sb[1]?.value ?? 71 },
    { label: "Media", score: sb[2]?.value ?? 88 },
    { label: "Trust Elements", score: Math.round(((sb[0]?.value ?? 85) + (sb[2]?.value ?? 88)) / 2) || 79 },
  ];

  /* Build issues dynamically from Groq AI data */
  const issues: IssueCard[] = data.whatsMissing && data.whatsMissing.length > 0
    ? data.whatsMissing.map((item) => ({
        icon: getIssueIcon(item.iconType, item.impact),
        title: item.title,
        description: item.description,
        impact: item.impact,
        bgColor: item.impact === "High" 
          ? "bg-[#FEF2F2]/60" 
          : item.impact === "Medium"
          ? "bg-[#FFFBEB]/60"
          : "bg-[#F8FAFC]",
        borderColor: item.impact === "High" 
          ? "border-[#FEE2E2]" 
          : item.impact === "Medium"
          ? "border-[#FEF3C7]"
          : "border-[#E2E8F0]",
      }))
    : [];

  /* Build recommendations dynamically from Groq AI data */
  const recommendations: RecommendationCard[] = data.recommendations && data.recommendations.length > 0
    ? data.recommendations.map((item) => ({
        icon: <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />,
        title: item.title,
        description: item.description,
        difficulty: item.difficulty,
        time: item.time,
      }))
    : [];

  const impactBadge = (impact: "High" | "Medium" | "Low") => {
    const styles = {
      High: "bg-[#FEE2E2] text-red-700 border border-[#FCA5A5]/60",
      Medium: "bg-[#FEF3C7] text-amber-800 border border-[#FDE68A]/60",
      Low: "bg-gray-100 text-gray-600 border border-gray-200/60",
    };
    return styles[impact];
  };

  const diffBadge = (diff: "Easy fix" | "Moderate" | "Advanced") => {
    if (diff === "Easy fix") return { bg: "bg-[#DCFCE7] text-emerald-800 border border-[#A7F3D0]", icon: "⚡" };
    if (diff === "Moderate") return { bg: "bg-[#FEF3C7] text-amber-800 border border-[#FDE68A]", icon: "📄" };
    return { bg: "bg-[#FEE2E2] text-red-700 border border-[#FCA5A5]", icon: "🔧" };
  };

  const maxPossibleGain = Math.max(1, 100 - data.realityScore);
  const potentialGain = Math.min(data.potentialImpact ?? (isHighTrust ? 4 : 12), maxPossibleGain);

  const scrollToRecommendation = (idx: number) => {
    const element = document.getElementById(`rec-card-${idx}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      element.classList.add("ring-2", "ring-[#4F46E5]");
      setTimeout(() => element.classList.remove("ring-2", "ring-[#4F46E5]"), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Category Scores Summary (Static, non-clickable) */}
      <div className="bg-white rounded-2xl border border-gray-200/60 p-3.5 shadow-2xs">
        <div className="flex items-center justify-between gap-3 overflow-x-auto">
          {categoryScores.map((cat, i) => {
            const scoreColor =
              cat.score >= 80
                ? "text-emerald-600"
                : cat.score >= 60
                ? "text-amber-600"
                : "text-red-500";
            return (
              <div
                key={i}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gray-50/60 border border-gray-100 shrink-0"
              >
                <span className="text-xs font-semibold text-gray-700">{cat.label}</span>
                <span className={`text-xs font-bold ${scoreColor}`}>
                  {cat.score}<span className="text-gray-400 font-normal text-[10px]">/100</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══ 2 Columns: Left = What's Missing, Right = Recommendations ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Column: What's Missing */}
        <div className="space-y-4">
          {/* Section Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center border border-red-100">
                <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
              </div>
              <h2 className="text-sm font-bold text-gray-900 tracking-tight">What's Missing</h2>
            </div>
            <span className="bg-red-50 text-red-600 font-bold text-[11px] px-3 py-1 rounded-full border border-red-100">
              {issues.length} {issues.length === 1 ? "issue" : "issues"}
            </span>
          </div>

          {/* Issue Cards */}
          <div className="space-y-3">
            {issues.map((issue, idx) => (
              <div
                key={idx}
                className={`${issue.bgColor} border ${issue.borderColor} rounded-2xl p-4 space-y-2 shadow-2xs transition-all duration-200`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {issue.icon}
                    <h3 className="font-bold text-gray-900 text-xs truncate">{issue.title}</h3>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 ${impactBadge(issue.impact)}`}>
                    {issue.impact} impact
                  </span>
                </div>
                <p className="text-[11px] text-gray-600 leading-relaxed font-normal">{issue.description}</p>
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => scrollToRecommendation(idx)}
                    className="px-3 py-1 bg-white border border-gray-200 text-[#4F46E5] hover:text-[#4338CA] hover:border-indigo-200 rounded-lg text-[11px] font-semibold inline-flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                  >
                    <span>See how to fix</span>
                    <ArrowRight className="w-3 h-3 ml-0.5" />
                  </button>
                </div>
              </div>
            ))}

            {issues.length === 0 && (
              <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-6 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-xs font-bold text-emerald-800">All clear!</p>
                <p className="text-[11px] text-emerald-600 mt-0.5">No critical issues detected for this product.</p>
              </div>
            )}
          </div>

          {/* Potential Impact Card */}
          <div
            className="rounded-2xl p-5 flex items-center justify-between border border-emerald-100 shadow-2xs overflow-hidden relative"
            style={{ background: "linear-gradient(135deg, #ECFDF5 0%, #F0FDF4 50%, #F0FDFA 100%)" }}
          >
            <div className="relative z-10">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <h4 className="font-bold text-gray-900 text-xs">Potential Impact</h4>
              </div>
              <p className="text-[11px] text-gray-500 mt-1">Fixing these issues can increase conversion by</p>
              <span className="text-3xl font-extrabold text-emerald-500 mt-2 block leading-none">
                +{potentialGain}%
              </span>
            </div>
            {/* Mini bar chart */}
            <div className="flex items-end gap-1.5 h-12 relative z-10">
              {[28, 45, 62, 78, 100].map((h, i) => (
                <div
                  key={i}
                  className="w-3 rounded-t-md"
                  style={{
                    height: `${h * 0.48}px`,
                    background: `linear-gradient(180deg, ${i < 2 ? "#A5B4FC" : i < 4 ? "#818CF8" : "#4F46E5"}, ${i < 2 ? "#C7D2FE" : i < 4 ? "#A5B4FC" : "#6366F1"})`,
                    opacity: 0.7 + i * 0.06,
                  }}
                />
              ))}
            </div>
            {/* Subtle bg decoration */}
            <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-emerald-200/20 blur-xl" />
          </div>
        </div>

        {/* Right Column: Recommendations */}
        <div className="space-y-4">
          {/* Section Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-[#4F46E5]" />
              </div>
              <h2 className="text-sm font-bold text-gray-900 tracking-tight">Recommendations</h2>
            </div>
            <span className="bg-indigo-50 text-[#4F46E5] font-bold text-[11px] px-3 py-1 rounded-full border border-indigo-100">
              {recommendations.length} {recommendations.length === 1 ? "fix" : "fixes"}
            </span>
          </div>

          {/* Recommendation Cards */}
          <div className="space-y-3">
            {recommendations.map((rec, idx) => {
              const badge = diffBadge(rec.difficulty);
              return (
                <div
                  key={idx}
                  id={`rec-card-${idx}`}
                  className="bg-[#F0FDF4]/90 border border-[#BBF7D0] rounded-2xl p-4 space-y-2 shadow-2xs hover:shadow-xs transition-all duration-200"
                >
                  <div className="flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-[#DCFCE7] flex items-center justify-center shrink-0 mt-0.5 border border-[#A7F3D0]">
                      {rec.icon}
                    </div>
                    <div className="min-w-0 space-y-1">
                      <h3 className="font-bold text-gray-900 text-xs leading-snug">{rec.title}</h3>
                      <p className="text-[11px] text-gray-600 font-normal leading-relaxed">{rec.description}</p>
                      <div className="flex items-center gap-2 pt-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${badge.bg}`}>
                          {badge.icon} {rec.difficulty}
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3 text-gray-400" /> {rec.time}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {recommendations.length === 0 && (
              <div className="bg-indigo-50/40 border border-indigo-100 rounded-2xl p-6 text-center">
                <Sparkles className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
                <p className="text-xs font-bold text-indigo-800">Looking great!</p>
                <p className="text-[11px] text-indigo-600 mt-0.5">No additional recommendations at this time.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}