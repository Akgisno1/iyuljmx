import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWindData } from "@/context/WindDataContext";

export default function SettlementLog() {
  const { loading, data, error } = useWindData();

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading settlement log...</p>;
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  const items = data?.items || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Settlement Log &amp; Data Audit</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-2 pr-4">Slot (UTC)</th>
              <th className="py-2 pr-4">Forecast (MW)</th>
              <th className="py-2 pr-4">Actual (MW)</th>
              <th className="py-2">Error (MW)</th>
            </tr>
          </thead>
          <tbody>
            {items.slice(0, 25).map((row) => (
              <tr key={row.startTime} className="border-b last:border-0">
                <td className="py-2 pr-4">{row.startTime}</td>
                <td className="py-2 pr-4">{row.forecast}</td>
                <td className="py-2 pr-4">{row.actual}</td>
                <td className="py-2">{row.error}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}