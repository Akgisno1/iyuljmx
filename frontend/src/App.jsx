import { useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/Sidebar";
import RightSide from "@/components/RightSide";
import {
  JAN_2026_END,
  JAN_2026_START,
  WindDataProvider,
  useWindData,
} from "@/context/WindDataContext";
import { isoDay } from "@/lib/wind";
import { getTab, tabFromHash } from "@/lib/tabs";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(
  /\/+$/,
  ""
);

function WindShell() {
  const [activeTab, setActiveTab] = useState(() => tabFromHash(window.location.hash));
  const {
    setLoading,
    setData,
    setError,
    setUpdatedAt,
    dateRange,
    setFetchedRange,
    refreshToken,
  } = useWindData();

  const startIso = isoDay(dateRange?.from || JAN_2026_START);
  const endIso = isoDay(dateRange?.to || dateRange?.from || JAN_2026_END);

  // Keep the URL in step with the visible tab so a link can be shared/reloaded.
  useEffect(() => {
    if (window.location.hash !== `#/${activeTab}`) {
      window.history.replaceState(null, "", `#/${activeTab}`);
    }
    document.title = `${getTab(activeTab).label} · UK Wind Forecast Portal`;
  }, [activeTab]);

  useEffect(() => {
    const onHashChange = () => setActiveTab(tabFromHash(window.location.hash));
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchComparison() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(
          `${API_URL}/comparison/wind?start_date=${startIso}&end_date=${endIso}`,
          { signal: controller.signal }
        );
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.detail || `Request failed (${res.status})`);
        }
        const json = await res.json();
        if (!controller.signal.aborted) {
          setData(json);
          setFetchedRange({ from: startIso, to: endIso });
          setUpdatedAt(new Date());
        }
      } catch (err) {
        if (err?.name === "AbortError") return;
        setError(
          err instanceof Error && err.message
            ? err.message
            : "Could not load wind data from the API."
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    fetchComparison();
    return () => controller.abort();
  }, [startIso, endIso, refreshToken, setLoading, setData, setError, setFetchedRange, setUpdatedAt]);

  const tab = useMemo(() => getTab(activeTab), [activeTab]);

  return (
    <main className="fixed inset-0 flex h-screen w-screen overflow-hidden bg-background">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <RightSide activeTab={activeTab} setActiveTab={setActiveTab} tab={tab} />
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
