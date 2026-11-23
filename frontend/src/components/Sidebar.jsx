import { Wind } from "lucide-react";
import { cn } from "cn";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  JAN_2026_END,
  JAN_2026_START,
  useWindData,
} from "@/context/WindDataContext";
import { TABS } from "@/lib/tabs";
import { coverage } from "@/lib/wind";

const PRESETS = [
  { id: "month", label: "All", days: 31 },
  { id: "14d", label: "14d", days: 14 },
  { id: "7d", label: "7d", days: 7 },
];

function presetRange(days) {
  const totalDays = JAN_2026_END.getDate();
  const span = Math.min(days, totalDays);
  return {
    from: new Date(2026, 0, totalDays - span + 1),
    to: JAN_2026_END,
  };
}

export default function Sidebar({ activeTab, setActiveTab }) {
  const { dateRange, setDateRange, fetchedRange, data, loading } = useWindData();
  const stats = coverage(data?.items);

  const activePreset =
    PRESETS.find(
      (preset) =>
        dateRange?.from &&
        dateRange?.to &&
        dateRange.from.getDate() === 31 - preset.days + 1 &&
        dateRange.to.getDate() === 31
    )?.id ?? "custom";

  return (
    <aside className="flex h-full w-[280px] shrink-0 flex-col overflow-hidden border-r bg-background px-4 py-5 max-lg:hidden">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Wind className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-sm font-semibold">UK Wind Forecast</h1>
          <p className="truncate text-xs text-muted-foreground">
            Day-ahead accuracy
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            loading ? "bg-amber-500" : "bg-emerald-500"
          )}
        />
        <span className="truncate tabular-nums">
          {fetchedRange.from} → {fetchedRange.to}
        </span>
      </div>

      <nav className="mt-6">
        <p className="px-2 text-xs text-muted-foreground">Views</p>
        <div className="mt-1.5 space-y-0.5">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                  isActive
                    ? "bg-muted font-medium text-foreground"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </nav>

      <div className="mt-auto rounded-lg border px-3 py-3">
        <div className="flex items-baseline justify-between">
          <p className="text-xs font-medium">January 2026</p>
          <p className="text-xs text-muted-foreground">UTC</p>
        </div>

        <Tabs
          value={activePreset}
          onValueChange={(value) => {
            const preset = PRESETS.find((item) => item.id === value);
            if (preset) setDateRange(presetRange(preset.days));
          }}
          className="mt-2"
        >
          <TabsList className="w-full">
            {PRESETS.map((preset) => (
              <TabsTrigger
                key={preset.id}
                value={preset.id}
                className="px-2 text-xs"
              >
                {preset.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

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
          className="mt-2 w-full bg-transparent p-0 [--cell-size:2rem]"
          classNames={{
            months: "w-full",
            month: "w-full",
            month_caption: "hidden",
            caption_label: "hidden",
            weekday: "w-8 text-[11px] font-normal text-muted-foreground",
            day: "h-8 w-8 p-0",
            day_button:
              "h-8 w-8 rounded-md text-xs text-foreground hover:bg-muted data-[range-middle=true]:bg-emerald-50! data-[range-middle=true]:text-emerald-900!",
            outside: "text-muted-foreground opacity-40",
            selected:
              "bg-primary! text-primary-foreground! font-medium hover:bg-primary!",
            range_start:
              "bg-primary! text-primary-foreground! rounded-l-md! rounded-r-none!",
            range_end:
              "bg-primary! text-primary-foreground! rounded-r-md! rounded-l-none!",
            range_middle: "bg-emerald-50! text-foreground! rounded-none!",
          }}
        />
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground [@media(max-height:720px)]:hidden">
        <span>Matched periods</span>
        <span className="font-medium tabular-nums text-foreground">
          {loading && !data ? "…" : stats.slots}
        </span>
      </div>
    </aside>
  );
}
