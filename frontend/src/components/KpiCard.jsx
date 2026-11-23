import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "cn";

const TONES = {
  default: "text-foreground",
  good: "text-emerald-700",
  caution: "text-amber-700",
  danger: "text-red-600",
};

/** One headline number. Used across the views so the cards match exactly. */
export default function KpiCard({ label, value, unit, hint, tone = "default" }) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle
          className={cn(
            "text-2xl font-semibold tracking-tight tabular-nums",
            TONES[tone] ?? TONES.default
          )}
        >
          {value}
          {unit ? (
            <span className="ml-1 align-baseline text-sm font-normal text-muted-foreground">
              {unit}
            </span>
          ) : null}
        </CardTitle>
      </CardHeader>

      {hint ? (
        <CardContent>
          <p className="text-xs leading-snug text-muted-foreground">{hint}</p>
        </CardContent>
      ) : null}
    </Card>
  );
}
