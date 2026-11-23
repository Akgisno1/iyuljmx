import Overview from "@/components/tabs/Overview";
import ErrorRisk from "@/components/tabs/ErrorRisk";
import SettlementLog from "@/components/tabs/SettlementLog";
import Methodology from "@/components/tabs/Methodology";

export default function RightSide({ activeTab }) {
  return (
    <section className="flex h-full w-[78vw] shrink-0 overflow-hidden bg-zinc-950 p-[1.2vw]">
      <div className="flex h-full w-full flex-col overflow-hidden rounded-[0.6vw] border border-emerald-500/40 bg-zinc-900/50 p-[1.2vw] shadow-lg shadow-emerald-500/15">
        {activeTab === "overview" && <Overview />}
        {activeTab === "risk" && <ErrorRisk />}
        {activeTab === "log" && <SettlementLog />}
        {activeTab === "methodology" && <Methodology />}
      </div>
    </section>
  );
}