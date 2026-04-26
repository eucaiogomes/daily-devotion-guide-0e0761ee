import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { Onboarding, useOnboarding } from "@/components/Onboarding";
import { getPsalmByDay, TOTAL_DAYS } from "@/data/psalms";
import { isMissionCompletedToday, syncOfflineMissions } from "@/lib/offlineMission";
import { getLessonProgress, findCurrentDay, type LessonProgressEntry } from "@/lib/lessonProgress";
import {
  CheckCircle2,
  Play,
  RotateCcw,
  BookOpen,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import heroPrayer from "@/assets/hero-prayer.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lumen — Devocional do dia" },
      {
        name: "description",
        content:
          "Aprenda inglês todos os dias com os Salmos. Um devocional guiado por dia, simples e direto.",
      },
      { property: "og:title", content: "Lumen — Inglês com os Salmos" },
      { property: "og:description", content: "Devocional diário guiado para aprender inglês com os Salmos." },
    ],
  }),
  component: Index,
});

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

function Index() {
  const { show: showOnboarding, done: onboardingDone } = useOnboarding();
  const [currentDay, setCurrentDay] = useState(1);
  const today = getPsalmByDay(currentDay);
  const v1 = today.verses[0];
  const [done, setDone] = useState(false);
  const [progress, setProgress] = useState<LessonProgressEntry | null>(null);
  const yearProgress = Math.round((currentDay / TOTAL_DAYS) * 100);
  const greeting = getGreeting();

  useEffect(() => {
    const day = findCurrentDay(1, TOTAL_DAYS);
    setCurrentDay(day);
    setDone(isMissionCompletedToday(day));
    setProgress(getLessonProgress(day));
    syncOfflineMissions().catch(() => undefined);
  }, []);

  const isInProgress =
    !!progress &&
    progress.status === "in_progress" &&
    progress.step > 0 &&
    progress.step < progress.totalSteps;
  const isDoneSaved = done || progress?.status === "done";
  const pct = progress
    ? Math.round(((progress.step + 1) / progress.totalSteps) * 100)
    : 0;

  const upcoming = [1, 2, 3].map((offset) => {
    const d = Math.min(currentDay + offset, TOTAL_DAYS);
    return { psalm: getPsalmByDay(d), day: d };
  });

  return (
    <div className="min-h-screen bg-gradient-sky pb-32">
      {showOnboarding && <Onboarding onDone={onboardingDone} />}
      <AppHeader />

      <main className="mx-auto flex max-w-md flex-col px-5 pt-3 gap-6">

        {/* Saudação */}
        <section className="animate-slide-up">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-gold" />
            {greeting}
          </p>
          <h1 className="font-display text-3xl font-bold leading-tight mt-1.5">
            Pronto para o seu
            <br />
            <span className="text-primary">devocional de hoje?</span>
          </h1>

          {/* Barra de progresso da jornada */}
          <div className="mt-4 flex items-center gap-3">
            <div className="relative flex-1 h-2.5 rounded-full bg-border overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-hero transition-all duration-1000"
                style={{ width: `${Math.max(yearProgress, 1)}%` }}
              />
            </div>
            <span className="text-[11px] font-bold text-muted-foreground whitespace-nowrap">
              Dia <span className="text-foreground">{currentDay}</span> / {TOTAL_DAYS}
            </span>
          </div>
        </section>

        {/* Card principal — devocional do dia */}
        <section
          className="relative overflow-hidden rounded-[2rem] bg-gradient-hero p-6 text-primary-foreground shadow-soft animate-slide-up"
          style={{ animationDelay: "0.08s" }}
        >
          {/* Imagem decorativa */}
          <div className="absolute -right-8 -bottom-6 opacity-40 mix-blend-soft-light pointer-events-none animate-float-slow">
            <img
              src={heroPrayer}
              alt=""
              aria-hidden="true"
              width={1024}
              height={1024}
              className="size-56"
            />
          </div>

          <div className="relative">
            {/* Badge do salmo */}
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-foreground/15 backdrop-blur px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest">
              <BookOpen className="size-3" />
              {today.title}
            </span>

            {/* Versículo */}
            <p className="mt-4 font-display text-xl leading-snug break-words pr-20">
              "{v1.en}"
            </p>
            <p className="mt-2 text-xs italic opacity-75 leading-snug break-words pr-20">
              {v1.pt}
            </p>
            <p className="mt-1.5 text-[11px] font-bold opacity-90">— {v1.ref}</p>

            {/* Barra de progresso da lição */}
            {isInProgress && !isDoneSaved && (
              <div className="mt-4 max-w-[15rem]">
                <div className="h-1.5 rounded-full overflow-hidden bg-primary-foreground/25">
                  <div
                    className="h-full bg-primary-foreground transition-all duration-700"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-wider opacity-80">
                  {pct}% concluído
                </p>
              </div>
            )}

            {/* Botão CTA */}
            <Link
              to="/lesson/$day"
              params={{ day: String(currentDay) }}
              className="mt-5 inline-flex w-fit max-w-full items-center gap-2 rounded-full bg-primary-foreground px-5 py-3.5 font-display text-sm font-bold text-primary shadow-soft active:translate-y-0.5 transition animate-pulse-cta"
            >
              {isDoneSaved ? (
                <>
                  <CheckCircle2 className="size-4 shrink-0" />
                  <span>Revisar lição</span>
                </>
              ) : isInProgress ? (
                <>
                  <RotateCcw className="size-4 shrink-0" />
                  <span>Continuar de onde parei</span>
                </>
              ) : (
                <>
                  <Play className="size-4 shrink-0 fill-current" />
                  <span>Começar agora</span>
                </>
              )}
              <ChevronRight className="size-4 shrink-0 -mr-1" />
            </Link>

            {!isInProgress && !isDoneSaved && (
              <p className="mt-3 text-[10px] font-bold uppercase tracking-wider opacity-60">
                ≈ 5 minutos · passo a passo
              </p>
            )}
          </div>
        </section>

        {/* Próximas lições */}
        <section className="animate-slide-up" style={{ animationDelay: "0.16s" }}>
          <div className="flex items-end justify-between mb-3 px-1">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Sua trilha
              </p>
              <h2 className="font-display text-xl font-bold">Próximas lições</h2>
            </div>
            <Link to="/treinos" className="text-xs font-bold text-primary">
              Ver treinos
            </Link>
          </div>

          <ul className="space-y-2.5">
            {upcoming.map(({ psalm: p, day }) => (
              <li key={day}>
                <Link
                  to="/lesson/$day"
                  params={{ day: String(day) }}
                  className="flex items-center gap-4 rounded-2xl bg-card p-4 border border-border/60 shadow-sm active:translate-y-0.5 transition"
                >
                  <div className="size-12 shrink-0 rounded-xl bg-muted/70 flex flex-col items-center justify-center border border-border/50">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground leading-none mb-0.5">
                      Dia
                    </span>
                    <span className="font-display text-base font-bold text-primary leading-none">
                      {day}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground truncate">
                      {p.title}
                    </p>
                    <p className="font-display text-sm font-semibold text-foreground line-clamp-2 mt-0.5">
                      "{p.verses[0].en}"
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                      {p.verses[0].ref} · ≈ 5 min
                    </p>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* Versículo inspiracional */}
        <p className="text-center text-[11px] italic text-muted-foreground px-6 pb-2 animate-slide-up" style={{ animationDelay: "0.22s" }}>
          "A sua palavra é uma lâmpada para os meus pés e uma luz no meu caminho."
          <br />— Salmo 119:105
        </p>
      </main>

      <BottomNav />
    </div>
  );
}
