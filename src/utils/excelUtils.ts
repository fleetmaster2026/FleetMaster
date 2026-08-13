import * as XLSX from "xlsx";

/**
 * Describes how a single field on a record maps to a column in the
 * exported / imported Excel sheet.
 */
export interface ColumnDef<T> {
  header: string;
  key: keyof T;
  type?: "number" | "date" | "string";
}

/**
 * Converts an array of records into an Excel (.xlsx) file and triggers
 * a browser download. Column order/headers are driven by `columns`, so
 * a file exported here can always be re-imported with the same config.
 */
export function exportRecordsToExcel<T extends Record<string, any>>(
  records: T[],
  columns: ColumnDef<T>[],
  fileName: string,
  sheetName = "Sheet1"
) {
  const rows = records.map((record) => {
    const row: Record<string, any> = {};

    columns.forEach((col) => {
      const value = record[col.key];

      row[col.header] =
        value === undefined || value === null ? "" : value;
    });

    return row;
  });

  const worksheet = XLSX.utils.json_to_sheet(rows, {
    header: columns.map((c) => c.header),
  });

  // Reasonable default column widths so the sheet is usable as-is.
  worksheet["!cols"] = columns.map((c) => ({
    wch: Math.max(c.header.length + 2, 14),
  }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  XLSX.writeFile(workbook, `${fileName}.xlsx`);
}

/** Reads the first sheet of an uploaded Excel/CSV file into raw JSON rows. */
export function readExcelFile(
  file: File
): Promise<Record<string, any>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const binaryStr = event.target?.result;
        const workbook = XLSX.read(binaryStr, { type: "binary" });

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        const rows = XLSX.utils.sheet_to_json<Record<string, any>>(
          worksheet,
          { defval: "" }
        );

        resolve(rows);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = () => reject(reader.error);

    reader.readAsBinaryString(file);
  });
}

const excelSerialToDate = (serial: number): Date => {
  // Excel's day-0 is 1899-12-30 (accounting for its fake 1900 leap year).
  const utcDays = Math.floor(serial - 25569);
  const utcMs = utcDays * 86400 * 1000;
  return new Date(utcMs);
};

/** Normalises a date cell (Date object, Excel serial, or text) to yyyy-mm-dd. */
export function toDateInputString(raw: any): string {
  if (raw === undefined || raw === null || raw === "") return "";

  if (raw instanceof Date && !isNaN(raw.getTime())) {
    const y = raw.getFullYear();
    const m = String(raw.getMonth() + 1).padStart(2, "0");
    const d = String(raw.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  if (typeof raw === "number") {
    return toDateInputString(excelSerialToDate(raw));
  }

  const text = String(raw).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;

  const parts = text.split(/[/\-.]/);

  if (parts.length === 3) {
    // dd-mm-yyyy (most common when a person edits dates by hand in India)
    if (parts[2].length === 4) {
      const [d, m, y] = parts;
      return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }

    // yyyy-mm-dd already, just re-pad
    if (parts[0].length === 4) {
      const [y, m, d] = parts;
      return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }
  }

  return text;
}

/** Converts raw imported rows (keyed by header text) back into typed records. */
export function mapRowsToRecords<T extends Record<string, any>>(
  rows: Record<string, any>[],
  columns: ColumnDef<T>[]
): Partial<T>[] {
  return rows.map((row) => {
    const record: Partial<T> = {};

    columns.forEach((col) => {
      const raw = row[col.header];

      if (col.type === "number") {
        (record as any)[col.key] =
          raw === "" || raw === undefined ? 0 : Number(raw) || 0;
      } else if (col.type === "date") {
        (record as any)[col.key] = toDateInputString(raw);
      } else {
        (record as any)[col.key] =
          raw === undefined || raw === null ? "" : String(raw).trim();
      }
    });

    return record;
  });
}
