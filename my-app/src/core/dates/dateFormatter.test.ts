import { describe, expect, it } from "vitest";
import DateFormatter from "./dateFormatter";

describe("DateFormatter.parseFormat", () => {
  it("falls back to the default format when none is given", () => {
    expect(DateFormatter.parseFormat(undefined)).toEqual({ parts: ["dd", "mmm", "yyyy"], separator: " " });
  });

  it("reads parts and separator from a valid format", () => {
    expect(DateFormatter.parseFormat("yyyy/mm/dd")).toEqual({ parts: ["yyyy", "mm", "dd"], separator: "/" });
  });

  it("is case-insensitive", () => {
    expect(DateFormatter.parseFormat("DD.MM.YY").parts).toEqual(["dd", "mm", "yy"]);
  });

  it.each([
    ["missing the day", "mm-yy-yyyy"],
    ["two years", "dd-yy-yyyy"],
    ["two months", "mm-mmm-yyyy"],
    ["too few parts", "dd-mm"],
    ["unknown part", "dd-xx-yyyy"],
  ])("falls back to yyyy-mm-dd when the format is invalid (%s)", (_name, format) => {
    expect(DateFormatter.parseFormat(format)).toEqual({ parts: ["yyyy", "mm", "dd"], separator: "-" });
  });
});

describe("DateFormatter.normalizeFormat / buildFormat", () => {
  it("round-trips a valid format", () => {
    expect(DateFormatter.normalizeFormat("dd/mm/yyyy")).toBe("dd/mm/yyyy");
    expect(DateFormatter.buildFormat(["yy", "mmm", "dd"], ".")).toBe("yy.mmm.dd");
  });

  it("normalizes an invalid format to the fallback", () => {
    expect(DateFormatter.normalizeFormat("nonsense")).toBe("yyyy-mm-dd");
  });
});

describe("DateFormatter.ensureUniquePart", () => {
  it("swaps the clashing slot so every part stays unique", () => {
    expect(DateFormatter.ensureUniquePart(["dd", "mm", "yyyy"], 0, "yyyy")).toEqual(["yyyy", "mm", "dd"]);
  });

  it("treats mm and mmm as the same part", () => {
    expect(DateFormatter.ensureUniquePart(["dd", "mm", "yyyy"], 0, "mmm")).toEqual(["mmm", "dd", "yyyy"]);
  });

  it("treats yy and yyyy as the same part", () => {
    expect(DateFormatter.ensureUniquePart(["dd", "mm", "yyyy"], 1, "yy")).toEqual(["dd", "yy", "mm"]);
  });

  it("does not mutate the input", () => {
    const parts: ["dd", "mm", "yyyy"] = ["dd", "mm", "yyyy"];
    DateFormatter.ensureUniquePart(parts, 0, "yyyy");
    expect(parts).toEqual(["dd", "mm", "yyyy"]);
  });
});

describe("DateFormatter.formatDateInputValue", () => {
  it("formats an ISO date with the requested format", () => {
    expect(DateFormatter.formatDateInputValue("2026-09-02", "dd mmm yyyy")).toBe("02 Sep 2026");
    expect(DateFormatter.formatDateInputValue("2026-09-02", "dd/mm/yy")).toBe("02/09/26");
  });

  it("returns non-ISO input untouched", () => {
    expect(DateFormatter.formatDateInputValue("02 Sep 2026", "dd mmm yyyy")).toBe("02 Sep 2026");
    expect(DateFormatter.formatDateInputValue("", "dd mmm yyyy")).toBe("");
  });
});

describe("DateFormatter.toDateInputValue", () => {
  it("passes ISO dates through", () => {
    expect(DateFormatter.toDateInputValue("2026-09-02", "dd mmm yyyy")).toBe("2026-09-02");
  });

  it("parses a value written in the field's own format", () => {
    expect(DateFormatter.toDateInputValue("02 Sep 2026", "dd mmm yyyy")).toBe("2026-09-02");
    expect(DateFormatter.toDateInputValue("02/09/26", "dd/mm/yy")).toBe("2026-09-02");
  });

  it("parses common shapes that differ from the configured format", () => {
    expect(DateFormatter.toDateInputValue("02-Sep-2026", "yyyy-mm-dd")).toBe("2026-09-02");
    expect(DateFormatter.toDateInputValue("Sep 02 2026", "yyyy-mm-dd")).toBe("2026-09-02");
    expect(DateFormatter.toDateInputValue("02/09/2026", "yyyy-mm-dd")).toBe("2026-09-02");
  });

  it("is case-insensitive for month names", () => {
    expect(DateFormatter.toDateInputValue("02 sep 2026", "dd mmm yyyy")).toBe("2026-09-02");
  });

  it("returns an empty string when the value cannot be read", () => {
    expect(DateFormatter.toDateInputValue("not a date", "dd mmm yyyy")).toBe("");
    expect(DateFormatter.toDateInputValue("02 Xyz 2026", "dd mmm yyyy")).toBe("");
    expect(DateFormatter.toDateInputValue(undefined, "dd mmm yyyy")).toBe("");
  });
});
