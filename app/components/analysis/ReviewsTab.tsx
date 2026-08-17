import { BadgeCheck, MessageSquare, ThumbsUp } from "lucide-react";
import type { ReviewItem } from "../../services/productAnalysis/types";

interface ReviewsTabProps {
  reviews: ReviewItem[];
}

function sentimentColor(sentiment: ReviewItem["sentiment"]) {
  switch (sentiment) {
    case "Positive":
      return "bg-emerald-50 text-emerald-600";
    case "Neutral":
      return "bg-gray-100 text-gray-500";
    case "Negative":
      return "bg-red-50 text-red-500";
  }
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={`w-3 h-3 ${
            i < rating ? "text-amber-400 fill-current" : "text-gray-300 fill-current"
          }`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.363-1.118l-2.8-2.034c-.784-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export function ReviewsTab({ reviews }: ReviewsTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-[#4F46E5]">
            <MessageSquare className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-gray-900">Customer Reviews</h3>
        </div>
        <span className="text-xs font-semibold text-gray-500">
          {reviews.length} sample reviews analyzed
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center text-[#4F46E5] font-bold text-xs">
                  {review.author.charAt(0)}
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900">{review.author}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <StarRating rating={review.rating} />
                    <span className="text-[10px] text-gray-400">{review.date}</span>
                  </div>
                </div>
              </div>
              {review.verified && (
                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-semibold">
                  <BadgeCheck className="w-3 h-3" /> Verified
                </span>
              )}
            </div>

            <div className="mb-2">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${sentimentColor(review.sentiment)}`}>
                {review.sentiment}
              </span>
            </div>

            <h4 className="text-xs font-bold text-gray-900 mb-1">{review.title}</h4>
            <p className="text-xs text-gray-500 leading-relaxed">{review.body}</p>

            <div className="mt-3 flex items-center gap-1.5 text-[11px] text-gray-400">
              <ThumbsUp className="w-3 h-3" />
              <span>{review.helpfulCount} people found this helpful</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}