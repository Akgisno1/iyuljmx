import { createContext, useContext, useState } from "react";

const WindDataContext = createContext(null);

export const JAN_2026_START = new Date(2026, 0, 1);
export const JAN_2026_END = new Date(2026, 0, 31);

export function WindDataProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [dateRange, setDateRange] = useState({
    from: JAN_2026_START,
    to: JAN_2026_END,
  });
  const [fetchedRange, setFetchedRange] = useState({
    from: "2026-01-01",
    to: "2026-01-31",
  });

  return (
    <WindDataContext.Provider
      value={{
        loading,
        setLoading,
        data,
        setData,
        error,
        setError,
        dateRange,
        setDateRange,
        fetchedRange,
        setFetchedRange,
      }}
    >
      {children}
    </WindDataContext.Provider>
  );
}

export function useWindData() {
  const ctx = useContext(WindDataContext);
  if (!ctx) {
    throw new Error("useWindData must be used inside WindDataProvider");
  }
  return ctx;
}