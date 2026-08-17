// Static content pools used by the analysis builder to generate
// deterministic, realistic analysis data for each product.

export const SUMMARY_PART1 = [
  "Based on our AI audit, {name} shows a strong alignment between its product description and real customer expectations.",
  "Our deep-dive analysis reviewed {reviews} customer reviews and {images} customer-uploaded images for {name}.",
  "After cross-referencing listing claims with verified purchaser feedback, {name} delivers a largely consistent experience.",
  "The AI model evaluated {name} across description accuracy, image authenticity, review legitimacy, and delivery reliability.",
  "Customer signals for {name} point to a dependable everyday product with a few areas worth tightening up.",
];

export const SUMMARY_PART2 = [
  "Buyers consistently highlighted the build quality and ease of use, with most complaints centered on minor sizing and packaging details.",
  "The majority of reviewers praised its value at the listed price, while a smaller subset flagged variability between units.",
  "Image analysis confirmed the listing photos closely match the received product, reducing the risk of surprise on delivery.",
  "Sentiment is predominantly positive, with neutral commentary around shipping timelines rather than product performance.",
  "Review authenticity checks found few suspicious patterns, lending strong credibility to the overall rating.",
];

export const SUMMARY_PART3 = [
  "Areas such as {issue1} and {issue2} were the most frequently referenced concerns in customer feedback.",
  "The most common friction points were {issue1} and {issue2}, both of which are addressable without major product changes.",
  "Occasional reports about {issue1} suggest tightening quality-control at the source would meaningfully lift the score.",
  "Although minor, {issue1} and {issue2} appeared often enough to keep this product just below the excellent tier.",
];

export const SUMMARY_PART4 = [
  "Overall, the evidence supports a {verdict} recommendation for shoppers who match this product's intended use case.",
  "Taking everything into account, we rate this product's reality score at {score}/100 with {confidence} confidence.",
  "In short, what you see in the listing is very close to what arrives at the door, earning {name} a solid position in its category.",
  "The data supports listing this item as trustworthy, with clear guidance provided below for the types of buyers it suits best.",
];

export const ISSUE_POOL: { title: string; base: number }[] = [
  { title: "Missing size / measurement details", base: 18 },
  { title: "Low-resolution listing images", base: 14 },
  { title: "Suspicious review patterns detected", base: 12 },
  { title: "Shipping cost complaints", base: 16 },
  { title: "Inconsistent product description", base: 15 },
  { title: "Limited customer-submitted photos", base: 20 },
  { title: "Return rate above category average", base: 13 },
  { title: "Brand-match concerns raised", base: 10 },
];

export const PROS_POOL = [
  "Accurate product description matches delivered item",
  "High-resolution images reflect real product details",
  "Verified review ratio well above category baseline",
  "Consistent quality reported across recent batches",
  "Fast, reliable shipping with accurate tracking",
  "Customer images confirm color and finish accuracy",
  "Strong value at the current listed price",
  "Low rate of returns and repeat-purchase signals",
];

export const CONS_POOL = [
  "Size / measurement information is incomplete",
  "A few listing images appear compressed or cropped",
  "Shipping costs flagged as higher than expected",
  "Some reviews mention packaging arriving damaged",
  "Limited photo coverage from customer uploads",
  "Description omits material / care instructions",
  "Minor color discrepancy reported on one variant",
  "Customer support response time could improve",
];

export const BEST_FOR_POOL = [
  "everyday use and value-driven shoppers",
  "customers who prioritize durability and function",
  "buyers looking for a dependable mid-range option",
  "first-time buyers in this category",
  "shoppers who value accurate listings over flash",
];

export const NOT_IDEAL_POOL = [
  "professional / heavy-duty use cases",
  "customers needing very specific sizing guarantees",
  "shoppers who expect premium-grade finishing",
  "users who require extensive customization",
  "bulk purchasing without prior hands-on testing",
];

export const WORTH_BUYING_SUMMARY_POOL = [
  "The listing is honest, the product performs as described, and the verified feedback strongly supports the purchase.",
  "Customers get what they pay for with minimal surprises, and the review data backs a confident buying decision.",
  "While not flawless, the product's strengths clearly outweigh its minor shortcomings for its target audience.",
];

