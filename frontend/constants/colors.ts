export const RISK = {
  low: { hex: "#eab308", label: "yellow" },
  medium: { hex: "#f97316", label: "orange" },
  high: { hex: "#e31e24", label: "red" },
} as const;

export function getRiskLevel(score: number): keyof typeof RISK {
  if (score >= 75) return "high";
  if (score >= 35) return "medium";
  return "low";
}

export function getRiskHex(score: number): string {
  return RISK[getRiskLevel(score)].hex;
}
