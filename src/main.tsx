import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initGA } from "./lib/analytics";
import { preloadAffiliateLinks } from "./data/affiliateLinks";

initGA();
preloadAffiliateLinks();

createRoot(document.getElementById("root")!).render(<App />);
