"use client";

import { useEffect } from "react";
import { useStatus } from "@/contexts/statusContext";

interface StatusReporterProps {
  statuses: string[];
}

export default function StatusReporter({ statuses }: StatusReporterProps) {
  const { reportStatus } = useStatus();

  useEffect(() => {
    statuses.forEach((key) => reportStatus(key, "success"));
  }, []);

  return null;
}