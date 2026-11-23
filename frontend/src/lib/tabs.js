import {
  BookOpen,
  LayoutDashboard,
  ScrollText,
  TriangleAlert,
} from "lucide-react";

/**
 * Single source of truth for the four views. App, Sidebar and RightSide all
 * read from here so labels, descriptions and deep links never drift apart.
 */
export const TABS = [
  {
    id: "overview",
    label: "Overview",
    title: "Generation overview",
    description:
      "Delivered wind against the day-ahead forecast, settlement period by settlement period.",
    icon: LayoutDashboard,
  },
  {
    id: "risk",
    label: "Error & Risk",
    title: "Forecast error & risk",
    description:
      "How large the misses are, which way they lean, and where the shortfall risk sits.",
    icon: TriangleAlert,
  },
  {
    id: "log",
    label: "Settlement Log",
    title: "Settlement log",
    description:
      "Every matched settlement period with forecast, outturn and the resulting imbalance.",
    icon: ScrollText,
  },
  {
    id: "methodology",
    label: "Methodology",
    title: "Methodology & scope",
    description:
      "Where the numbers come from, how the forecast vintage is chosen, and what is out of scope.",
    icon: BookOpen,
  },
];

export const DEFAULT_TAB = TABS[0].id;

export function getTab(id) {
  return TABS.find((tab) => tab.id === id) ?? TABS[0];
}

export function tabFromHash(hash) {
  const id = String(hash || "").replace(/^#\/?/, "");
  return TABS.some((tab) => tab.id === id) ? id : DEFAULT_TAB;
}
