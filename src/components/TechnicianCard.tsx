"use client";

import {
  Star,
  MapPin,
  Briefcase,
  DollarSign,
  AlertTriangle,
  MessageCircle,
  Zap,
  Trophy,
} from "lucide-react";
import { getRankColor } from "@/lib/utils";

interface TechnicianCardProps {
  technician: {
    id: string;
    name: string;
    phone?: string;
    profileImage?: string;
    distance: number;
    hasUnsatisfactoryNotice?: boolean;
    isTopPerformer?: boolean;
    technicianProfile: {
      businessName: string;
      serviceCategory: string;
      yearsOfExperience: number;
      basePrice: number;
      averageRating: number;
      totalReviews: number;
      description: string;
      rank?: string;
    };
  };
  onHire: (technicianId: string) => void;
}

export default function TechnicianCard({
  technician,
  onHire,
}: TechnicianCardProps) {
  const profile = technician.technicianProfile;

  const whatsappPhone = technician.phone?.replace(/\D/g, "");
  const whatsappUrl = whatsappPhone ? `https://wa.me/${whatsappPhone}` : null;

  return (
    <div
      className={`bg-white rounded-xl shadow-sm border hover:shadow-md transition flex flex-col h-full ${
        technician.isTopPerformer
          ? "border-amber-300 ring-1 ring-amber-200"
          : technician.hasUnsatisfactoryNotice
          ? "border-orange-300"
          : ""
      }`}
    >
      {/* Top Performer banner */}
      {technician.isTopPerformer && (
        <div className="flex items-center gap-2 bg-linear-to-r from-amber-50 to-yellow-50 border-b border-amber-200 text-amber-700 text-xs px-4 py-2.5 rounded-t-xl">
          <Trophy size={13} className="shrink-0 text-amber-500" />
          <span className="font-semibold tracking-wide">Top Performer</span>
          <span className="text-amber-500 ml-auto">⭐ Top 10 on HandyMan</span>
        </div>
      )}

      {/* Unsatisfactory notice banner */}
      {!technician.isTopPerformer && technician.hasUnsatisfactoryNotice && (
        <div className="flex items-center gap-2 bg-orange-50 border-b border-orange-200 text-orange-700 text-xs px-4 py-2.5 rounded-t-xl">
          <AlertTriangle size={13} className="shrink-0" />
          <span>
            <strong>Notice:</strong> This technician has provided unsatisfactory
            service recently. Proceed with caution.
          </span>
        </div>
      )}

      {/* Card content */}
      <div className="flex flex-col flex-1 p-5">

        {/* Avatar and name */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            {/* Avatar with optional gold ring for top performers */}
            <div className={`shrink-0 ${technician.isTopPerformer ? "ring-2 ring-amber-400 ring-offset-1 rounded-full" : ""}`}>
              {technician.profileImage ? (
                <img
                  src={technician.profileImage}
                  alt={technician.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-blue-100"
                />
              ) : (
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-xl font-bold text-blue-600">
                  {technician.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-semibold text-gray-800">
                  {technician.name}
                </h3>
                {technician.isTopPerformer && (
                  <Trophy size={13} className="text-amber-500 shrink-0" />
                )}
              </div>
              <p className="text-sm text-gray-500">{profile.businessName}</p>
              {profile.rank && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full border font-medium ${getRankColor(
                    profile.rank
                  )}`}
                >
                  {profile.rank}
                </span>
              )}
            </div>
          </div>
          <span className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full font-medium shrink-0">
            {profile.serviceCategory}
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <MapPin size={14} className="text-blue-500 shrink-0" />
            {technician.distance.toFixed(1)} km away
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <Star size={14} className="text-yellow-500 shrink-0" />
            {profile.averageRating.toFixed(1)} ({profile.totalReviews} reviews)
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <Briefcase size={14} className="text-green-500 shrink-0" />
            {profile.yearsOfExperience} yrs experience
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <DollarSign size={14} className="text-purple-500 shrink-0" />
            From ₦{profile.basePrice.toLocaleString()}
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-500 mb-4 flex-1 line-clamp-2">
          {profile.description}
        </p>

        {/* Buttons */}
        <div className="flex flex-col gap-2 mt-auto">
          {/* Top row: View Profile + Hire */}
          <div className="flex gap-2">
            <a
              href={`/technician/${technician.id}`}
              className="flex-1 border border-blue-200 text-blue-600 py-2 rounded-lg font-semibold hover:bg-blue-50 transition text-sm text-center"
            >
              View Profile
            </a>
            <button
              onClick={() => onHire(technician.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 text-white py-2 rounded-lg font-semibold transition text-sm ${
                technician.hasUnsatisfactoryNotice && !technician.isTopPerformer
                  ? "bg-orange-500 hover:bg-orange-600"
                  : technician.isTopPerformer
                  ? "bg-amber-500 hover:bg-amber-600"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              <Zap size={13} />
              {technician.hasUnsatisfactoryNotice && !technician.isTopPerformer
                ? "Hire Anyway"
                : "Hire"}
            </button>
          </div>

          {/* WhatsApp button */}
          {whatsappUrl ? (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2 rounded-lg font-semibold text-sm transition border"
              style={{
                backgroundColor: "#f0fdf4",
                color: "#15803d",
                borderColor: "#bbf7d0",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.backgroundColor =
                  "#dcfce7";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.backgroundColor =
                  "#f0fdf4";
              }}
            >
              <MessageCircle size={14} />
              Chat on WhatsApp
            </a>
          ) : (
            <button
              disabled
              className="flex items-center justify-center gap-2 w-full py-2 rounded-lg font-semibold text-sm border border-stone-200 text-stone-300 cursor-not-allowed"
            >
              <MessageCircle size={14} />
              WhatsApp unavailable
            </button>
          )}
        </div>
      </div>
    </div>
  );
}