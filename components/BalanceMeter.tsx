"use client";

import { motion } from "framer-motion";

interface BalanceMeterProps {
  snacks: number;
  drinks: number;
  protein: number;
  veg: number;
}

export function BalanceMeter({ snacks, drinks, protein, veg }: BalanceMeterProps) {
  const categories = [
    { label: "🍿 Snacks", value: snacks, color: "bg-orange-500" },
    { label: "🥤 Dryck", value: drinks, color: "bg-blue-500" },
    { label: "💪 Protein", value: protein, color: "bg-purple-500" },
    { label: "🥗 Veg", value: veg, color: "bg-green-500" },
  ];

  return (
    <div className="bg-white rounded-xl shadow-md p-4">
      <h3 className="font-bold text-lg mb-4 text-gray-900">Balans</h3>
      <div className="space-y-3">
        {categories.map((cat, i) => (
          <div key={i}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">
                {cat.label}
              </span>
              <span className="text-sm font-semibold text-gray-900">
                {cat.value}%
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${cat.value}%` }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={`h-full ${cat.color}`}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

