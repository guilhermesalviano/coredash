"use client";

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

type ServiceStatus = "loading" | "success" | "error";

const StatusContext = createContext({
  reportStatus: (name: string, status: ServiceStatus) => {},
  startAction: (id: string) => {},
  endAction: (id: string) => {},
  isAllLive: false,
  anyLoading: true,
  anyActionLoading: false,
});

export const StatusProvider = ({ children }: { children: React.ReactNode }) => {
  const [systems, setSystems] = useState<Record<string, ServiceStatus>>({
    todo: "loading",
    calendar: "loading",
    weather: "loading",
    news: "loading",
    stocks: "loading",
  });

  const [actions, setActions] = useState<Set<string>>(new Set());

  const reportStatus = useCallback((name: string, status: ServiceStatus) => {
    setSystems(prev => ({ ...prev, [name]: status }));
  }, []);

  // Failsafe: if a system never reports (e.g. unmounted card, network timeout, reverse proxy error), mark as error after 4s
  useEffect(() => {
    const timer = setTimeout(() => {
      setSystems((prev) => {
        let changed = false;
        const next = { ...prev };
        for (const [key, status] of Object.entries(next)) {
          if (status === "loading") {
            next[key] = "error";
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  const startAction = useCallback((id: string) => {
    setActions(prev => new Set([...prev, id]));
  }, []);

  const endAction = useCallback((id: string) => {
    setActions(prev => { const n = new Set(prev); n.delete(id); return n; });
  }, []);

  const isAllLive = Object.values(systems).every(v => v === "success");
  const anyLoading = Object.values(systems).some(v => v === "loading");
  const anyActionLoading = actions.size > 0;

  return (
    <StatusContext.Provider value={{ reportStatus, startAction, endAction, isAllLive, anyLoading, anyActionLoading }}>
      {children}
    </StatusContext.Provider>
  );
};

export const useStatus = () => useContext(StatusContext);
