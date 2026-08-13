import { useState } from "react";
import { FaSearch, FaTimes, FaColumns } from "react-icons/fa";

export interface ToolbarColumn {
  key: string;
  label: string;
}

interface Props {
  search: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;

  columns: ToolbarColumn[];
  isColumnVisible: (key: string) => boolean;
  onToggleColumn: (key: string) => void;
  onShowAllColumns: () => void;
  onHideAllColumns: () => void;

  /** Extra filter controls (e.g. a status dropdown) rendered next to the search box, if a page still needs one. */
  extraFilters?: React.ReactNode;
}

/**
 * One small search box that matches across every field of a record, plus a
 * "Columns" picker so the user can choose exactly which columns should stay
 * on screen - and therefore exactly what gets printed, since Print just
 * prints whatever the table is currently showing.
 */
const RecordsToolbar = ({
  search,
  onSearchChange,
  placeholder = "Search records...",
  columns,
  isColumnVisible,
  onToggleColumn,
  onShowAllColumns,
  onHideAllColumns,
  extraFilters,
}: Props) => {
  const [showColumnPicker, setShowColumnPicker] = useState(false);

  const visibleCount = columns.filter((col) =>
    isColumnVisible(col.key)
  ).length;

  return (
    <div className="form-card no-print">
      <h2 className="section-title">Search & Column Filters</h2>

      <div className="toolbar-row">
        <div className="small-search-box">
          <FaSearch className="small-search-icon" />

          <input
            type="text"
            className="small-search-input"
            placeholder={placeholder}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />

          {search && (
            <button
              type="button"
              className="small-search-clear"
              onClick={() => onSearchChange("")}
              aria-label="Clear search"
              title="Clear search"
            >
              <FaTimes />
            </button>
          )}
        </div>

        {extraFilters}

        <button
          type="button"
          className="column-filter-toggle"
          onClick={() => setShowColumnPicker((prev) => !prev)}
        >
          <FaColumns />
          &nbsp; Columns ({visibleCount}/{columns.length})
        </button>
      </div>

      {showColumnPicker && (
        <div className="column-picker">
          <div className="column-picker-header">
            <span>Choose which columns to show &amp; print</span>

            <div className="column-picker-actions">
              <button type="button" onClick={onShowAllColumns}>
                Select All
              </button>

              <button
                type="button"
                onClick={() =>
                  onHideAllColumns()
                }
              >
                Clear All
              </button>
            </div>
          </div>

          <div className="column-picker-grid">
            {columns.map((col) => (
              <label key={col.key} className="column-picker-item">
                <input
                  type="checkbox"
                  checked={isColumnVisible(col.key)}
                  onChange={() => onToggleColumn(col.key)}
                />
                {col.label}
              </label>
            ))}
          </div>

          <p className="column-picker-hint">
            Unchecked columns are hidden from the table below and left out
            when you print - so if you only need, say, Project Code, Site
            and Fitness on the printout, uncheck everything else here first.
          </p>
        </div>
      )}
    </div>
  );
};

export default RecordsToolbar;
