import { useMemo } from "react";
import { cn } from "cn";
import KpiCard from "@/components/KpiCard";
import { ErrorArea } from "@/components/chart/ErrorArea";
import { ReserveCurve } from "@/components/chart/ReserveCurve";
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
  byWindLevel,
  mw,
  pct,
  shortfallStats,
  signedMw,
  worstDays,
} from "@/lib/wind";

function EmptyState({ children }) {
  return (
    <Card>
      <CardContent className="py-12 text-center text-sm text-muted-foreground">
        {children}
      </CardContent>
    </Card>
  );
}

export default function ErrorRisk() {
  const { data } = useWindData();
  const items = data?.items ?? EMPTY_ITEMS;

  const stats = useMemo(() => shortfallStats(items), [items]);
  const levels = useMemo(() => byWindLevel(items), [items]);
  const days = useMemo(() => worstDays(items, 6), [items]);

  if (!items.length) {
    return (
      <EmptyState>
        No settlement periods in this window, so there is no exposure to size.
      </EmptyState>
    );
  }

  return (
    <div className="space-y-4">
      <ErrorArea />

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard
          label="Cover for 90% of periods"
          value={mw(stats.p90)}
          unit="MW"
          hint={`Half of all periods needed under ${mw(stats.p50)} MW`}
        />
        <KpiCard
          label="Worst shortfall"
          value={mw(stats.peak)}
          unit="MW"
          tone="danger"
          hint="Largest gap between the forecast and delivered wind"
        />
        <KpiCard
          label="Periods more than 3 GW short"
          value={stats.over3}
          unit={`of ${stats.n}`}
          tone="caution"
          hint={`${pct(stats.over3Share)} of the window — the costly hours`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <ReserveCurve />
        </div>

        <Card className="lg:col-span-2">
          <CardHeader className="border-b">
            <CardTitle>Accuracy by wind level</CardTitle>
            <CardDescription>
              A 2 GW miss is routine at high output and serious at low output.
            </CardDescription>
          </CardHeader>

          <CardContent className="px-0 pb-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground">
                  <th className="px-4 py-2 text-left font-medium">Delivered</th>
                  <th className="px-2 py-2 text-right font-medium">Periods</th>
                  <th className="px-2 py-2 text-right font-medium">MAE</th>
                  <th className="px-4 py-2 text-right font-medium">Bias</th>
                </tr>
              </thead>
              <tbody>
                {levels.map((level) => (
                  <tr key={level.id} className="border-t">
                    <td className="px-4 py-2.5">{level.label}</td>
                    <td className="px-2 py-2.5 text-right tabular-nums text-muted-foreground">
                      {level.n}
                      <span className="ml-1 text-xs">
                        ({pct(level.share, 0)})
                      </span>
                    </td>
                    <td className="px-2 py-2.5 text-right tabular-nums">
                      {mw(level.mae)}
                    </td>
                    <td
                      className={cn(
                        "px-4 py-2.5 text-right tabular-nums",
                        level.bias > 0 ? "text-amber-700" : "text-emerald-700"
                      )}
                    >
                      {signedMw(level.bias)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <p className="border-t px-4 py-3 text-xs leading-relaxed text-muted-foreground">
              Bias in a row is the useful part: a positive figure means the
              forecast was too high at that output level, which is where cover
              is bought.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Worst delivery days</CardTitle>
          <CardDescription>
            Ranked by the peak shortfall inside the day, not by average error.
          </CardDescription>
        </CardHeader>

        <CardContent className="px-0 pb-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground">
                <th className="px-4 py-2 text-left font-medium">Delivery day</th>
                <th className="px-4 py-2 text-right font-medium">MAE</th>
                <th className="px-4 py-2 text-right font-medium">Bias</th>
                <th className="px-4 py-2 text-right font-medium">
                  Peak shortfall
                </th>
                <th className="px-4 py-2 text-right font-medium">
                  Over-forecast
                </th>
              </tr>
            </thead>
            <tbody>
              {days.map((day) => (
                <tr key={day.key} className="border-t">
                  <td className="px-4 py-2.5">{day.label}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">
                    {mw(day.mae)} MW
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-amber-700">
                    {signedMw(day.bias)}
                  </td>
                  <td className="px-4 py-2.5 text-right font-medium tabular-nums">
                    {mw(day.peakShortfall)} MW
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                    {pct(day.overShare, 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
