import { useMemo } from "react";
import {
  Bar,
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
import { mw, shortfallBands, shortfallStats } from "@/lib/wind";

const chartConfig = {
  count: { label: "Periods", color: "#059669" },
};

/**
 * How often each size of reserve would have been needed. The bars on the right
 * are the expensive hours: few periods, but they set the cover you have to buy.
 */
export function ReserveCurve() {
  const { data } = useWindData();
  const bands = useMemo(() => shortfallBands(data?.items), [data]);
  const stats = useMemo(() => shortfallStats(data?.items), [data]);

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>How much cover was enough</CardTitle>
        <CardDescription>
          Settlement periods by the reserve they needed, in MW.
        </CardDescription>
      </CardHeader>

      <CardContent className="px-2">
        {stats.n === 0 ? (
          <div className="flex h-[240px] items-center justify-center text-sm text-muted-foreground">
            No settlement periods in this window.
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[240px] w-full"
          >
            <ComposedChart
              data={bands}
              margin={{ top: 12, right: 12, left: 0, bottom: 0 }}
            >
              <CartesianGrid stroke="var(--border)" vertical={false} />

              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                width={40}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              />

              <ChartTooltip
                cursor={{ fill: "var(--muted)", fillOpacity: 0.4 }}
                content={
                  <ChartTooltipContent
                    hideIndicator
                    labelFormatter={(value) =>
                      value === "4+"
                        ? "More than 4 GW of cover"
                        : `${value} GW of cover`
                    }
                    formatter={(value, _name, item) =>
                      `${value} periods (${item.payload.share.toFixed(0)}%)`
                    }
                  />
                }
              />

              <Bar
                dataKey="count"
                fill="#059669"
                radius={[3, 3, 0, 0]}
                maxBarSize={48}
              />
            </ComposedChart>
          </ChartContainer>
        )}

        <p className="px-4 pb-3 text-xs leading-relaxed text-muted-foreground">
          {mw(stats.p90)} MW would have covered 90% of periods and {mw(stats.peak)}{" "}
          MW all of them, so the rare right-hand bars are what force the full
          reserve.
        </p>
      </CardContent>
    </Card>
  );
}

export default ReserveCurve;
