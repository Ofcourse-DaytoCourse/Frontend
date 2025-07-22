"use client";

import { useState } from "react";
import { Star } from "lucide-react";

interface RatingProps {
  value: number;
  onChange?: (rating: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
  showNumber?: boolean;
}

export function Rating({ value, onChange, readonly = false, size = "md", showNumber = false }: RatingProps) {
  const [hoverValue, setHoverValue] = useState(0);
  
  const sizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5", 
    lg: "w-6 h-6"
  };

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${sizes[size]} ${readonly ? 'cursor-default' : 'cursor-pointer'} transition-colors ${
            star <= (hoverValue || value) 
              ? "fill-yellow-400 text-yellow-400" 
              : "text-gray-300"
          }`}
          onClick={() => !readonly && onChange?.(star)}
          onMouseEnter={() => !readonly && setHoverValue(star)}
          onMouseLeave={() => !readonly && setHoverValue(0)}
        />
      ))}
      {showNumber && <span className="ml-2 text-sm text-gray-600">{value}/5</span>}
    </div>
  );
}