import { useEffect, useRef, useState } from "react";
import { FaFilter, FaSearch } from "react-icons/fa";

interface Props {
  label: React.ReactNode;
  columnKey: string;
  /** Every distinct value currently in this column (unfiltered dataset). */
  allValues: string[];
  /** The checked set for this column, or undefined if no filter is applied. */
  selected: Set<string> | undefined;
  onApply: (values: Set<string> | null) => void;
  /**
   * Optional value -> CSS colour map. When provided, each checkbox in the
   * dropdown gets a small coloured dot matching that value's badge colour
   * elsewhere in the table (e.g. Expired -> red, Valid -> green), so the
   * filter list itself reads as a colour filter rather than a plain list.
   */
  valueColors?: Record<string, string>;
}

/**
 * Drop this in place of a plain <th> to get an Excel-style funnel filter:
 * click the icon, search/tick the values you want, Apply. The icon fills in
 * solid once a filter is active on that column so it's obvious at a glance
 * which columns are currently narrowed.
 */
const ColumnFilterHeader = ({
  label,
  columnKey,
  allValues,
  selected,
  onApply,
  valueColors,
}: Props) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState<Set<string>>(
    selected ?? new Set(allValues)
  );
  const wrapperRef = useRef<HTMLDivElement>(null);

  const isFiltered = Boolean(selected);

  useEffect(() => {
    if (open) {
      setDraft(selected ?? new Set(allValues));
      setSearch("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const visibleValues = allValues.filter((v) =>
    v.toLowerCase().includes(search.toLowerCase())
  );

  const allVisibleChecked =
    visibleValues.length > 0 && visibleValues.every((v) => draft.has(v));

  const toggleValue = (value: string) => {
    setDraft((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  };

  const toggleSelectAllVisible = () => {
    setDraft((prev) => {
      const next = new Set(prev);
      if (allVisibleChecked) {
        visibleValues.forEach((v) => next.delete(v));
      } else {
        visibleValues.forEach((v) => next.add(v));
      }
      return next;
    });
  };

  const handleApply = () => {
    // Everything checked === no real filter, so store it as "cleared"
    // rather than an explicit full set (keeps the funnel icon accurate).
    onApply(draft.size >= allValues.length ? null : new Set(draft));
    setOpen(false);
  };

  const handleClear = () => {
    onApply(null);
    setOpen(false);
  };

  return (
    <th className="col-filter-th">
      <div className="col-filter-th-inner" ref={wrapperRef}>
        <span>{label}</span>

        <button
          type="button"
          className={`col-filter-btn no-print${isFiltered ? " active" : ""}`}
          onClick={() => setOpen((prev) => !prev)}
          title={`Filter ${typeof label === "string" ? label : columnKey}`}
        >
          <FaFilter />
        </button>

        {open && (
          <div className="col-filter-menu no-print">
            <div className="col-filter-search">
              <FaSearch />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
            </div>

            <label className="col-filter-item col-filter-select-all">
              <input
                type="checkbox"
                checked={allVisibleChecked}
                onChange={toggleSelectAllVisible}
              />
              Select All
            </label>

            <div className="col-filter-list">
              {visibleValues.length === 0 && (
                <div className="col-filter-empty">No matches</div>
              )}

              {visibleValues.map((value) => (
                <label key={value} className="col-filter-item">
                  <input
                    type="checkbox"
                    checked={draft.has(value)}
                    onChange={() => toggleValue(value)}
                  />
                  {valueColors?.[value] && (
                    <span
                      className="col-filter-dot"
                      style={{ background: valueColors[value] }}
                    />
                  )}
                  {value}
                </label>
              ))}
            </div>

            <div className="col-filter-actions">
              <button type="button" onClick={handleClear}>
                Clear
              </button>
              <button
                type="button"
                className="col-filter-apply"
                onClick={handleApply}
              >
                Apply
              </button>
            </div>
          </div>
        )}
      </div>
    </th>
  );
};

export default ColumnFilterHeader;
