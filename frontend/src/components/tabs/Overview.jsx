import { OverviewArea } from "@/components/chart/OverviewArea";
import { useWindData } from "@/context/WindDataContext";

export default function Overview() {
  const { loading, data, error } = useWindData();

  if (loading) {
    return <p className="text-[0.9vw] text-zinc-400">Loading overview...</p>;
  }

  if (error) {
    return <p className="text-[0.9vw] text-red-400">{error}</p>;
  }

  const items = data?.items || [];
  const shortfalls = items.map((row) =>
    Math.max(0, (row.actual ?? 0) - (row.forecast ?? 0))
  );
  const avgBackupMw =
    shortfalls.length > 0
      ? (shortfalls.reduce((a, b) => a + b, 0) / shortfalls.length).toFixed(1)
      : "0.0";
  const maxBackupMw =
    shortfalls.length > 0 ? Math.max(...shortfalls).toFixed(1) : "0.0";
  const avgError =
    items.length > 0
      ? (items.reduce((sum, row) => sum + (row.error ?? 0), 0) / items.length).toFixed(
          1
        )
      : "0.0";

  return (
    <div className="flex h-full w-full flex-col justify-between gap-[1vw] overflow-hidden">
      <OverviewArea />

      <div className="grid grid-cols-4 gap-[1vw] shrink-0">
        <div className="rounded-[0.5vw] border border-emerald-500/35 bg-zinc-950/80 p-[0.9vw] shadow-sm shadow-emerald-500/10">
          <p className="text-[0.78vw] font-medium text-zinc-400">MAE</p>
          <p className="mt-[0.25vw] text-[1.3vw] font-bold text-emerald-400">
            {data?.mae ?? 0} MW
          </p>
        </div>

        <div className="rounded-[0.5vw] border border-emerald-500/35 bg-zinc-950/80 p-[0.9vw] shadow-sm shadow-emerald-500/10">
          <p className="text-[0.78vw] font-medium text-zinc-400">
            Avg. Backup Needed
          </p>
          <p className="mt-[0.25vw] text-[1.3vw] font-bold text-white">
            {avgBackupMw} MW
          </p>
        </div>

        <div className="rounded-[0.5vw] border border-emerald-500/35 bg-zinc-950/80 p-[0.9vw] shadow-sm shadow-emerald-500/10">
          <p className="text-[0.78vw] font-medium text-zinc-400">
            Peak Shortfall
          </p>
          <p className="mt-[0.25vw] text-[1.3vw] font-bold text-white">
            {maxBackupMw} MW
          </p>
        </div>

        <div className="rounded-[0.5vw] border border-emerald-500/35 bg-zinc-950/80 p-[0.9vw] shadow-sm shadow-emerald-500/10">
          <p className="text-[0.78vw] font-medium text-zinc-400">
            Mean Bias (F - A)
          </p>
          <p className="mt-[0.25vw] text-[1.3vw] font-bold text-white">
            {avgError} MW
          </p>
        </div>
      </div>
    </div>
  );
}