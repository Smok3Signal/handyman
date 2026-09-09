"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Transition } from "framer-motion";
import { X, Loader2, MapPin, Check } from "lucide-react";
import { loadGoogleMaps } from "@/lib/googleMapsLoader";

const spring: Transition = { type: "spring", stiffness: 500, damping: 28 };

type LocationPickerMapProps = {
  lat: number;
  lng: number;
  onConfirm: (lat: number, lng: number, label: string) => void;
  onClose: () => void;
};

// Same reverse-geocode pattern already used on the dashboards and find page,
// kept local here so this component has no dependency on the page that uses it.
async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
    );
    const data = await res.json();
    const addr = data.address;
    const city = addr.city ?? addr.town ?? addr.village ?? addr.county ?? "Selected location";
    return `${city}, ${addr.country ?? ""}`.trim().replace(/,$/, "");
  } catch {
    return "Selected location";
  }
}

export default function LocationPickerMap({
  lat, lng, onConfirm, onClose,
}: LocationPickerMapProps) {
  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const [mapLoading, setMapLoading] = useState(true);
  const [mapError, setMapError] = useState(false);
  const [pinLat, setPinLat] = useState(lat);
  const [pinLng, setPinLng] = useState(lng);
  const [confirming, setConfirming] = useState(false);

  const movePin = useCallback((newLat: number, newLng: number) => {
    setPinLat(newLat);
    setPinLng(newLng);
    if (markerRef.current) {
      markerRef.current.setPosition({ lat: newLat, lng: newLng });
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    loadGoogleMaps()
      .then(() => {
        if (cancelled || !mapDivRef.current) return;
        const google = (window as any).google;

        const map = new google.maps.Map(mapDivRef.current, {
          center: { lat, lng },
          zoom: 14,
          disableDefaultUI: true,
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
        });
        mapRef.current = map;

        const marker = new google.maps.Marker({
          position: { lat, lng },
          map,
          draggable: true,
        });
        markerRef.current = marker;

        marker.addListener("dragend", () => {
          const pos = marker.getPosition();
          if (pos) movePin(pos.lat(), pos.lng());
        });

        map.addListener("click", (e: any) => {
          const clickedLat = e.latLng.lat();
          const clickedLng = e.latLng.lng();
          movePin(clickedLat, clickedLng);
        });

        setMapLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setMapLoading(false);
          setMapError(true);
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConfirm = async () => {
    setConfirming(true);
    const label = await reverseGeocode(pinLat, pinLng);
    setConfirming(false);
    onConfirm(pinLat, pinLng, label);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={spring}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl overflow-hidden w-full max-w-lg shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-orange-500" />
              <h3 className="text-sm font-bold text-stone-800">Pick your location</h3>
            </div>
            <button onClick={onClose} className="text-stone-400 hover:text-stone-600 transition-colors">
              <X className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* Map */}
          <div className="relative w-full h-80 bg-stone-100">
            {mapLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-orange-400 animate-spin" />
              </div>
            )}
            {mapError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center px-6">
                <p className="text-sm font-semibold text-stone-600">Map couldn't load</p>
                <p className="text-xs text-stone-400">Check your connection and try again</p>
              </div>
            )}
            <div ref={mapDivRef} className="w-full h-full" />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 px-5 py-4">
            <p className="text-xs text-stone-400">
              Tap the map or drag the pin to set your location
            </p>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={spring}
              onClick={handleConfirm}
              disabled={mapLoading || mapError || confirming}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-colors disabled:opacity-50 shrink-0"
            >
              {confirming ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              {confirming ? "Confirming…" : "Confirm location"}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}