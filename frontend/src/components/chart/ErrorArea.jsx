import { useMemo } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  ReferenceLine,
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
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { useWindData } from "@/context/WindDataContext";
import {
  EMPTY_ITEMS,
  fmtDayShort,
  fmtDayTime,
  mw,
  signedMw,
  toMs,
} from "@/lib/wind";

const OVER = "#dc2626";
const UNDER = "#059669";
const DAY_MS = 86_400_000;

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

function ErrorTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;

  const over = row.error > 0;

  return (
    <div className="grid min-w-40 gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl">
      <div className="font-medium">{fmtDayTime(row.t)} UTC</div>
      <div className="flex items-center justify-between gap-4">
        <span style={{ color: over ? OVER : UNDER }}>
          {over ? "Forecast too high" : "Forecast too low"}
        </span>
        <span
          className="font-mono font-medium tabular-nums"
          style={{ color: over ? OVER : UNDER }}
        >
          {signedMw(row.error)}
        </span>
      </div>
      <div className="flex items-center justify-between gap-4 text-muted-foreground">
        <span>Delivered</span>
        <span className="font-mono tabular-nums">{mw(row.actual)} MW</span>
      </div>
      <div className="flex items-center justify-between gap-4 text-muted-foreground">
        <span>Forecast</span>
        <span className="font-mono tabular-nums">{mw(row.forecast)} MW</span>
      </div>
    </div>
  );
}

/**
 * The forecast miss itself, one column per settlement period: red where the
 * forecast ran high (cover had to be bought), green where wind beat the
 * forecast (surplus).
 */
export function ErrorArea() {
  const { data } = useWindData();
  const items = data?.items ?? EMPTY_ITEMS;

  const chartData = useMemo(
    () =>
      [...items]
        .sort((a, b) => toMs(a.startTime) - toMs(b.startTime))
        .map((row) => {
          const error = row.error ?? 0;
          return {
            t: toMs(row.startTime),
            over: Math.max(0, error),
            under: Math.min(0, error),
            error,
            actual: row.actual,
            forecast: row.forecast,
          };
        }),
    [items]
  );

  // Dates on the axis, not hours: tick at UTC day starts for anything longer
  // than a few days, thinned so the labels never crowd each other.
  const axis = useMemo(() => {
    if (!chartData.length) return { ticks: undefined, fmt: fmtDayShort };

    const first = chartData[0].t;
    const last = chartData[chartData.length - 1].t;
    if (last - first <= 4 * DAY_MS) return { ticks: undefined, fmt: fmtDayTime };

    const start = new Date(first);
    const dayStart = Date.UTC(
      start.getUTCFullYear(),
      start.getUTCMonth(),
      start.getUTCDate()
    );
    const starts = [];
    for (let t = dayStart; t <= last; t += DAY_MS) {
      if (t >= first) starts.push(t);
    }

    const step = Math.max(1, Math.ceil(starts.length / 8));
    return {
      ticks: starts.filter((_, index) => index % step === 0),
      fmt: fmtDayShort,
    };
  }, [chartData]);

  const counts = useMemo(
    () => ({
      over: chartData.filter((row) => row.error > 0).length,
      under: chartData.filter((row) => row.error < 0).length,
    }),
    [chartData]
  );

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Forecast error across the window</CardTitle>
        <CardDescription>
          Every settlement period, in UTC. Above the line the forecast was too
          high, below it the wind beat the forecast.
        </CardDescription>
      </CardHeader>

      <CardContent className="px-2">
        <div className="flex flex-wrap items-center justify-between gap-3 px-3 pb-1 pt-2">
          <div className="flex items-center gap-4">
            <LegendItem color={OVER} label={`Forecast too high (${counts.over})`} />
            <LegendItem color={UNDER} label={`Forecast too low (${counts.under})`} />
          </div>
          <span className="text-xs tabular-nums text-muted-foreground">
            {chartData.length} periods
          </span>
        </div>

        {chartData.length === 0 ? (
          <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
            No settlement periods in this window.
          </div>
        ) : (
          <ChartContainer
            config={{ error: { label: "Forecast error" } }}
            className="aspect-auto h-[260px] w-full"
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
                ticks={axis.ticks}
                tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                tickFormatter={axis.fmt}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={44}
                tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                tickFormatter={(value) =>
                  Math.abs(value) >= 1000
                    ? `${Math.round(value / 1000)}k`
                    : `${value}`
                }
              />

              <ReferenceLine y={0} stroke="var(--border)" />

              <ChartTooltip content={<ErrorTooltip />} />

              <Area
                dataKey="over"
                type="linear"
                stroke={OVER}
                strokeWidth={1}
                fill={OVER}
                fillOpacity={0.16}
                isAnimationActive={false}
              />
              <Area
                dataKey="under"
                type="linear"
                stroke={UNDER}
                strokeWidth={1}
                fill={UNDER}
                fillOpacity={0.16}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ChartContainer>
        )}

        <p className="px-4 pb-3 text-xs leading-relaxed text-muted-foreground">
          Hover any period for the delivered and forecast figures behind the
          gap.
        </p>
      </CardContent>
    </Card>
  );
}

export default ErrorArea;
