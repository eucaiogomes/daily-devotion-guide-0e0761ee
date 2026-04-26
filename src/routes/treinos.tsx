import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { GameModeHub } from "@/components/GameModeHub";
import { Dumbbell } from "lucide-react";

export const Route = createFileRoute("/treinos")({
  head: () => ({
    meta: [
      { title: "Treinos — Lumen" },
      {
        name: "description",
        content: "Pratique inglês com jogos: Forca, Cartões de Memória, Corrida de Palavras e mais.",
      },
    ],
  }),
  component: TreinosPage,
});

function TreinosPage() {
  return (
    <div className="min-h-screen bg-gradient-sky pb-28">
      <AppHeader />

      <main className="mx-auto max-w-md px-5 pt-6 space-y-6">

        <header className="animate-slide-up">
          <div className="flex items-center gap-2 mb-1">
            <div className="size-8 rounded-xl bg-gradient-hero text-primary-foreground flex items-center justify-center shadow-soft">
              <Dumbbell className="size-4" />
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Prática extra
            </p>
          </div>
          <h1 className="font-display text-3xl font-bold leading-tight">Treinos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Já fez o devocional? Reforce o que aprendeu com mini-jogos.
          </p>
        </header>

        <div className="animate-slide-up" style={{ animationDelay: "0.08s" }}>
          <GameModeHub />
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
