import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react";

export interface ProductItem {
  id: string;
  name: string;
  category: string;
  price: string;
  sku: string;
  score: number;
  status: "Active" | "Draft" | "Pending" | "Completed" | "In Progress" | "Analyzed";
  views: number;
  ctr: string;
  issuesCount: number;
  lastAnalyzed: string;
  confidence?: "High" | "Medium" | "Low" | "—";
  iconType?: "speaker" | "jacket" | "mat" | "watch" | "bottle" | "earbuds" | "backpack" | "tent" | "default";
  imageUrl?: string | null;
  whatsMissingData?: string | null;
}

const INITIAL_PRODUCTS: ProductItem[] = [
  {
    id: "PROD-101",
    name: "Bluetooth Speaker",
    category: "Electronics",
    price: "$89.99",
    sku: "BT-SPK-001",
    score: 91,
    status: "Analyzed",
    views: 4231,
    ctr: "36.1%",
    issuesCount: 0,
    lastAnalyzed: "2h ago",
    confidence: "High",
    iconType: "speaker",
  },
  {
    id: "PROD-102",
    name: "Winter Jacket",
    category: "Apparel",
    price: "$120.00",
    sku: "WIN-JKT-042",
    score: 72,
    status: "Analyzed",
    views: 2997,
    ctr: "28.4%",
    issuesCount: 2,
    lastAnalyzed: "5h ago",
    confidence: "Medium",
    iconType: "jacket",
  },
  {
    id: "PROD-103",
    name: "Yoga Mat",
    category: "Fitness",
    price: "$35.00",
    sku: "YGA-MAT-018",
    score: 84,
    status: "Analyzed",
    views: 1842,
    ctr: "25.2%",
    issuesCount: 0,
    lastAnalyzed: "1d ago",
    confidence: "Low",
    iconType: "mat",
  },
  {
    id: "PROD-104",
    name: "Smart Watch",
    category: "Wearables",
    price: "$149.50",
    sku: "SMT-WCH-007",
    score: 90,
    status: "Analyzed",
    views: 3542,
    ctr: "29.8%",
    issuesCount: 1,
    lastAnalyzed: "1d ago",
    confidence: "High",
    iconType: "watch",
  },
  {
    id: "PROD-105",
    name: "Water Bottle",
    category: "Accessories",
    price: "$24.99",
    sku: "WAT-BTL-033",
    score: 78,
    status: "Analyzed",
    views: 1250,
    ctr: "22.4%",
    issuesCount: 1,
    lastAnalyzed: "2d ago",
    confidence: "Medium",
    iconType: "bottle",
  },
  {
    id: "PROD-106",
    name: "Wireless Earbuds",
    category: "Electronics",
    price: "$65.00",
    sku: "WRL-ERB-055",
    score: 88,
    status: "Analyzed",
    views: 2102,
    ctr: "32.6%",
    issuesCount: 1,
    lastAnalyzed: "2d ago",
    confidence: "High",
    iconType: "earbuds",
  },
  {
    id: "PROD-107",
    name: "Backpack",
    category: "Accessories",
    price: "$49.99",
    sku: "BCK-PCK-011",
    score: 0,
    status: "Pending",
    views: 0,
    ctr: "0.0%",
    issuesCount: 0,
    lastAnalyzed: "—",
    confidence: "—",
    iconType: "backpack",
  },
  {
    id: "PROD-108",
    name: "Camping Tent",
    category: "Outdoor",
    price: "$199.99",
    sku: "CMP-TNT-029",
    score: 0,
    status: "Pending",
    views: 0,
    ctr: "0.0%",
    issuesCount: 0,
    lastAnalyzed: "—",
    confidence: "—",
    iconType: "tent",
  },
];

interface ProductContextType {
  products: ProductItem[];
  addProduct: (newProd: {
    name: string;
    category: string;
    price: string;
    sku: string;
    score: number;
    status: "Active" | "Draft" | "Pending";
  }) => void;
  deleteProduct: (id: string) => void;
  runAnalysis: (id: string) => void;
  runBulkAnalysis: (ids: string[]) => void;
  avgScore: number;
  distribution: {
    excellent: number;
    good: number;
    average: number;
    poor: number;
  };
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

interface ProductProviderProps {
  children: ReactNode;
  initialProducts?: ProductItem[];
}

export function ProductProvider({ children, initialProducts }: ProductProviderProps) {
  const [products, setProducts] = useState<ProductItem[]>(initialProducts || INITIAL_PRODUCTS);

  // Sync state if initialProducts from database changes
  useEffect(() => {
    if (initialProducts && initialProducts.length > 0) {
      setProducts(initialProducts);
    }
  }, [initialProducts]);

  const addProduct = (newProd: {
    name: string;
    category: string;
    price: string;
    sku: string;
    score: number;
    status: "Active" | "Draft" | "Pending";
  }) => {
    const created: ProductItem = {
      ...newProd,
      id: `PROD-${Math.floor(100 + Math.random() * 900)}`,
      views: 0,
      ctr: "0.0%",
      issuesCount: 0,
      lastAnalyzed: "Just now",
      confidence: "High",
    };
    setProducts((prev) => [created, ...prev]);
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const runAnalysis = (id: string) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              score: p.score === 0 ? 86 : Math.min(100, p.score + 2),
              lastAnalyzed: "Just now",
              status: "Analyzed",
              confidence: p.confidence === "—" ? "High" : p.confidence,
            }
          : p
      )
    );
  };

  const runBulkAnalysis = (ids: string[]) => {
    setProducts((prev) =>
      prev.map((p) =>
        ids.includes(p.id)
          ? {
              ...p,
              score: p.score === 0 ? 82 : Math.min(99, p.score + Math.floor(Math.random() * 5) + 1),
              lastAnalyzed: "Just now",
              status: "Analyzed",
              confidence: p.confidence === "—" ? "High" : p.confidence,
            }
          : p
      )
    );
  };

  const avgScore = useMemo(() => {
    if (products.length === 0) return 0;
    const total = products.reduce((acc, p) => acc + p.score, 0);
    return Math.round(total / products.length);
  }, [products]);

  const distribution = useMemo(() => {
    const total = products.length || 1;
    let excellent = 0;
    let good = 0;
    let average = 0;
    let poor = 0;

    products.forEach((p) => {
      if (p.score >= 90) excellent++;
      else if (p.score >= 70) good++;
      else if (p.score >= 50) average++;
      else poor++;
    });

    return {
      excellent: Math.round((excellent / total) * 100),
      good: Math.round((good / total) * 100),
      average: Math.round((average / total) * 100),
      poor: Math.round((poor / total) * 100),
    };
  }, [products]);

  return (
    <ProductContext.Provider
      value={{
        products,
        addProduct,
        deleteProduct,
        runAnalysis,
        runBulkAnalysis,
        avgScore,
        distribution,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
}

export function useProducts() {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error("useProducts must be used within a ProductProvider");
  }
  return context;
}
