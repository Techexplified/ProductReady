import type { ReactNode } from "react";

interface AnalysisCardProps {
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function AnalysisCard({
  title,
  subtitle,
  icon,
  action,
  children,
  className = "",
}: AnalysisCardProps) {
  return (
    <div
      className={`bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow ${className}`}
    >
      {(title || action) && (
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            {icon && (
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-[#4F46E5] shrink-0">
                {icon}
              </div>
            )}
            <div>
              {title && <h3 className="text-sm font-bold text-gray-900">{title}</h3>}
              {subtitle && <p className="text-[11px] text-gray-400 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}