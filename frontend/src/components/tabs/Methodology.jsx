import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Methodology() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Day-Ahead Forecast Selection Rules</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground">
        <p>Actuals come from Elexon FUELHH (fuelType=WIND) at 30-minute intervals.</p>
        <p>
          Day-ahead forecasts come from Elexon WINDFOR using the latest forecast
          published before the pre-delivery cutoff.
        </p>
      </CardContent>
    </Card>
  );
}