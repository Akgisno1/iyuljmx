"use client";

import * as React from "react";
import { Area, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useWindData } from "@/context/WindDataContext";

const chartConfig = {
  actual: {
    label: "Actual Wind (MW)",
    color: "#10b981",
  },
  forecast: {
    label: "Day-Ahead Forecast (MW)",
    color: "#64748b",
  },
};

export function OverviewArea() {
  const { data, fetchedRange } = useWindData();
  const items = data?.items || [];
  const chartWidthPx = Math.max(items.length * 14, 900);

  return (
    <Card className="gap-0 rounded-[0.6vw] border-emerald-500/35 py-0 shadow-sm shadow-emerald-500/15">
      <CardHeader className="flex flex-row items-center justify-between gap-[1vw] border-b border-emerald-500/20 px-[1.2vw] py-[0.9vw]">
        <div className="flex flex-col gap-[0.2vw]">
          <CardTitle className="text-[1.05vw] font-semibold">
            Actual vs. Day-Ahead Forecast
          </CardTitle>
          <CardDescription className="text-[0.8vw]">
            Fetched: {fetchedRange.from} to {fetchedRange.to}
          </CardDescription>
        </div>
        <span className="rounded-[0.4vw] border border-emerald-500/35 bg-emerald-500/15 px-[0.6vw] py-[0.25vw] text-[0.75vw] font-medium text-emerald-400">
          {items.length} slots
        </span>
      </CardHeader>

      <CardContent className="p-[1vw]">
        {items.length === 0 ? (
          <div className="flex h-[18vw] items-center justify-center text-[0.88vw] text-muted-foreground">
            No slots in selected range.
          </div>
        ) : (
          <div className="w-full overflow-x-auto pb-[0.4vw]">
            <div style={{ width: `${chartWidthPx}px`, minWidth: "100%" }}>
              <ChartContainer
                config={chartConfig}
                className="aspect-auto h-[18vw] min-h-[210px] w-full"
              >
                <ComposedChart
                  data={items}
                  margin={{ top: 8, right: 16, left: 4, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="emeraldAreaFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.55} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid vertical={false} />

                  <XAxis
                    dataKey="startTime"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={6}
                    minTickGap={48}
                    tickFormatter={(value) => {
                      const dt = new Date(value);
                      return dt.toLocaleString("en-GB", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZone: "UTC",
                      });
                    }}
                  />

                  <YAxis tickLine={false} axisLine={false} width={52} />

                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        indicator="dot"
                        labelFormatter={(value) => {
                          const dt = new Date(value);
                          return `${dt.toLocaleString("en-GB", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            timeZone: "UTC",
                          })} UTC`;
                        }}
                      />
                    }
                  />

                  <Area
                    dataKey="actual"
                    type="monotone"
                    fill="url(#emeraldAreaFill)"
                    stroke="#10b981"
                    strokeWidth={2}
                  />

                  <Line
                    dataKey="forecast"
                    type="monotone"
                    stroke="#64748b"
                    strokeWidth={1.75}
                    dot={false}
                  />

                  <ChartLegend content={<ChartLegendContent />} />
                </ComposedChart>
              </ChartContainer>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default OverviewArea;