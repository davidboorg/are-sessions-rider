"use client";

import { CelebrityRider } from "@/types";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

interface CelebrityCardProps {
  celebrity: CelebrityRider;
  onClick?: () => void;
  matchScore?: number;
}

export function CelebrityCard({
  celebrity,
  onClick,
  matchScore,
}: CelebrityCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-gradient-to-br from-festival-primary/10 to-festival-secondary/10 rounded-xl p-6 border-2 border-festival-primary/20 cursor-pointer hover:border-festival-primary/50 transition-colors"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-festival-primary to-festival-secondary flex items-center justify-center text-3xl">
          <Sparkles className="text-white" size={32} />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-xl text-gray-900">{celebrity.name}</h3>
          <p className="text-sm text-gray-600">{celebrity.handle}</p>
          <p className="text-sm text-festival-primary font-medium">
            {celebrity.vibe}
          </p>
        </div>
      </div>

      <p className="text-sm text-gray-700 mb-4">{celebrity.description}</p>

      <div className="flex flex-wrap gap-1 mb-3">
        {celebrity.parsedRider.vibeTags.slice(0, 4).map((tag, i) => (
          <span
            key={i}
            className="text-xs bg-white/60 text-gray-700 px-2 py-1 rounded-full"
          >
            {tag}
          </span>
        ))}
      </div>

      {matchScore !== undefined && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">
              Matchning
            </span>
            <span className="text-2xl font-bold text-festival-primary">
              {matchScore}%
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${matchScore}%` }}
              transition={{ duration: 0.8 }}
              className="h-full bg-gradient-to-r from-festival-primary to-festival-accent"
            />
          </div>
        </div>
      )}

      <p className="text-xs text-gray-500 mt-3 italic">{celebrity.disclaimer}</p>
    </motion.div>
  );
}

