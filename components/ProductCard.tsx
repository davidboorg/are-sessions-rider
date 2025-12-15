"use client";

import { Product } from "@/types";
import { Plus, Check } from "lucide-react";
import { motion } from "framer-motion";
import { Chip } from "./Chip";

interface ProductCardProps {
  product: Product;
  onAdd?: (product: Product) => void;
  isAdded?: boolean;
  matchReasons?: string[];
  score?: number;
}

export function ProductCard({
  product,
  onAdd,
  isAdded = false,
  matchReasons = [],
  score,
}: ProductCardProps) {
  const priceTierEmoji = ["💰", "💰💰", "💰💰💰"][product.priceTier - 1];
  const festivalFitStars = "⭐".repeat(product.festivalFit);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-4 border border-gray-100"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-bold text-lg text-gray-900">{product.name}</h3>
          <p className="text-sm text-gray-600">{product.brand}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs">{priceTierEmoji}</span>
            <span className="text-xs">{festivalFitStars}</span>
          </div>
        </div>
        <button
          onClick={() => onAdd?.(product)}
          disabled={isAdded}
          className={`
            rounded-full p-2 transition-all
            ${
              isAdded
                ? "bg-green-500 text-white"
                : "bg-festival-primary hover:bg-festival-primary/90 text-white hover:scale-110"
            }
          `}
        >
          {isAdded ? <Check size={20} /> : <Plus size={20} />}
        </button>
      </div>

      <div className="mb-2">
        <Chip label={product.category} variant="secondary" size="sm" />
      </div>

      {product.description && (
        <p className="text-sm text-gray-600 mb-2">{product.description}</p>
      )}

      {product.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {product.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="text-xs bg-gray-50 text-gray-600 px-2 py-0.5 rounded"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {product.allergens.length > 0 && (
        <div className="text-xs text-orange-600 mb-2">
          ⚠️ Innehåller: {product.allergens.join(", ")}
        </div>
      )}

      {matchReasons.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs font-semibold text-festival-secondary mb-1">
            Varför detta passar dig:
          </p>
          {matchReasons.map((reason, i) => (
            <p key={i} className="text-xs text-gray-600">
              • {reason}
            </p>
          ))}
        </div>
      )}

      {score !== undefined && (
        <div className="mt-2">
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-festival-accent transition-all duration-500"
              style={{ width: `${Math.min(100, score)}%` }}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
}

