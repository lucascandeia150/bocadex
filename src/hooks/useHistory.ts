import { useState, useEffect } from "react";
import type { Food } from "@/data/foods";

export interface HistoryEntry {
  food: Food;
  timestamp: number;
  reason: string;
}

const STORAGE_KEY = "escolheai-history";

export function useHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  }, [history]);

  const addEntry = (food: Food) => {
    setHistory((prev) => [
      { food, timestamp: Date.now(), reason: food.reason },
      ...prev.slice(0, 49),
    ]);
  };

  const clearHistory = () => setHistory([]);

  return { history, addEntry, clearHistory };
}
