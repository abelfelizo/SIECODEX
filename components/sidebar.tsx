"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  ["/overview", "Overview"],
  ["/strategic-map", "Strategic Map"],
  ["/territory-analysis", "Territory Analysis"],
  ["/opportunities", "Opportunities"],
  ["/alliances", "Alliances"],
  ["/vote-transfer", "Vote Transfer"],
  ["/tracking", "Tracking"],
  ["/simulation", "Simulation"],
  ["/optimization", "Optimization"]
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div>
        <div className="small-label">SIE</div>
        <h1>Strategic Electoral Intelligence System</h1>
        <p>Supabase en solo lectura. Recomendaciones, proyecciones y simulacion para decision electoral.</p>
      </div>

      <nav className="nav-list">
        {items.map(([href, label]) => (
          <Link
            className="nav-link"
            key={href}
            href={href}
            data-active={pathname === href}
          >
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
