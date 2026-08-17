import { Database, CheckCircle2, RefreshCw, XCircle } from "lucide-react";
import type { DataSourceItem } from "../../services/productAnalysis/types";

interface DataSourcesTabProps {
  sources: DataSourceItem[];
}

function statusConfig(status: DataSourceItem["status"]) {
  switch (status) {
    case "Connected":
      return {
        badge: "bg-emerald-50 text-emerald-600",
        icon: <CheckCircle2 className="w-4 h-4" />,
      };
    case "Syncing":
      return {
        badge: "bg-amber-50 text-amber-600",
        icon: <RefreshCw className="w-4 h-4 animate-spin" />,
      };
    case "Disconnected":
      return {
        badge: "bg-red-50 text-red-500",
        icon: <XCircle className="w-4 h-4" />,
      };
  }
}

export function DataSourcesTab({ sources }: DataSourcesTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-[#4F46E5]">
            <Database className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-gray-900">Data Sources</h3>
        </div>
        <span className="text-xs font-semibold text-gray-500">{sources.length} connected sources</span>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-gray-100 text-gray-400 font-medium">
              <th className="px-5 py-3 font-semibold">Source</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 font-semibold">Records</th>
              <th className="px-5 py-3 font-semibold">Last Synced</th>
              <th className="px-5 py-3 font-semibold">Coverage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {sources.map((source) => {
              const config = statusConfig(source.status);
              return (
                <tr key={source.id} className="hover:bg-gray-50/70 transition-colors">
                  <td className="px-5 py-3 font-semibold text-gray-900 flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-[#4F46E5] shrink-0">
                      <Database className="w-3.5 h-3.5" />
                    </div>
                    {source.name}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold w-fit ${config.badge}`}>
                      {config.icon}
                      {source.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-medium text-gray-600">
                    {source.records.toLocaleString()}
                  </td>
                  <td className="px-5 py-3 text-gray-500">{source.lastSynced}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#4F46E5]"
                          style={{ width: `${source.coverage}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-semibold text-gray-600">
                        {source.coverage}%
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}