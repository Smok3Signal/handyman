import { Check, Navigation, MapPin, Wrench, Star, Clock } from "lucide-react";

const STAGES = [
  { key: "PENDING",     label: "Requested",   icon: Clock },
  { key: "ACCEPTED",    label: "Accepted",    icon: Check },
  { key: "ON_THE_WAY",  label: "On The Way",  icon: Navigation },
  { key: "ARRIVED",     label: "Arrived",     icon: MapPin },
  { key: "IN_PROGRESS", label: "In Progress", icon: Wrench },
  { key: "COMPLETED",   label: "Done",        icon: Star },
];

const STATUS_ORDER = [
  "PENDING", "ACCEPTED", "ON_THE_WAY",
  "ARRIVED", "IN_PROGRESS", "COMPLETED",
  "REDO_REQUESTED", "SATISFIED",
];

export default function JobTimeline({ status }: { status: string }) {
  const normalized =
    status === "REDO_REQUESTED" ? "IN_PROGRESS"
    : status === "SATISFIED" ? "COMPLETED"
    : status;

  const currentIndex = STATUS_ORDER.indexOf(normalized);

  return (
    <div className="w-full overflow-x-auto py-1">
      <div className="flex items-start min-w-max gap-0">
        {STAGES.map((stage, i) => {
          const Icon = stage.icon;
          const done = i <= currentIndex;
          const active = STATUS_ORDER[currentIndex] === stage.key;

          return (
            <div key={stage.key} className="flex items-start">
              {/* Node + label */}
              <div className="flex flex-col items-center w-14">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                    active
                      ? "bg-orange-500 text-white shadow-md shadow-orange-200 ring-4 ring-orange-100"
                      : done
                      ? "bg-orange-400 text-white"
                      : "bg-stone-100 text-stone-300"
                  }`}
                >
                  <Icon size={13} strokeWidth={2.2} />
                </div>
                <span
                  className={`text-[10px] mt-1.5 text-center leading-tight font-medium whitespace-nowrap transition-colors duration-300 ${
                    active ? "text-orange-600" : done ? "text-orange-400" : "text-stone-300"
                  }`}
                >
                  {stage.label}
                </span>
              </div>

              {/* Connector */}
              {i < STAGES.length - 1 && (
                <div className="flex items-center mt-4 -mx-1">
                  <div
                    className={`w-6 h-0.5 transition-all duration-500 rounded-full ${
                      i < currentIndex ? "bg-orange-400" : "bg-stone-100"
                    }`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}