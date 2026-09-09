"use client";

interface FilterState {
  category: string;
  minPrice: string;
  maxPrice: string;
  minRating: string;
  minExperience: string;
  radius: number;
}

interface TechnicianFiltersProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  onSearch: () => void;
  loading?: boolean;
}

const CATEGORIES = [
  "", "Plumber", "Electrician", "Painter",
  "Mechanic", "Cleaner", "Carpenter", "AC Technician", "Other",
];

export default function TechnicianFilters({
  filters, onChange, onSearch, loading,
}: TechnicianFiltersProps) {
  const update = (key: keyof FilterState, value: any) =>
    onChange({ ...filters, [key]: value });

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border">
      <h3 className="font-semibold text-gray-700 mb-4">Filter Technicians</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Category */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
          <select
            value={filters.category}
            onChange={(e) => update("category", e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c || "All"}</option>
            ))}
          </select>
        </div>

        {/* Min Price */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Min Price (₦)</label>
          <input
            type="number"
            placeholder="0"
            value={filters.minPrice}
            onChange={(e) => update("minPrice", e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Max Price */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Max Price (₦)</label>
          <input
            type="number"
            placeholder="Any"
            value={filters.maxPrice}
            onChange={(e) => update("maxPrice", e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Min Rating */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Min Rating</label>
          <select
            value={filters.minRating}
            onChange={(e) => update("minRating", e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Any</option>
            {[3, 3.5, 4, 4.5].map((r) => (
              <option key={r} value={r}>⭐ {r}+</option>
            ))}
          </select>
        </div>

        {/* Min Experience */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Min Experience</label>
          <select
            value={filters.minExperience}
            onChange={(e) => update("minExperience", e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Any</option>
            {[1, 3, 5, 10].map((y) => (
              <option key={y} value={y}>{y}+ years</option>
            ))}
          </select>
        </div>

        {/* Radius */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Radius: {filters.radius}km
          </label>
          <input
            type="range"
            min="5"
            max="100"
            value={filters.radius}
            onChange={(e) => update("radius", Number(e.target.value))}
            className="w-full mt-2"
          />
        </div>
      </div>

      <button
        onClick={onSearch}
        disabled={loading}
        className="mt-4 w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
      >
        {loading ? "Searching..." : "🔍 Search Technicians"}
      </button>
    </div>
  );
}