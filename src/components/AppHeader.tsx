import { Flame, Crown, Heart } from "lucide-react";
import doveMascot from "@/assets/dove-mascot.png";

interface AppHeaderProps {
  streak: number;
  gold: number;
  hearts: number;
}

export function AppHeader({ streak, gold, hearts }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-background/75 backdrop-blur-xl border-b border-border/40">
      <div className="max-w-md mx-auto px-5 pt-4 pb-3 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="size-9 rounded-2xl bg-gradient-hero shadow-soft flex items-center justify-center overflow-hidden">
            <img src={doveMascot} alt="" aria-hidden="true" className="size-7 object-contain" />
          </div>
          <div className="leading-tight">
            <p className="font-display text-lg font-bold text-foreground leading-none">Lumen</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5">
              Inglês · Salmos
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-1.5">
          <StatPill
            icon={<Flame className="size-3.5 fill-current" />}
            value={streak}
            colorClass="text-streak"
            label="dias seguidos"
          />
          <StatPill
            icon={<Crown className="size-3.5 fill-current" />}
            value={gold}
            colorClass="text-gold"
            label="moedas"
          />
          <StatPill
            icon={<Heart className="size-3.5 fill-current" />}
            value={hearts}
            colorClass="text-accent"
            label="vidas"
          />
        </div>
      </div>
    </header>
  );
}

function StatPill({
  icon,
  value,
  colorClass,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  colorClass: string;
  label: string;
}) {
  return (
    <div
      title={`${value} ${label}`}
      className={`inline-flex items-center gap-1 rounded-full bg-card/80 backdrop-blur px-2.5 py-1 text-xs font-extrabold border border-border/50 shadow-sm ${colorClass}`}
    >
      {icon}
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
