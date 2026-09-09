import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Merges Tailwind classes safely
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Haversine formula - calculates distance between two GPS coordinates
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Calculates technician rank based on completed jobs AND average rating
export function calculateRank(completedJobs: number, averageRating: number): string {
  const score = completedJobs * 0.6 + averageRating * 10 * 0.4;

  if (score >= 80) return "Platinum";
  if (score >= 40) return "Gold";
  if (score >= 15) return "Silver";
  return "Bronze";
}

// Returns rank badge color
export function getRankColor(rank: string): string {
  const colors: Record<string, string> = {
    Bronze: "bg-orange-100 text-orange-700 border-orange-200",
    Silver: "bg-gray-100 text-gray-600 border-gray-300",
    Gold: "bg-yellow-100 text-yellow-700 border-yellow-200",
    Platinum: "bg-blue-100 text-blue-700 border-blue-200",
  };
  return colors[rank] || colors.Bronze;
}

// Estimates minutes away based on distance in km (average speed 30km/h in city)
export function estimateMinutesAway(distanceKm: number): number {
  const avgSpeedKmPerMin = 30 / 60;
  return Math.ceil(distanceKm / avgSpeedKmPerMin);
}