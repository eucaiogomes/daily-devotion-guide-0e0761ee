import { Link } from "@tanstack/react-router";
import {
  Music,
  Zap,
  Layers,
  Skull,
} from "lucide-react";

type Mode = {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  bubble: string;
  to: string;
  params?: Record<string, string>;
  badge?: string;
  xp: number;
};

const MODES: Mode[] = [
  {
    id: "anki",
    title: "Cartões de Memória",
    subtitle: "Revise e não esqueça",
    icon: <Layers className="size-6" />,
    bubble: "bg-gradient-hero text-primary-foreground",
    to: "/anki",
    badge: "Novo",
    xp: 15,
  },
  {
    id: "forca",
    title: "Jogo da Forca",
    subtitle: "Descubra a palavra",
    icon: <Skull className="size-6" />,
    bubble: "bg-gradient-flame text-white",
    to: "/forca",
    xp: 12,
  },
  {
    id: "rush",
    title: "Corrida de Palavras",
    subtitle: "Combine contra o tempo",
    icon: <Zap className="size-6" />,
    bubble: "bg-gradient-flame text-white",
    to: "/rush",
    badge: "Arcade",
    xp: 20,
  },
  {
    id: "praise",
    title: "Cantar Louvor",
    subtitle: "Louvores famosos · fala e escuta",
    icon: <Music className="size-6" />,
    bubble: "bg-gradient-lavender text-white",
    to: "/louvor",
    xp: 12,
  },
];

export function GameModeHub() {

  return (
    <section>
      <div className="flex items-end justify-between px-1 mb-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            Modos de prática
          </p>
          <h2 className="font-display text-2xl font-bold">Escolha um jogo</h2>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-gold/10 px-3 py-1 text-xs font-extrabold text-gold border border-gold/20">
          365 dias
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {MODES.map((m) => (
          <Link
            key={m.id}
            to={m.to}
            params={m.params as never}
            className="relative bg-card rounded-3xl p-4 border border-border/60 shadow-sm active:translate-y-0.5 transition group"
          >
            {m.badge && (
              <span className="absolute -top-1.5 right-3 bg-gradient-gold text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shadow-soft">
                {m.badge}
              </span>
            )}
            <div className="flex items-start justify-between gap-2">
              <div
                className={`size-12 rounded-2xl flex items-center justify-center shadow-soft transition group-active:scale-95 ${m.bubble}`}
              >
                {m.icon}
              </div>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-extrabold text-muted-foreground mt-0.5">
                +{m.xp} XP
              </span>
            </div>
            <p className="mt-3 font-display text-base font-bold leading-tight text-foreground">
              {m.title}
            </p>
            <p className="text-[11px] text-muted-foreground font-semibold mt-1 leading-tight">
              {m.subtitle}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
