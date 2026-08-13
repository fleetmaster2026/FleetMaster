import { useState } from "react";

/**
 * Tracks which table columns are currently hidden.
 *
 * Every column starts visible. Hiding a column removes it from both the
 * on-screen table AND the printed copy (since print simply clones whatever
 * is currently on screen) - so this one small piece of state is the single
 * source of truth for "what shows up when I print".
 */
export const useColumnVisibility = () => {
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set());

  const isColumnVisible = (key: string) => !hiddenColumns.has(key);

  const toggleColumn = (key: string) => {
    setHiddenColumns((prev) => {
      const next = new Set(prev);

      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }

      return next;
    });
  };

  const showAllColumns = () => setHiddenColumns(new Set());

  const hideAllColumns = (allKeys: string[]) =>
    setHiddenColumns(new Set(allKeys));

  return {
    isColumnVisible,
    toggleColumn,
    showAllColumns,
    hideAllColumns,
    hiddenCount: hiddenColumns.size,
  };
};
