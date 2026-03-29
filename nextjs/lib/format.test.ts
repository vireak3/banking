import { formatCurrency, formatDate, truncateHash } from "@/lib/format";

describe("format helpers", () => {
  it("formats USD balances with two decimals", () => {
    expect(formatCurrency(1234.5)).toBe("$1,234.50");
  });

  it("returns a fallback when the date is missing or invalid", () => {
    expect(formatDate(undefined)).toBe("Unavailable");
    expect(formatDate("not-a-date", "Not synced")).toBe("Not synced");
  });

  it("truncates long hashes without changing short ones", () => {
    expect(truncateHash("abcd", 2)).toBe("abcd");
    expect(truncateHash("1234567890abcdefghij", 4)).toBe("1234...ghij");
  });
});