import { describe, expect, it } from "vitest";

import { parseProductsCsv } from "@/lib/product-import";

describe("parseProductsCsv", () => {
  it("parses valid rows with all optional columns", () => {
    const csv = [
      "sku,name,unit,category,reorderPoint,unitCostCents",
      "SKU-1,Widget,each,Hardware,10,199",
    ].join("\n");

    const { rows, errors } = parseProductsCsv(csv);
    expect(errors).toEqual([]);
    expect(rows).toEqual([
      {
        line: 2,
        sku: "SKU-1",
        name: "Widget",
        unit: "each",
        category: "Hardware",
        reorderPoint: 10,
        unitCostCents: 199,
      },
    ]);
  });

  it("defaults reorderPoint to 0 and unitCostCents to null when omitted", () => {
    const csv = ["sku,name,unit,category", "SKU-1,Widget,each,Hardware"].join("\n");
    const { rows } = parseProductsCsv(csv);
    expect(rows[0].reorderPoint).toBe(0);
    expect(rows[0].unitCostCents).toBeNull();
  });

  it("is case-insensitive and order-independent on headers", () => {
    const csv = ["Category,SKU,Name,Unit", "Hardware,SKU-1,Widget,each"].join("\n");
    const { rows, errors } = parseProductsCsv(csv);
    expect(errors).toEqual([]);
    expect(rows[0].sku).toBe("SKU-1");
  });

  it("reports a top-level error when a required column is missing", () => {
    const csv = ["sku,name,unit", "SKU-1,Widget,each"].join("\n");
    const { rows, errors } = parseProductsCsv(csv);
    expect(rows).toEqual([]);
    expect(errors[0].message).toMatch(/category/i);
  });

  it("reports an empty CSV", () => {
    const { rows, errors } = parseProductsCsv("");
    expect(rows).toEqual([]);
    expect(errors[0].message).toMatch(/empty/i);
  });

  it("skips a row missing a required field and reports its line", () => {
    const csv = [
      "sku,name,unit,category",
      "SKU-1,Widget,each,Hardware",
      "SKU-2,,each,Hardware",
    ].join("\n");
    const { rows, errors } = parseProductsCsv(csv);
    expect(rows).toHaveLength(1);
    expect(errors).toEqual([
      { line: 3, message: "sku, name, unit, and category are all required" },
    ]);
  });

  it("rejects a negative or non-numeric reorderPoint", () => {
    const csv = [
      "sku,name,unit,category,reorderPoint",
      "SKU-1,Widget,each,Hardware,-5",
      "SKU-2,Gadget,each,Hardware,abc",
    ].join("\n");
    const { rows, errors } = parseProductsCsv(csv);
    expect(rows).toEqual([]);
    expect(errors).toHaveLength(2);
  });

  it("rejects a negative or non-numeric unitCostCents", () => {
    const csv = [
      "sku,name,unit,category,reorderPoint,unitCostCents",
      "SKU-1,Widget,each,Hardware,10,-1",
    ].join("\n");
    const { rows, errors } = parseProductsCsv(csv);
    expect(rows).toEqual([]);
    expect(errors[0].message).toMatch(/unitCostCents/);
  });
});
