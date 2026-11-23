import { useEffect, useMemo, useState } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardAction,
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWindData } from "@/context/WindDataContext";
import {
  EMPTY_ITEMS,
  fmtDayShort,
  fmtDayTime,
  groupByDay,
  toMs,
} from "@/lib/wind";

const chartConfig = {
  actual: { label: "Delivered", color: "#059669" },
  forecast: { label: "Day-ahead forecast", color: "#64748b" },
};

function LegendItem({ color, label }) {
  return (
    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <span
        className="h-2 w-2 rounded-sm"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}

export function OverviewArea() {
  const { data, fetchedRange } = useWindData();
  const items = data?.items ?? EMPTY_ITEMS;

  const [resolution, setResolution] = useState(
    items.length > 96 ? "day" : "hour"
  );

  useEffect(() => {
    setResolution(items.length > 96 ? "day" : "hour");
    // Only when a different window is loaded, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchedRange.from, fetchedRange.to]);

  const chartData = useMemo(() => {
    const sorted = [...items].sort(
      (a, b) => toMs(a.startTime) - toMs(b.startTime)
    );

    if (resolution === "day") {
      return groupByDay(sorted).map((day) => ({
        t: day.ms,
        actual: Number(day.meanActual.toFixed(1)),
        forecast: Number(day.meanForecast.toFixed(1)),
      }));
    }

    return sorted.map((row) => ({
      t: toMs(row.startTime),
      actual: row.actual,
      forecast: row.forecast,
    }));
  }, [items, resolution]);

  const peak = useMemo(
    () => Math.max(0, ...items.map((row) => row.actual ?? 0)),
    [items]
  );

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Wind delivered against the day-ahead forecast</CardTitle>
        <CardDescription>
          {resolution === "day"
            ? "Daily mean generation for the selected window."
            : "Every matched settlement period, in UTC."}
        </CardDescription>
        <CardAction>
          <Tabs value={resolution} onValueChange={setResolution}>
            <TabsList>
              <TabsTrigger value="hour">Hourly</TabsTrigger>
              <TabsTrigger value="day">Daily</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardAction>
      </CardHeader>

      <CardContent className="px-2">
        <div className="flex flex-wrap items-center justify-between gap-3 px-3 pb-1 pt-2">
          <div className="flex items-center gap-4">
            <LegendItem color={chartConfig.actual.color} label="Delivered" />
            <LegendItem color={chartConfig.forecast.color} label="Forecast" />
          </div>
          <div className="flex items-center gap-4 text-xs tabular-nums text-muted-foreground">
            <span>Peak {Math.round(peak).toLocaleString("en-GB")} MW</span>
            <span>
              {chartData.length} {resolution === "day" ? "days" : "periods"}
            </span>
          </div>
        </div>

        {chartData.length === 0 ? (
          <div className="flex h-[320px] items-center justify-center text-sm text-muted-foreground">
            No settlement periods in this window.
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[320px] w-full"
          >
            <ComposedChart
              data={chartData}
              margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
            >
              <CartesianGrid stroke="var(--border)" vertical={false} />

              <XAxis
                dataKey="t"
                type="number"
                scale="time"
                domain={["dataMin", "dataMax"]}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={44}
                tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                tickFormatter={resolution === "day" ? fmtDayShort : fmtDayTime}
              />

              <YAxis
                tickLine={false}
                axisLine={false}
                width={44}
                domain={[0, "auto"]}
                tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                tickFormatter={(value) =>
                  value >= 1000 ? `${Math.round(value / 1000)}k` : `${value}`
                }
              />

              <ChartTooltip
                cursor={{ stroke: "var(--border)" }}
                content={
                  <ChartTooltipContent
                    indicator="dot"
                    labelFormatter={(value) =>
                      resolution === "day"
                        ? new Date(Number(value)).toLocaleDateString("en-GB", {
                            weekday: "short",
                            day: "2-digit",
                            month: "short",
                            timeZone: "UTC",
                          })
                        : `${fmtDayTime(Number(value))} UTC`
                    }
                  />
                }
              />

              <Area
                dataKey="actual"
                type="monotone"
                fill="#059669"
                fillOpacity={0.12}
                stroke="#059669"
                strokeWidth={2}
                activeDot={{ r: 3, strokeWidth: 0 }}
              />

              <Line
                dataKey="forecast"
                type="monotone"
                stroke="#64748b"
                strokeWidth={1.5}
                strokeDasharray="4 3"
                dot={false}
                activeDot={{ r: 3, strokeWidth: 0 }}
              />
            </ComposedChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

export default OverviewArea;
