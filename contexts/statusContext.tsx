"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

type ServiceStatus = "loading" | "success" | "error";

interface StatusActions {
  reportStatus: (name: string, status: ServiceStatus) => void;
  startAction: (id: string) => void;
  endAction: (id: string) => void;
}

interface StatusState {
  isAllLive: boolean;
  anyLoading: boolean;
  anyActionLoading: boolean;
}

// Two contexts: the actions never change, so a card that only reports its
// status is not re-rendered every time another card reports.
const StatusActionsContext = createContext<StatusActions>({
  reportStatus: () => {},
  startAction: () => {},
  endAction: () => {},
});

const StatusStateContext = createContext<StatusState>({
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
    setSystems(prev => (prev[name] === status ? prev : { ...prev, [name]: status }));
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

  const actionsValue = useMemo<StatusActions>(
    () => ({ reportStatus, startAction, endAction }),
    [reportStatus, startAction, endAction],
  );
  const stateValue = useMemo<StatusState>(
    () => ({ isAllLive, anyLoading, anyActionLoading }),
    [isAllLive, anyLoading, anyActionLoading],
  );

  return (
    <StatusActionsContext.Provider value={actionsValue}>
      <StatusStateContext.Provider value={stateValue}>
        {children}
      </StatusStateContext.Provider>
    </StatusActionsContext.Provider>
  );
};

/** Stable callbacks; using only this hook never causes a re-render. */
export const useStatusActions = () => useContext(StatusActionsContext);

/** Aggregated flags; re-renders only when one of them flips. */
export const useStatusState = () => useContext(StatusStateContext);

/** Both of the above. Prefer the narrower hooks in new code. */
export const useStatus = () => {
  const actions = useStatusActions();
  const state = useStatusState();
  return { ...actions, ...state };
};
