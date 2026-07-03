"use client";
import { useEffect, useState } from "react";
import { fetchStatistics } from "../api/client";
import type { StatisticsModel } from "../model/statistics.model";

export function useStatisticsViewModel() {
  const [stats, setStats] = useState<StatisticsModel | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStatistics()
      .then(setStats)
      .catch((e: Error) => setError(e.message));
  }, []);

  return { stats, error };
}
