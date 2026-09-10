"use client";

import { createContext, useCallback, useContext, useState } from 'react';

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
