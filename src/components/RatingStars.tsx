interface RatingStarsProps {
  rating: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onRate?: (rating: number) => void;
}

export default function RatingStars({
  rating, max = 5, size = "md", interactive = false, onRate,
}: RatingStarsProps) {
  const sizes = { sm: "text-sm", md: "text-xl", lg: "text-3xl" };

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <button
          key={i}
          disabled={!interactive}
          onClick={() => onRate?.(i + 1)}
          className={`${sizes[size]} transition ${
            interactive ? "hover:scale-110 cursor-pointer" : "cursor-default"
          } ${i < Math.round(rating) ? "text-yellow-400" : "text-gray-200"}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}