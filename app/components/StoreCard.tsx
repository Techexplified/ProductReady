import { ChevronDown } from "lucide-react";

interface StoreCardProps {
  storeName?: string;
  storeUrl?: string;
  avatarInitials?: string;
}

export function StoreCard({
  storeName = "My Awesome Store",
  storeUrl = "myawesomestore.myshopify.com",
  avatarInitials = "MA",
}: StoreCardProps) {
  return (
    <div className="flex items-center gap-3 p-2.5 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-100/60 cursor-pointer transition-colors">
      <div className="w-9 h-9 rounded-full bg-[#4F46E5] text-white font-semibold text-xs flex items-center justify-center shrink-0 shadow-sm">
        {avatarInitials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <p className="text-xs font-semibold text-gray-900 truncate">
            {storeName}
          </p>
          <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
        </div>
        <p className="text-[11px] text-gray-400 truncate">{storeUrl}</p>
      </div>
    </div>
  );
}
