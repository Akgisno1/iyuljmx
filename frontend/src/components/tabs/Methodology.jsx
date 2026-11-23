import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useWindData } from "@/context/WindDataContext";
import { computeStats } from "@/lib/wind";

function Note({ children }) {
  return (
    <li className="flex gap-2 text-sm leading-relaxed text-muted-foreground">
      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/60" />
      <span>{children}</span>
    </li>
  );
}

function Metric({ name, expression, note }) {
  return (
    <div className="border-b py-2.5 last:border-b-0">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        <span className="text-sm">{name}</span>
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
          {expression}
        </code>
      </div>
      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
        {note}
      </p>
    </div>
  );
}

export default function Methodology() {
  const { data, fetchedRange } = useWindData();
  const stats = computeStats(data?.items);
  const scored = stats?.n ?? 0;

  return (
    <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Data sources</CardTitle>
          <CardDescription>Elexon BMRS API v1, January 2026.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium">FUELHH — actual wind output</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Half-hourly outturn per settlement period, filtered to wind. Treated
              as the truth the forecast is scored against.
            </p>
          </div>

          <div>
            <p className="text-sm font-medium">WINDFOR — forecast vintages</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Hourly wind forecast. Every row carries its publish time, so one
              delivery hour has many versions. That is what makes a day-ahead
              accuracy study possible.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 border-t pt-4">
            {[
              ["Actuals fetched", data?.actuals_fetched],
              ["Forecasts fetched", data?.forecasts_fetched],
              ["Periods scored", scored],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-base font-semibold tabular-nums">
                  {value == null ? "—" : Number(value).toLocaleString("en-GB")}
                </p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>

          <p className="text-xs tabular-nums text-muted-foreground">
            Window {fetchedRange.from} to {fetchedRange.to} UTC.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>How the forecast is chosen</CardTitle>
          <CardDescription>
            One vintage per delivery hour, fixed before the decision.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-2">
            <Note>
              A forecast is eligible for a delivery day when it was published at
              least one hour before midnight UTC at the start of that day.
            </Note>
            <Note>
              When several eligible versions exist for the same hour, the most
              recent is used — the latest information a buyer could see.
            </Note>
            <Note>
              Versions published after the cutoff are ignored even though they
              score better. Using them would be look-ahead bias.
            </Note>
            <Note>
              Each selected forecast is matched to the actual in the same
              settlement period. Unmatched periods are dropped, not filled.
            </Note>
          </ul>

          <p className="rounded-md bg-muted px-3 py-2 text-xs leading-relaxed text-muted-foreground">
            The cutoff is 23:00 UTC on the day before delivery: deliberately
            conservative, the forecast a buyer would hold at the day-ahead gate.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Metric definitions</CardTitle>
          <CardDescription>
            Megawatts throughout. Error = forecast − actual.
          </CardDescription>
        </CardHeader>
        <CardContent className="py-1">
          <Metric
            name="Mean absolute error"
            expression="mean(|F − A|)"
            note="Typical size of the miss, regardless of direction."
          />
          <Metric
            name="Bias"
            expression="mean(F − A)"
            note="Positive means the forecast runs high and creates shortfall risk."
          />
          <Metric
            name="RMSE"
            expression="√mean((F − A)²)"
            note="Punishes large misses. A high RMSE to MAE ratio means a heavy tail."
          />
          <Metric
            name="P90 absolute error"
            expression="90th percentile of |F − A|"
            note="How bad a bad period is, the figure to size reserve against."
          />
          <Metric
            name="Cover for 90% of periods"
            expression="90th percentile of max(0, F − A)"
            note="Backup capacity that would have been enough in nine periods out of ten."
          />
          <Metric
            name="Peak shortfall"
            expression="max(F − A)"
            note="The single largest shortfall exposure in the window."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Scope and limitations</CardTitle>
          <CardDescription>What this pilot answers, and what it does not.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-2">
            <Note>
              National wind only. There is no demand or other fuel data here, so
              this is not a thermal procurement gap.
            </Note>
            <Note>
              Actuals are half-hourly while forecasts are hourly, so only the{" "}
              {scored.toLocaleString("en-GB")} on-the-hour periods of 1,488 can
              be scored.
            </Note>
            <Note>
              Each load calls Elexon, so a full month takes a few seconds.
            </Note>
            <Note>
              Accuracy depends on the chosen cutoff. Move it and every metric
              shifts, which is expected.
            </Note>
          </ul>

          <p className="rounded-md bg-muted px-3 py-2 text-xs leading-relaxed text-muted-foreground">
            How to read it: MAE says how wrong, bias says which way, P90 says how
            bad it gets. Size cover above the forecast by at least the bias and
            hold reserve for the P90 case.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
