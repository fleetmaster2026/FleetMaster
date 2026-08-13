import { useMemo, useState } from "react";

const BLANK = "(Blanks)";

const normalize = (value: unknown): string => {
  const str = value === null || value === undefined ? "" : String(value).trim();
  return str === "" ? BLANK : str;
};

/**
 * Excel-style "click the funnel icon on a column header, tick the values you
 * want" filtering. One instance of this hook drives an entire table: it
 * tracks which values are checked per column, and `applyFilters` narrows a
 * row list down to only the rows that match every active column filter.
 *
 * Unique value lists are computed from the *unfiltered* dataset (not
 * cascading against other active filters) - simpler to reason about, and
 * avoids a column's option list shrinking out from under the user while
 * they're mid-selection.
 */
export function useColumnFilters<T extends object>(rows: T[]) {
  // key -> set of checked raw values (BLANK stands in for empty/null).
  // A key with no entry here means "no filter applied, show everything".
  const [filters, setFilters] = useState<Record<string, Set<string>>>({});

  const getUniqueValues = (key: string): string[] => {
    const set = new Set<string>();
    for (const row of rows) {
      set.add(normalize((row as Record<string, unknown>)[key]));
    }
    return Array.from(set).sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
    );
  };

  const setColumnFilter = (key: string, values: Set<string> | null) => {
    setFilters((prev) => {
      const next = { ...prev };
      if (!values) {
        delete next[key];
      } else {
        next[key] = values;
      }
      return next;
    });
  };

  const clearColumnFilter = (key: string) => setColumnFilter(key, null);

  const clearAllFilters = () => setFilters({});

  const isColumnFiltered = (key: string) => Boolean(filters[key]);

  const activeFilterCount = Object.keys(filters).length;

  const applyFilters = useMemo(() => {
    const entries = Object.entries(filters);
    if (entries.length === 0) return (data: T[]) => data;

    return (data: T[]) =>
      data.filter((row) =>
        entries.every(([key, allowed]) =>
          allowed.has(normalize((row as Record<string, unknown>)[key]))
        )
      );
  }, [filters]);

  return {
    filters,
    getUniqueValues,
    setColumnFilter,
    clearColumnFilter,
    clearAllFilters,
    isColumnFiltered,
    activeFilterCount,
    applyFilters,
    BLANK,
  };
}
