import { useMemo } from "react";
import KpiCard from "@/components/KpiCard";
import { OverviewArea } from "@/components/chart/OverviewArea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useWindData } from "@/context/WindDataContext";
import {
  EMPTY_ITEMS,
  computeStats,
  fmtDayTime,
  groupByDay,
  mw,
  pct,
  signedMw,
  toMs,
} from "@/lib/wind";

function Reading({ label, value, note }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm font-medium tabular-nums">{value}</dd>
      <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{note}</p>
    </div>
  );
}

export default function Overview() {
  const { data } = useWindData();
  const items = data?.items ?? EMPTY_ITEMS;

  const stats = useMemo(() => computeStats(items), [items]);
  const days = useMemo(() => groupByDay(items), [items]);

  if (!stats) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          No settlement periods in this window.
        </CardContent>
      </Card>
    );
  }

  const peakPeriod = items.reduce(
    (worst, row) => ((row.error ?? 0) > (worst.error ?? 0) ? row : worst),
    items[0]
  );

  const worstDay = days.reduce(
    (worst, day) => (day.mae > (worst?.mae ?? -1) ? day : worst),
    null
  );

  return (
    <div className="space-y-4">
      <OverviewArea />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="Mean absolute error"
          value={mw(stats.mae)}
          unit="MW"
          hint={`${pct(stats.meanAbsPct)} of delivered wind`}
        />
        <KpiCard
          label="Average backup needed"
          value={mw(stats.backupNeeded)}
          unit="MW"
          hint="Mean shortfall across the window"
        />
        <KpiCard
          label="Peak shortfall"
          value={mw(stats.peakShortfall)}
          unit="MW"
          tone="danger"
          hint={fmtDayTime(toMs(peakPeriod.startTime))}
        />
        <KpiCard
          label="Mean bias (forecast − actual)"
          value={signedMw(stats.bias)}
          tone={stats.bias > 0 ? "caution" : "good"}
          hint={
            stats.bias > 0
              ? "Forecast runs high, so plan extra cover"
              : "Forecast runs low, so expect surplus wind"
          }
        />
      </div>

      <Card size="sm">
        <CardHeader className="border-b">
          <CardTitle>At a glance</CardTitle>
          <CardDescription>
            Three things worth knowing before reading the chart.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-6 sm:grid-cols-3">
            <Reading
              label="Periods scored"
              value={`${stats.n.toLocaleString("en-GB")} of ${(
                stats.days * 48
              ).toLocaleString("en-GB")}`}
              note="Half-hours with both an actual and a day-ahead forecast."
            />
            <Reading
              label="Forecast lean"
              value={`${pct(stats.overShare)} over-forecast`}
              note={`${stats.over} periods above outturn, ${stats.under} below.`}
            />
            <Reading
              label="Worst delivery day"
              value={worstDay ? `${worstDay.label} · ${mw(worstDay.mae)} MW` : "—"}
              note={
                worstDay
                  ? `Bias ${signedMw(worstDay.bias)}, largest miss ${mw(
                      worstDay.maxAbs
                    )} MW.`
                  : "—"
              }
            />
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
