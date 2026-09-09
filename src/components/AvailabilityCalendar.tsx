"use client";

const DAYS = [
  { label: "Sun", value: 0 },
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 6 },
];

interface AvailabilityCalendarProps {
  availability: number[]; // array of available day numbers
  editable?: boolean;
  onToggle?: (day: number) => void;
}

export default function AvailabilityCalendar({
  availability, editable = false, onToggle,
}: AvailabilityCalendarProps) {
  return (
    <div className="flex gap-2 flex-wrap">
      {DAYS.map((day) => {
        const isAvailable = availability.includes(day.value);
        return (
          <button
            key={day.value}
            disabled={!editable}
            onClick={() => onToggle?.(day.value)}
            className={`w-12 h-12 rounded-xl text-sm font-semibold transition ${
              isAvailable
                ? "bg-green-500 text-white shadow-sm"
                : "bg-gray-100 text-gray-400"
            } ${editable ? "hover:scale-105 cursor-pointer" : "cursor-default"}`}
          >
            {day.label}
          </button>
        );
      })}
    </div>
  );
}