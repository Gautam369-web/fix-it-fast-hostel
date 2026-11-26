import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Star } from 'lucide-react';

export interface RatingStarsProps {
  value: number;
  onChange?: (rating: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'lg';
}

export const RatingStars: React.FC<RatingStarsProps> = ({
  value,
  onChange,
  readonly = false,
  size = 'lg',
}) => {
  const [hovered, setHovered] = useState<number | null>(null);
  const activeCount = hovered ?? value;

  return (
    <div className="inline-flex items-center gap-2" role={readonly ? undefined : 'radiogroup'} aria-label="Service rating">
      {[1, 2, 3, 4, 5].map((star, idx) => {
        const filled = star <= activeCount;
        return (
          <motion.button
            key={star}
            type="button"
            disabled={readonly}
            role={readonly ? undefined : 'radio'}
            aria-checked={readonly ? undefined : value === star}
            aria-label={`${star} star${star > 1 ? 's' : ''}`}
            onClick={() => !readonly && onChange?.(star)}
            onMouseEnter={() => !readonly && setHovered(star)}
            onMouseLeave={() => !readonly && setHovered(null)}
            initial={false}
            animate={
              filled
                ? { scale: [1, 1.24, 1], rotate: [0, -8, 0] }
                : { scale: 1, rotate: 0 }
            }
            transition={{
              delay: filled ? idx * 0.055 : 0,
              type: 'spring',
              stiffness: 340,
              damping: 18,
            }}
            className={`relative flex items-center justify-center rounded-2xl transition-colors ${
              size === 'lg' ? 'w-11 h-11 glass-lens-card' : 'w-6 h-6'
            } ${readonly ? 'cursor-default' : 'cursor-pointer'}`}
          >
            <Star
              className={`${size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} transition-colors ${
                filled
                  ? 'fill-[var(--accent-amber)] text-[var(--accent-amber)] drop-shadow-[0_0_8px_var(--accent-amber-glow)]'
                  : 'text-[var(--text-muted)]'
              }`}
              aria-hidden="true"
            />
            {filled && size === 'lg' && (
              <motion.span
                initial={{ opacity: 0, scale: 0.4 }}
                animate={{ opacity: [0, 1, 0], scale: [0.6, 1.35, 1.6] }}
                transition={{ duration: 0.5, delay: idx * 0.06 }}
                className="pointer-events-none absolute -top-1 -right-1 text-[var(--accent-amber)]"
              >
                <Sparkles className="w-3 h-3" />
              </motion.span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
};
