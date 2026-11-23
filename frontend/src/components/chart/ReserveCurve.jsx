import { useMemo } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useWindData } from "@/context/WindDataContext";
import { mw, shortfallCurve, shortfallStats } from "@/lib/wind";

const chartConfig = {
  coveredPct: { label: "Periods covered", color: "#059669" },
};

const formatMw = (value) =>
  value >= 1000 ? `${(value / 1000).toFixed(1)}k` : `${value}`;

/**
 * Answers the question the risk view exists for: how much backup cover would
 * have been enough, and how often. Each point is a level of reserve in MW and
 * the share of settlement periods it would have covered outright.
 */
export function ReserveCurve() {
  const { data } = useWindData();
  const curve = useMemo(() => shortfallCurve(data?.items), [data]);
  const stats = useMemo(() => shortfallStats(data?.items), [data]);

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>How much cover was enough</CardTitle>
        <CardDescription>
          Share of settlement periods fully covered at each level of backup.
        </CardDescription>
      </CardHeader>

      <CardContent className="px-2">
        {curve.length === 0 ? (
          <div className="flex h-[240px] items-center justify-center text-sm text-muted-foreground">
            No settlement periods in this window.
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[240px] w-full"
          >
            <ComposedChart
              data={curve}
              margin={{ top: 12, right: 12, left: 0, bottom: 0 }}
            >
              <CartesianGrid stroke="var(--border)" vertical={false} />

              <XAxis
                dataKey="cover"
                type="number"
                domain={[0, "dataMax"]}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                tickFormatter={formatMw}
              />
              <YAxis
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
                tickLine={false}
                axisLine={false}
                width={40}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                tickFormatter={(value) => `${value}%`}
              />

              <ChartTooltip
                cursor={{ stroke: "var(--border)" }}
                content={
                  <ChartTooltipContent
                    indicator="dot"
                    labelFormatter={(value) => `${mw(Number(value))} MW of cover`}
                    formatter={(value) => `${value}% of periods`}
                  />
                }
              />

              <Area
                dataKey="coveredPct"
                type="stepAfter"
                fill="#059669"
                fillOpacity={0.1}
                stroke="#059669"
                strokeWidth={2}
                dot={false}
              />
            </ComposedChart>
          </ChartContainer>
        )}

        <p className="px-4 pb-3 text-xs leading-relaxed text-muted-foreground">
          {mw(stats.p90)} MW covers 90% of periods, {mw(stats.peak)} MW covers
          all of them. The flat top means the last few periods cost far more
          cover than the rest.
        </p>
      </CardContent>
    </Card>
  );
}

export default ReserveCurve;
