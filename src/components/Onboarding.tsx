import { useState, useEffect } from "react";
import { Shield, Crown, Flame, BookOpen, Dumbbell, ArrowRight, X } from "lucide-react";
import doveMascot from "@/assets/dove-mascot.png";

const KEY = "lumen:onboarding-done";

type Slide = {
  visual: React.ReactNode;
  tag: string;
  title: string;
  body: string;
};

const SLIDES: Slide[] = [
  {
    visual: (
      <div className="mx-auto size-24 rounded-3xl bg-gradient-hero shadow-soft flex items-center justify-center">
        <img src={doveMascot} alt="" aria-hidden="true" className="size-16 object-contain" />
      </div>
    ),
    tag: "Bem-vindo",
    title: "Aprenda inglês com os Salmos",
    body: "Um devocional guiado de 5 minutos por dia. Simples, bonito e no seu ritmo.",
  },
  {
    visual: (
      <div className="mx-auto size-24 rounded-3xl bg-primary/10 flex items-center justify-center border-2 border-primary/20">
        <BookOpen className="size-12 text-primary" />
      </div>
    ),
    tag: "Devocional",
    title: "Todo dia um novo Salmo",
    body: "Você vai ouvir, repetir e orar em inglês. Cada lição tem vocabulário, exercícios e um versículo para guardar no coração.",
  },
  {
    visual: (
      <div className="mx-auto flex flex-col items-center gap-3">
        <div className="flex gap-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`size-10 rounded-xl flex items-center justify-center border-2 transition-all ${
                i < 3
                  ? "bg-accent/20 border-accent text-accent"
                  : "bg-muted border-border text-muted-foreground/30"
              }`}
            >
              <Shield className={`size-5 ${i < 3 ? "fill-current" : ""}`} />
            </div>
          ))}
        </div>
        <p className="text-[11px] font-bold text-muted-foreground">30s para regenerar cada escudo</p>
      </div>
    ),
    tag: "Escudos de Davi",
    title: "Você tem 5 vidas no devocional",
    body: "Cada erro custa um Escudo de Davi. Eles se regeneram em 30 segundos. Descanse e volte — sem pressa.",
  },
  {
    visual: (
      <div className="mx-auto flex items-center gap-4">
        <div className="flex flex-col items-center gap-1.5">
          <div className="size-16 rounded-2xl bg-gold/15 border-2 border-gold/30 flex items-center justify-center">
            <Crown className="size-8 text-gold fill-current" />
          </div>
          <span className="text-xs font-extrabold text-gold">Talentos</span>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <div className="size-16 rounded-2xl bg-streak/15 border-2 border-streak/30 flex items-center justify-center">
            <Flame className="size-8 text-streak fill-current" />
          </div>
          <span className="text-xs font-extrabold text-streak">Sequência</span>
        </div>
      </div>
    ),
    tag: "Recompensas",
    title: "Ganhe Talentos de Salomão",
    body: "Complete lições para ganhar Talentos. Volte todo dia para aumentar sua sequência de Dias de Louvor e manter a chama acesa.",
  },
  {
    visual: (
      <div className="mx-auto grid grid-cols-2 gap-2 max-w-[200px]">
        {[
          { emoji: "🃏", label: "Cartões" },
          { emoji: "💀", label: "Forca" },
          { emoji: "⚡", label: "Corrida" },
          { emoji: "🎵", label: "Louvor" },
        ].map((g) => (
          <div key={g.label} className="rounded-2xl bg-card border border-border/60 p-3 flex flex-col items-center gap-1 shadow-sm">
            <span className="text-2xl">{g.emoji}</span>
            <span className="text-[10px] font-bold text-muted-foreground">{g.label}</span>
          </div>
        ))}
      </div>
    ),
    tag: "Treinos",
    title: "Pratique quando quiser",
    body: "Além do devocional, há 4 jogos para reforçar o vocabulário: Forca, Cartões, Corrida de Palavras e Cantar Louvor.",
  },
];

export function Onboarding({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const [animating, setAnimating] = useState(false);

  const isLast = step === SLIDES.length - 1;
  const slide = SLIDES[step];

  const finish = () => {
    if (typeof window !== "undefined") localStorage.setItem(KEY, "1");
    onDone();
  };

  const goNext = () => {
    if (isLast) { finish(); return; }
    setAnimating(true);
    setTimeout(() => {
      setStep((s) => s + 1);
      setAnimating(false);
    }, 160);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-foreground/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Introdução ao Lumen"
    >
      <div className="w-full max-w-sm mx-4 mb-4 sm:mb-0 rounded-3xl bg-card border border-border/60 shadow-soft overflow-hidden">

        {/* Botão fechar */}
        <div className="flex justify-end px-5 pt-4">
          <button
            onClick={finish}
            className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground hover:text-foreground transition"
            aria-label="Pular introdução"
          >
            <X className="size-3.5" />
            Pular
          </button>
        </div>

        {/* Conteúdo do slide */}
        <div
          className={`px-6 pb-2 pt-3 text-center transition-opacity duration-150 ${animating ? "opacity-0" : "opacity-100"}`}
        >
          {/* Visual */}
          <div className="mb-5">{slide.visual}</div>

          {/* Tag */}
          <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-primary border border-primary/20">
            {slide.tag}
          </span>

          {/* Título */}
          <h2 className="font-display text-2xl font-bold mt-3 leading-tight break-words">
            {slide.title}
          </h2>

          {/* Descrição */}
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed break-words">
            {slide.body}
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 pt-4 pb-6 flex flex-col items-center gap-4">
          {/* Dots */}
          <div className="flex items-center gap-2" role="tablist" aria-label="Progresso da introdução">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                role="tab"
                aria-selected={i === step}
                onClick={() => !animating && setStep(i)}
                className={`rounded-full transition-all duration-300 ${
                  i === step
                    ? "w-6 h-2 bg-primary"
                    : i < step
                      ? "size-2 bg-primary/40"
                      : "size-2 bg-border"
                }`}
              />
            ))}
          </div>

          {/* Botão */}
          <button
            onClick={goNext}
            className="w-full flex items-center justify-center gap-2 rounded-full bg-gradient-hero text-primary-foreground py-4 font-display text-base font-bold shadow-soft active:translate-y-0.5 transition"
          >
            {isLast ? (
              <>
                <Dumbbell className="size-5" />
                Começar agora!
              </>
            ) : (
              <>
                Próximo
                <ArrowRight className="size-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export function useOnboarding() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const done = localStorage.getItem(KEY);
    if (!done) setShow(true);
  }, []);

  return { show, done: () => setShow(false) };
}
