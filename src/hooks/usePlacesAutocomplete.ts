"use client";

import { useEffect, useRef } from "react";
import { loadGoogleMaps } from "@/lib/googleMapsLoader";

type PlaceResult = { lat: number; lng: number; label: string };

export function usePlacesAutocomplete(
  inputRef: React.RefObject<HTMLInputElement | null>,
  onSelect: (place: PlaceResult) => void
) {
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    let autocomplete: any;
    let listener: any;
    let cancelled = false;
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    let stopPollTimeout: ReturnType<typeof setTimeout> | null = null;

    function attach(): boolean {
      if (cancelled || !inputRef.current) return false;
      const google = (window as any).google;
      if (!google?.maps?.places) return false;

      // Matches DistressSignalModal's Autocomplete config exactly, so every
      // location input in the app gives the same suggestions/behavior.
      autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
        types: ["geocode", "establishment"],
        componentRestrictions: { country: "ng" },
        fields: ["geometry", "formatted_address", "name"],
      });
      listener = autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        const loc = place?.geometry?.location;
        if (!loc) return;
        onSelectRef.current({
          lat: loc.lat(),
          lng: loc.lng(),
          label: place.formatted_address || place.name || "Selected location",
        });
      });
      return true;
    }

    loadGoogleMaps()
      .then(() => {
        if (cancelled) return;

        // FIX: the input element doesn't exist yet on pages that show a
        // loading skeleton before rendering the real input (both dashboards).
        // The old code checked `inputRef.current` exactly once and gave up
        // forever if it was null at that moment — so autocomplete silently
        // never attached once the real input mounted later. Now we poll
        // briefly (every 150ms, up to 10s) until the ref is available.
        if (attach()) return;

        pollTimer = setInterval(() => {
          if (attach() && pollTimer) {
            clearInterval(pollTimer);
            pollTimer = null;
          }
        }, 150);

        stopPollTimeout = setTimeout(() => {
          if (pollTimer) {
            clearInterval(pollTimer);
            pollTimer = null;
          }
        }, 10000);
      })
      .catch(() => {
        // Google Maps didn't load — input still works as plain text,
        // auto-detect buttons are unaffected.
      });

    return () => {
      cancelled = true;
      if (pollTimer) clearInterval(pollTimer);
      if (stopPollTimeout) clearTimeout(stopPollTimeout);
      if (listener) listener.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}