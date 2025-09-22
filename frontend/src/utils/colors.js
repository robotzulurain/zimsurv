export const palette = {
  tests: "#4f46e5",        // indigo
  resistant: "#dc2626",    // red
  susceptible: "#16a34a",  // green
  neutral: "#6b7280",      // gray
};

export function pctToColor(pctR = 0) {
  // 0–30% green, 31–60% amber, >60% red
  if (pctR <= 30) return "#16a34a";
  if (pctR <= 60) return "#f59e0b";
  return "#dc2626";
}
