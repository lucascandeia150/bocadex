import { Routes, Route } from "react-router-dom";
import { BottomTabs } from "@/components/BottomTabs";
import { useHistory } from "@/hooks/useHistory";
import type { Food } from "@/data/foods";
import HomePage from "./HomePage";
import EconomicoPage from "./EconomicoPage";
import SugestoesPage from "./SugestoesPage";
import HistoricoPage from "./HistoricoPage";

export default function Index() {
  const { history, addEntry, clearHistory } = useHistory();

  const handleChoose = (food: Food) => addEntry(food);

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto">
      <HomePage onChoose={handleChoose} />
      <BottomTabs />
    </div>
  );
}
