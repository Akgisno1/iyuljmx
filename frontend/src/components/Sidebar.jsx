import { Wind } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  JAN_2026_END,
  JAN_2026_START,
  useWindData,
} from "@/context/WindDataContext";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "risk", label: "Error & Risk" },
  { id: "log", label: "Settlement Log" },
  { id: "methodology", label: "Methodology" },
];

export default function Sidebar({ activeTab, setActiveTab }) {
  const { dateRange, setDateRange, fetchedRange } = useWindData();

  return (
    <aside className="flex h-full w-[22vw] shrink-0 flex-col justify-between overflow-hidden border-r border-emerald-500/40 bg-zinc-950 p-[1.2vw] text-zinc-100">
      <div className="flex flex-col gap-[1.1vw]">
        <div className="flex items-center gap-[0.65vw] border-b border-emerald-500/20 pb-[0.9vw]">
          <div className="flex h-[2.2vw] w-[2.2vw] shrink-0 items-center justify-center rounded-[0.45vw] bg-emerald-500 text-zinc-950 shadow-sm shadow-emerald-500/40">
            <Wind className="h-[1.2vw] w-[1.2vw] stroke-[2.4]" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-[1.1vw] font-semibold leading-none tracking-tight text-white">
              UK Wind Forecast
            </h1>
            <p className="mt-[0.3vw] truncate text-[0.7vw] font-medium text-emerald-400">
              {fetchedRange.from} → {fetchedRange.to}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-[0.45vw]">
          <span className="px-[0.3vw] text-[0.7vw] font-semibold uppercase tracking-widest text-emerald-400/80">
            Tabs
          </span>

          <div className="flex flex-col gap-[0.35vw]">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex w-full items-center justify-between rounded-[0.45vw] px-[0.85vw] py-[0.55vw] text-left text-[0.88vw] font-medium transition-colors ${
                    isActive
                      ? "bg-emerald-500 text-zinc-950 font-semibold shadow-sm shadow-emerald-500/30"
                      : "bg-zinc-900/70 text-zinc-300 hover:bg-emerald-500/15 hover:text-emerald-300"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`h-[0.45vw] w-[0.45vw] rounded-full ${
                      isActive ? "bg-zinc-950" : "bg-emerald-500/40"
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="rounded-[0.55vw] border border-emerald-500/35 bg-zinc-900/80 p-[0.65vw] shadow-inner shadow-emerald-500/10">
        <div className="mb-[0.35vw] flex items-center justify-between px-[0.2vw]">
          <span className="text-[0.72vw] font-semibold text-emerald-400">
            January 2026
          </span>
          <span className="text-[0.65vw] text-zinc-400">Select Range</span>
        </div>

        <Calendar
          mode="range"
          month={JAN_2026_START}
          disableNavigation
          fromDate={JAN_2026_START}
          toDate={JAN_2026_END}
          selected={dateRange}
          onSelect={(range) => {
            if (range?.from) {
              setDateRange({ from: range.from, to: range.to || range.from });
            }
          }}
          className="w-full bg-transparent p-0 text-[0.7vw] [--cell-size:1.5vw]"
          classNames={{
            months: "w-full",
            month: "w-full space-y-[0.25vw]",
            caption_label: "text-[0.76vw] font-semibold text-zinc-200",
            weekday: "w-[1.5vw] text-[0.65vw] font-medium text-zinc-400",
            day: "h-[1.5vw] w-[1.5vw] p-0 text-[0.7vw]",
            day_button:
              "h-[1.5vw] w-[1.5vw] rounded-[0.3vw] text-[0.7vw] text-zinc-200 hover:bg-emerald-500/30",
            selected:
              "!bg-emerald-500 !text-zinc-950 !font-semibold hover:!bg-emerald-500 hover:!text-zinc-950",
            range_start:
              "!bg-emerald-500 !text-zinc-950 !font-semibold rounded-l-[0.3vw] rounded-r-none",
            range_end:
              "!bg-emerald-500 !text-zinc-950 !font-semibold rounded-r-[0.3vw] rounded-l-none",
            range_middle:
              "!bg-emerald-500/25 !text-emerald-200 rounded-none",
          }}
        />
      </div>
    </aside>
  );
}