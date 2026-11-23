import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import RightSide from "@/components/RightSide";
import {
  JAN_2026_END,
  JAN_2026_START,
  WindDataProvider,
  useWindData,
} from "@/context/WindDataContext";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(
  /\/+$/,
  ""
);

function formatIsoDate(dt) {
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const d = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function WindShell() {
  const [activeTab, setActiveTab] = useState("overview");
  const { setLoading, setData, setError, dateRange, setFetchedRange } =
    useWindData();

  const startIso = formatIsoDate(dateRange?.from || JAN_2026_START);
  const endIso = formatIsoDate(dateRange?.to || dateRange?.from || JAN_2026_END);

  useEffect(() => {
    let active = true;

    async function fetchComparison() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(
          `${API_URL}/comparison/wind?start_date=${startIso}&end_date=${endIso}`
        );
        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        const json = await res.json();
        if (active) {
          setData(json);
          setFetchedRange({ from: startIso, to: endIso });
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Failed to load data");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchComparison();
    return () => {
      active = false;
    };
  }, [startIso, endIso, setLoading, setData, setError, setFetchedRange]);

  return (
    <main className="fixed inset-0 flex h-screen w-screen overflow-hidden bg-zinc-950 text-zinc-100">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <RightSide activeTab={activeTab} />
    </main>
  );
}

export default function App() {
  return (
    <WindDataProvider>
      <WindShell />
    </WindDataProvider>
  );
}