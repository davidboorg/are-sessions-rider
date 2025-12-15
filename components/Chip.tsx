"use client";

import { X } from "lucide-react";
import { motion } from "framer-motion";

interface ChipProps {
  label: string;
  variant?: "default" | "primary" | "secondary" | "success" | "warning";
  removable?: boolean;
  onRemove?: () => void;
  onClick?: () => void;
  selected?: boolean;
  size?: "sm" | "md" | "lg";
}

export function Chip({
  label,
  variant = "default",
  removable = false,
  onRemove,
  onClick,
  selected = false,
  size = "md",
}: ChipProps) {
  const variantClasses = {
    default: "bg-gray-100 text-gray-800 border-gray-300",
    primary: "bg-festival-primary text-white border-festival-primary",
    secondary: "bg-festival-secondary text-white border-festival-secondary",
    success: "bg-green-100 text-green-800 border-green-300",
    warning: "bg-yellow-100 text-yellow-800 border-yellow-300",
  };

  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-1.5",
    lg: "text-base px-4 py-2",
  };

  const selectedClass = selected
    ? "ring-2 ring-festival-accent ring-offset-1"
    : "";

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      className={`
        inline-flex items-center gap-1 rounded-full border
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${selectedClass}
        ${onClick ? "cursor-pointer hover:scale-105" : ""}
        transition-all duration-200 font-medium
      `}
      onClick={onClick}
    >
      <span>{label}</span>
      {removable && onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="hover:bg-black/10 rounded-full p-0.5 transition-colors"
          aria-label="Ta bort"
        >
          <X size={size === "sm" ? 12 : size === "md" ? 14 : 16} />
        </button>
      )}
    </motion.div>
  );
}

