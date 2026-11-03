const compact = new Intl.NumberFormat("en", { notation: "compact" });

// 1200 -> "1.2K"
export function formatCount(value: number) {
  return compact.format(value);
}
