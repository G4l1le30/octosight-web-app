import { cn, formatDateTime } from "@/lib/utils";

describe("cn utility", () => {
  it("merges class names", () => {
    expect(cn("px-4", "py-2")).toBe("px-4 py-2");
  });

  it("handles conditional classes", () => {
    const result = cn("base", false && "hidden", "visible");
    expect(result).toBe("base visible");
  });

  it("resolves tailwind conflicts (last wins)", () => {
    expect(cn("px-4", "px-6")).toBe("px-6");
  });
});

describe("formatDateTime", () => {
  it("formats ISO date correctly", () => {
    const result = formatDateTime("2026-05-29T10:30:00Z");
    expect(result.date).toBeDefined();
    expect(result.time).toBeDefined();
    expect(result.full).toContain("2026");
  });

  it("handles null gracefully", () => {
    const result = formatDateTime(null);
    expect(result.date).toBe("-");
    expect(result.time).toBe("-");
    expect(result.full).toBe("-");
  });
});
