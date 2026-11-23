import { useMemo, useState } from "react";
import { ArrowDownWideNarrow } from "lucide-react";
import { cn } from "cn";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWindData } from "@/context/WindDataContext";
import {
  EMPTY_ITEMS,
  computeStats,
  fmtHour,
  isoDayLabel,
  mw,
  mw1,
  mwh,
  pct,
  toMs,
} from "@/lib/wind";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "over", label: "Over-forecast" },
  { id: "under", label: "Under-forecast" },
];

function Summary({ label, value, unit, note, className }) {
  return (
    <div className={cn("min-w-0", className)}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums">
        {value}
        {unit ? (
          <span className="ml-1 text-xs font-normal text-muted-foreground">
            {unit}
          </span>
        ) : null}
      </p>
      <p className="mt-0.5 truncate text-xs text-muted-foreground">{note}</p>
    </div>
  );
}

export default function SettlementLog() {
  const { data } = useWindData();
  const items = data?.items ?? EMPTY_ITEMS;
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("time");

  const stats = useMemo(() => computeStats(items), [items]);

  const rows = useMemo(() => {
    const filtered = items.filter((row) => {
      if (filter === "over") return (row.error ?? 0) > 0;
      if (filter === "under") return (row.error ?? 0) < 0;
      return true;
    });

    return [...filtered].sort((a, b) => {
      if (sort === "worst") {
        return Math.abs(b.error ?? 0) - Math.abs(a.error ?? 0);
      }
      return toMs(a.startTime) - toMs(b.startTime);
    });
  }, [items, filter, sort]);

  if (!stats) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          No settlement periods in this window.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card size="sm" className="py-0">
        <div className="grid grid-cols-2 gap-x-6 gap-y-5 px-5 py-4 sm:grid-cols-3 lg:grid-cols-5">
          <Summary
            label="Matched periods"
            value={stats.n}
            note={`${stats.days} delivery days`}
          />
          <Summary
            label="Delivered energy"
            value={mwh(stats.actualMwh)}
            unit="MWh"
            note={`average ${mw(stats.meanActual)} MW`}
          />
          <Summary
            label="Forecast energy"
            value={mwh(stats.forecastMwh)}
            unit="MWh"
            note={`average ${mw(stats.meanForecast)} MW`}
          />
          <Summary
            label="Net imbalance"
            value={mwh(Math.abs(stats.netMwh))}
            unit="MWh"
            note={stats.netMwh >= 0 ? "forecast above outturn" : "outturn above forecast"}
          />
          <Summary
            label="Mean absolute error"
            value={mw(stats.mae)}
            unit="MW"
            note={`${pct(stats.meanAbsPct)} of outturn`}
          />
        </div>
      </Card>

      <Card className="pb-0">
        <CardHeader className="border-b">
          <CardTitle>Settlement period ledger</CardTitle>
          <CardDescription>
            {rows.length} half-hourly GB settlement periods, in UTC.
          </CardDescription>

          <CardAction className="flex flex-wrap items-center justify-end gap-2">
            <Tabs value={filter} onValueChange={setFilter}>
              <TabsList>
                {FILTERS.map((option) => (
                  <TabsTrigger key={option.id} value={option.id}>
                    {option.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setSort((current) => (current === "time" ? "worst" : "time"))
              }
            >
              <ArrowDownWideNarrow />
              {sort === "time" ? "Chronological" : "Largest error"}
            </Button>
          </CardAction>
        </CardHeader>

        <div className="thin-scrollbar max-h-[540px] overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-card">
              <tr className="border-b text-xs text-muted-foreground">
                <th className="px-5 py-2.5 text-left font-medium">Day</th>
                <th className="px-3 py-2.5 text-left font-medium">Period</th>
                <th className="px-3 py-2.5 text-right font-medium">Forecast</th>
                <th className="px-3 py-2.5 text-right font-medium">Delivered</th>
                <th className="px-3 py-2.5 text-right font-medium">
                  Error (F − A)
                </th>
                <th className="px-5 py-2.5 text-right font-medium">|Error| %</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {rows.map((row) => {
                const error = row.error ?? 0;
                const share =
                  (row.actual ?? 0) > 50
                    ? (Math.abs(error) / row.actual) * 100
                    : null;

                return (
                  <tr
                    key={row.startTime}
                    className="border-b text-foreground last:border-0 hover:bg-muted/50"
                  >
                    <td className="whitespace-nowrap px-5 py-2 text-muted-foreground">
                      {isoDayLabel(String(row.startTime).slice(0, 10))}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 font-medium">
                      {fmtHour(toMs(row.startTime))}
                    </td>
                    <td className="px-3 py-2 text-right">{mw(row.forecast)}</td>
                    <td className="px-3 py-2 text-right">{mw(row.actual)}</td>
                    <td
                      className={cn(
                        "px-3 py-2 text-right font-medium",
                        error > 0 ? "text-amber-700" : "text-emerald-700"
                      )}
                    >
                      {error > 0 ? "+" : error < 0 ? "−" : ""}
                      {mw(Math.abs(error))}
                    </td>
                    <td className="px-5 py-2 text-right text-muted-foreground">
                      {share == null ? "—" : `${mw1(share)}%`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {rows.length === 0 && (
            <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
              Nothing matches this filter.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
