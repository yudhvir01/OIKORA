import { describe, expect, it } from "vitest";

import { parseCsv, toCsv } from "@/lib/csv";

describe("parseCsv", () => {
  it("parses simple comma-separated rows", () => {
    expect(parseCsv("a,b,c\n1,2,3")).toEqual([
      ["a", "b", "c"],
      ["1", "2", "3"],
    ]);
  });

  it("handles quoted fields containing commas and newlines", () => {
    const input = 'name,note\n"Acme, Inc.","line1\nline2"';
    expect(parseCsv(input)).toEqual([
      ["name", "note"],
      ["Acme, Inc.", "line1\nline2"],
    ]);
  });

  it("unescapes doubled quotes inside a quoted field", () => {
    expect(parseCsv('field\n"say ""hi"""')).toEqual([["field"], ['say "hi"']]);
  });

  it("handles CRLF line endings", () => {
    expect(parseCsv("a,b\r\n1,2\r\n")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });

  it("drops trailing blank lines", () => {
    expect(parseCsv("a,b\n1,2\n\n")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });
});

describe("toCsv", () => {
  it("round-trips through parseCsv for fields needing escaping", () => {
    const csv = toCsv(
      [{ name: 'Says "hi", once', qty: 3 }],
      [
        { header: "name", value: (r) => r.name },
        { header: "qty", value: (r) => r.qty },
      ],
    );
    expect(parseCsv(csv)).toEqual([
      ["name", "qty"],
      ['Says "hi", once', "3"],
    ]);
  });
});
