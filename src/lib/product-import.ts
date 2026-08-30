import { parseCsv } from "@/lib/csv";

export type ParsedProductRow = {
  line: number;
  sku: string;
  name: string;
  unit: string;
  category: string;
  reorderPoint: number;
  unitCostCents: number | null;
};

export type ProductRowError = { line: number; message: string };

export type ParseProductsCsvResult = {
  rows: ParsedProductRow[];
  errors: ProductRowError[];
};

const REQUIRED_COLUMNS = ["sku", "name", "unit", "category"] as const;

// Parses a products import CSV into validated rows plus per-line errors.
// Expected header (any order, case-insensitive): sku, name, unit,
// category, reorderPoint (optional, default 0), unitCostCents (optional).
// Doesn't touch the database — category existence is checked by the
// caller, which is why this is separately testable without one.
export function parseProductsCsv(text: string): ParseProductsCsvResult {
  const table = parseCsv(text.trim());
  if (table.length === 0) {
    return { rows: [], errors: [{ line: 0, message: "CSV is empty" }] };
  }

  const header = table[0].map((cell) => cell.trim().toLowerCase());
  const missing = REQUIRED_COLUMNS.filter((col) => !header.includes(col));
  if (missing.length > 0) {
    return {
      rows: [],
      errors: [
        { line: 1, message: `Missing required column(s): ${missing.join(", ")}` },
      ],
    };
  }

  const colIndex = (name: string) => header.indexOf(name);
  const skuIdx = colIndex("sku");
  const nameIdx = colIndex("name");
  const unitIdx = colIndex("unit");
  const categoryIdx = colIndex("category");
  const reorderPointIdx = colIndex("reorderpoint");
  const unitCostCentsIdx = colIndex("unitcostcents");

  const rows: ParsedProductRow[] = [];
  const errors: ProductRowError[] = [];

  for (let i = 1; i < table.length; i++) {
    const line = i + 1;
    const cells = table[i];

    const sku = (cells[skuIdx] ?? "").trim();
    const name = (cells[nameIdx] ?? "").trim();
    const unit = (cells[unitIdx] ?? "").trim();
    const category = (cells[categoryIdx] ?? "").trim();

    if (!sku || !name || !unit || !category) {
      errors.push({
        line,
        message: "sku, name, unit, and category are all required",
      });
      continue;
    }

    let reorderPoint = 0;
    const rawReorderPoint =
      reorderPointIdx === -1 ? "" : (cells[reorderPointIdx] ?? "").trim();
    if (rawReorderPoint) {
      const parsed = Number(rawReorderPoint);
      if (!Number.isFinite(parsed) || parsed < 0) {
        errors.push({ line, message: `Invalid reorderPoint "${rawReorderPoint}"` });
        continue;
      }
      reorderPoint = Math.trunc(parsed);
    }

    let unitCostCents: number | null = null;
    const rawUnitCostCents =
      unitCostCentsIdx === -1 ? "" : (cells[unitCostCentsIdx] ?? "").trim();
    if (rawUnitCostCents) {
      const parsed = Number(rawUnitCostCents);
      if (!Number.isFinite(parsed) || parsed < 0) {
        errors.push({ line, message: `Invalid unitCostCents "${rawUnitCostCents}"` });
        continue;
      }
      unitCostCents = Math.trunc(parsed);
    }

    rows.push({ line, sku, name, unit, category, reorderPoint, unitCostCents });
  }

  return { rows, errors };
}
