import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function KpiRow({ count = 4 }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} size="sm">
          <CardHeader>
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-1 h-6 w-20" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-3 w-28" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ChartCard({ height = 320 }) {
  return (
    <Card>
      <CardHeader className="border-b">
        <Skeleton className="h-4 w-56" />
        <Skeleton className="mt-1 h-3 w-72" />
      </CardHeader>
      <CardContent className="px-6">
        <div
          className="flex items-end gap-2 pt-4"
          style={{ height: `${height - 40}px` }}
        >
          {[42, 60, 38, 74, 62, 86, 50, 68, 44, 78, 56, 66].map(
            (barHeight, index) => (
              <Skeleton
                key={index}
                className="flex-1 rounded-sm"
                style={{ height: `${barHeight}%` }}
              />
            )
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function TabSkeleton({ tab }) {
  if (tab === "methodology") {
    return (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardHeader className="border-b">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="mt-1 h-3 w-56" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-11/12" />
              <Skeleton className="h-3 w-3/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ChartCard height={360} />
      <KpiRow />
    </div>
  );
}
