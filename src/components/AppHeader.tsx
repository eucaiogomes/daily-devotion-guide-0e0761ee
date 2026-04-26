import { Shield, Flame, Crown, LogOut } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { useGameState } from "@/hooks/useGameState";
import { MAX_SHIELDS } from "@/lib/gameState";
import doveMascot from "@/assets/dove-mascot.png";

interface AppHeaderProps {
  /** Passa true apenas nas rotas de devocional para exibir os Escudos de Davi */
  showShields?: boolean;
}

export function AppHeader({ showShields = false }: AppHeaderProps) {
  const { displayName, user, signOut } = useAuth();
  const { liveShields, regenSec, regenInMs, streak, talentos } = useGameState();
  const navigate = useNavigate();

  const isAnonymous = user?.is_anonymous ?? true;
  const greeting = displayName ?? (isAnonymous ? "Visitante" : "Você");

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/auth" });
  };

  return (
    <header className="sticky top-0 z-30 bg-background/75 backdrop-blur-xl border-b border-border/40">
      <div className="max-w-md mx-auto px-5 pt-4 pb-3 flex items-center justify-between">

        {/* Logo + nome */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="size-9 shrink-0 rounded-2xl bg-gradient-hero shadow-soft flex items-center justify-center overflow-hidden">
            <img src={doveMascot} alt="" aria-hidden="true" className="size-7 object-contain" />
          </div>
          <div className="leading-tight min-w-0">
            <p className="font-display text-base font-bold text-foreground leading-none truncate">{greeting}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5 truncate">
              {isAnonymous ? "visitante" : "Lumen · Salmos"}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Dias de Louvor (streak) */}
          <StatPill
            icon={<Flame className="size-3.5 fill-current" />}
            label={`${streak}`}
            title={`${streak} dias de louvor`}
            colorClass="text-streak"
          />

          {/* Talentos de Salomão */}
          <StatPill
            icon={<Crown className="size-3.5 fill-current" />}
            label={`${talentos}`}
            title={`${talentos} talentos`}
            colorClass="text-gold"
          />

          {/* Escudos de Davi — só aparece no devocional */}
          {showShields && (
            <ShieldPill shields={liveShields} regenSec={regenSec} regenInMs={regenInMs} />
          )}

          <button
            onClick={handleSignOut}
            title="Sair"
            aria-label="Sair da conta"
            className="ml-0.5 flex size-8 items-center justify-center rounded-full bg-card/80 border border-border/50 text-muted-foreground hover:text-foreground transition"
          >
            <LogOut className="size-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}

/* ── Escudos de Davi com countdown ───────────────────────── */
function ShieldPill({
  shields,
  regenSec,
  regenInMs,
}: {
  shields: number;
  regenSec: number;
  regenInMs: number;
}) {
  const regenerating = regenInMs > 0 && shields < MAX_SHIELDS;

  return (
    <div
      title={regenerating ? `Próximo escudo em ${regenSec}s` : "Escudos de Davi"}
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-extrabold border shadow-sm
        ${shields === 0
          ? "bg-destructive/10 border-destructive/30 text-destructive"
          : "bg-card/80 border-border/50 text-accent"
        }`}
    >
      <div className="flex items-center gap-0.5">
        {Array.from({ length: MAX_SHIELDS }).map((_, i) => (
          <Shield
            key={i}
            className={`size-3 transition-all ${
              i < shields ? "fill-current text-accent" : "text-muted-foreground/30 fill-muted/20"
            }`}
          />
        ))}
      </div>
      {regenerating && (
        <span className="text-[10px] font-extrabold text-muted-foreground tabular-nums ml-0.5">
          {regenSec}s
        </span>
      )}
    </div>
  );
}

/* ── Stat pill genérico ───────────────────────────────────── */
function StatPill({
  icon,
  label,
  colorClass,
  title,
}: {
  icon: React.ReactNode;
  label: string;
  colorClass: string;
  title: string;
}) {
  return (
    <div
      title={title}
      className={`inline-flex items-center gap-1 rounded-full bg-card/80 backdrop-blur px-2.5 py-1 text-xs font-extrabold border border-border/50 shadow-sm ${colorClass}`}
    >
      {icon}
      <span className="tabular-nums">{label}</span>
    </div>
  );
}