export const REVIEW_TEMPLATES = [
  {
    title: "Exactly as described — very happy",
    body: "Received exactly what the listing promised. Packaging was solid and the product feels well made. Would recommend to anyone on the fence.",
    sentiment: "Positive" as const,
  },
  {
    title: "Good value for the price",
    body: "For the price point, this is hard to beat. It does what it says and the quality is consistent with the photos shown in the listing.",
    sentiment: "Positive" as const,
  },
  {
    title: "Solid product, minor nitpicks",
    body: "Overall a great purchase. Deducting one star because the listing could include more detail about sizing and the included accessories.",
    sentiment: "Neutral" as const,
  },
  {
    title: "Matches the photos perfectly",
    body: "I compared the listing images side-by-side with what arrived and they match closely. Color and finish are accurate to what you see.",
    sentiment: "Positive" as const,
  },
  {
    title: "Shipping took longer than expected",
    body: "The product itself is fine, but delivery ran a few days past the estimate. Plan ahead if you need it by a specific date.",
    sentiment: "Neutral" as const,
  },
  {
    title: "Quality is better than I expected",
    body: "Honestly surprised by the build quality at this price. Feels more premium than the price suggests. Happy with the purchase.",
    sentiment: "Positive" as const,
  },
  {
    title: "Missing a few details in the listing",
    body: "Wish the listing had clearer measurements and care instructions. Had to contact support for clarification, but they were helpful.",
    sentiment: "Neutral" as const,
  },
  {
    title: "Underwhelmed by one aspect",
    body: "The core product is good, but a specific feature mentioned in the description didn't quite live up to expectations. Still decent overall.",
    sentiment: "Negative" as const,
  },
  {
    title: "Would buy again without hesitation",
    body: "Great experience from order to delivery. The verified photos from other buyers helped me pull the trigger and it paid off.",
    sentiment: "Positive" as const,
  },
  {
    title: "Fine, but do your research first",
    body: "It's an okay product, but the listing oversells one feature. Read the negative reviews first so you know what you're getting into.",
    sentiment: "Negative" as const,
  },
];

export const AUTHOR_FIRST = [
  "Aarav", "Priya", "Rohan", "Sneha", "Vikram", "Ananya", "Rahul", "Meera",
  "Karan", "Ishita", "Arjun", "Divya", "Nikhil", "Kavya", "Rajat", "Pooja",
  "Aditya", "Sanya", "Manish", "Tara",
];

export const AUTHOR_LAST = [
  "Sharma", "Patel", "Singh", "Gupta", "Kumar", "Reddy", "Nair", "Joshi",
  "Mehta", "Iyer", "Chawla", "Bose",
];

export const IMAGE_LABELS = [
  "Customer photo — packaging",
  "Customer photo — in use",
  "Customer photo — close-up detail",
  "Customer photo — size comparison",
  "Customer photo — color accuracy",
  "Customer photo — unboxing",
  "Customer photo — on display",
  "Customer photo — detail close-up",
];

export const IMAGE_SOURCES = [
  "Instagram", "Product Reviews", "Store Gallery", "Customer Upload", "Shopify Reviews", "Social Mention",
];

export const IMAGE_ANGLES = [
  "Front view", "45° angle", "Top-down", "Side profile", "Macro detail", "Lifestyle",
];

export const SUGGESTION_POOL = [
  {
    title: "Add size / measurement guide",
    description: "List exact dimensions and a sizing chart in the description to reduce the most common customer complaint.",
    impact: "High" as const,
    scoreGain: 6,
  },
  {
    title: "Replace low-res listing images",
    description: "Upload 3–4 high-resolution shots (1200px+) showing the product from multiple angles and in real use.",
    impact: "Medium" as const,
    scoreGain: 4,
  },
  {
    title: "Encourage verified photo reviews",
    description: "Send a follow-up email after delivery inviting buyers to share photos in exchange for a small loyalty discount.",
    impact: "Medium" as const,
    scoreGain: 3,
  },
  {
    title: "Clarify shipping cost upfront",
    description: "Display shipping fees and estimated delivery windows earlier in the funnel to avoid negative sentiment.",
    impact: "Low" as const,
    scoreGain: 2,
  },
  {
    title: "Expand material & care info",
    description: "Include fabric/material breakdown, care instructions, and warranty details to answer pre-purchase questions.",
    impact: "High" as const,
    scoreGain: 5,
  },
];

export const DATA_SOURCES = [
  { id: "ds-shopify", name: "Shopify Catalog", records: 1240, coverage: 100 },
  { id: "ds-reviews", name: "Customer Reviews Engine", records: 483, coverage: 92 },
  { id: "ds-images", name: "Product Image Scanner", records: 214, coverage: 88 },
  { id: "ds-shipping", name: "Shipping & Delivery Data", records: 961, coverage: 84 },
  { id: "ds-ai", name: "ProductReady AI Model v2.4", records: 3500, coverage: 96 },
];

export const VERDICT_POOL = ["strong", "solid", "cautious", "positive"];