"use client";

import { useEffect } from "react";
import { useStatusActions } from "@/contexts/statusContext";

interface StatusReporterProps {
  statuses: string[];
}

export default function StatusReporter({ statuses }: StatusReporterProps) {
  const { reportStatus } = useStatusActions();

  useEffect(() => {
    statuses.forEach((key) => reportStatus(key, "success"));
  }, []);

  return null;
}