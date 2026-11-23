import { CircleAlert, RefreshCw } from "lucide-react";
import { cn } from "cn";
import ErrorRisk from "@/components/tabs/ErrorRisk";
import Methodology from "@/components/tabs/Methodology";
import Overview from "@/components/tabs/Overview";
import SettlementLog from "@/components/tabs/SettlementLog";
import { TabSkeleton } from "@/components/TabSkeletons";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWindData } from "@/context/WindDataContext";
import { TABS } from "@/lib/tabs";
import { formatRange } from "@/lib/wind";

const VIEWS = {
  overview: Overview,
  risk: ErrorRisk,
  log: SettlementLog,
  methodology: Methodology,
};

function ErrorCard({ message, onRetry }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CircleAlert className="h-4 w-4 text-red-600" />
          Could not load the forecast data
        </CardTitle>
        <CardDescription>{message}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw />
          Try again
        </Button>
      </CardContent>
    </Card>
  );
}

export default function RightSide({ activeTab, setActiveTab, tab }) {
  const { loading, data, error, fetchedRange, updatedAt, refresh } =
    useWindData();

  const View = VIEWS[activeTab] ?? Overview;
  const firstLoad = loading && !data;
  const refreshing = loading && Boolean(data);

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col bg-muted/40">
      {/* Narrow screens hide the sidebar, so the views move up here. */}
      <div className="border-b bg-background px-4 py-2 lg:hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full">
            {TABS.map((item) => (
              <TabsTrigger key={item.id} value={item.id} className="text-xs">
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="thin-scrollbar flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[1200px] px-5 py-6 lg:px-8">
          <header className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-2xl font-semibold tracking-tight">
                {tab?.title}
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                {tab?.description}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-xs tabular-nums">{formatRange(fetchedRange.from, fetchedRange.to)}</p>
                <p className="text-xs text-muted-foreground">Live from Elexon</p>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={refresh}
                disabled={loading}
                title="Reload data"
              >
                <RefreshCw className={cn(refreshing && "animate-spin")} />
                <span className="sr-only">Reload data</span>
              </Button>
            </div>
          </header>

          {error && data && (
            <div className="mt-4 flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              <CircleAlert className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">
                Reload failed ({error}) — showing the last successful load.
              </span>
            </div>
          )}

          <div className="mt-6">
            {firstLoad ? (
              <TabSkeleton tab={activeTab} />
            ) : error && !data ? (
              <ErrorCard message={error} onRetry={refresh} />
            ) : (
              <View />
            )}
          </div>

          <footer className="mt-8 flex flex-wrap items-center justify-between gap-2 border-t pt-4 text-xs text-muted-foreground">
            <span>Elexon BMRS · FUELHH actuals vs WINDFOR day-ahead</span>
            <span className="tabular-nums">
              {updatedAt
                ? `Loaded ${updatedAt.toLocaleTimeString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}`
                : "Connecting…"}
            </span>
          </footer>
        </div>
      </div>
    </div>
  );
}
