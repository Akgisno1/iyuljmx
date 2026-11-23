import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWindData } from "@/context/WindDataContext";

export default function ErrorRisk() {
  const { loading, data, error } = useWindData();

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading error &amp; risk...</p>;
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  const items = data?.items || [];
  const shortfalls = items.filter((row) => row.error < 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Error &amp; Risk Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground">
        <p>Total matched periods: {items.length}</p>
        <p>Under-forecast slots (actual &gt; forecast): {shortfalls.length}</p>
      </CardContent>
    </Card>
  );
}