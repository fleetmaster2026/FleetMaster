// Shared "vehicle age" logic, calculated from Registration Date.
// Used by both Vehicle Master and RTA Documents so the two pages can
// never drift out of sync on what counts as old.
//
// < 10 years  -> green
// 10-15 years -> orange
// > 15 years  -> red

export interface VehicleAgeBadge {
  className: string;
  text: string;
  years: number | null;
}

export const getVehicleAge = (date: string): VehicleAgeBadge => {
  if (!date) {
    return {
      className: "age-gray",
      text: "-",
      years: null,
    };
  }

  const regDate = new Date(date);

  // Free text entry (e.g. from RTA Documents' DateOrTextField) - nothing
  // to calculate an age from, just show it.
  if (isNaN(regDate.getTime())) {
    return {
      className: "age-gray",
      text: date,
      years: null,
    };
  }

  const today = new Date();

  let years = today.getFullYear() - regDate.getFullYear();
  const monthDiff = today.getMonth() - regDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < regDate.getDate())
  ) {
    years--;
  }

  if (years < 0) years = 0;

  let className = "age-green";
  if (years > 15) {
    className = "age-red";
  } else if (years >= 10) {
    className = "age-orange";
  }

  return {
    className,
    text: `${years} ${years === 1 ? "Year" : "Years"}`,
    years,
  };
};

// Same thresholds as getVehicleAge, returned as a filterable category
// instead of the raw, mostly-unique age text.
export const getAgeStatus = (date: string): string => {
  if (!date) return "Unknown";

  const regDate = new Date(date);

  if (isNaN(regDate.getTime())) return "No Expiry Date (Text)";

  const today = new Date();

  let years = today.getFullYear() - regDate.getFullYear();
  const monthDiff = today.getMonth() - regDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < regDate.getDate())
  ) {
    years--;
  }

  if (years < 0) years = 0;

  if (years > 15) return "Over 15 Years";
  if (years >= 10) return "10-15 Years";
  return "Under 10 Years";
};

// Colour dots shown next to each option in the funnel filter dropdown,
// matching the badge colours used in the table cells themselves.
export const AGE_STATUS_COLORS: Record<string, string> = {
  "Under 10 Years": "#16a34a",
  "10-15 Years": "#f59e0b",
  "Over 15 Years": "#dc2626",
  "Unknown": "#9ca3af",
  "No Expiry Date (Text)": "#9ca3af",
};
