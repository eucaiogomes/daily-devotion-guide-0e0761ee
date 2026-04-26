import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, BookOpen, Heart, Lightbulb, Quote, RotateCcw, Trophy, Volume2 } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { useSpeech } from "@/hooks/useSpeech";
import { PSALM_BANK } from "@/data/psalmsBank";
import type { PsalmKeyword } from "@/data/psalms";

export const Route = createFileRoute("/forca")({
  head: () => ({
    meta: [
      { title: "Forca dos Salmos — Lumen" },
      {
        name: "description",
        content: "Adivinhe palavras em inglês dos Salmos no clássico jogo da forca.",
      },
    ],
  }),
  component: ForcaPage,
});

interface ForcaWord {
  en: string;
  pt: string;
  ipa?: string;
  example?: string;
  psalmRef: string;
  /** Versículo (em inglês) que contém a palavra — usado como contexto. */
  verseEn: string;
  /** Tradução em português do mesmo versículo. */
  versePt: string;
  /** Referência bíblica curta do versículo (ex: "Psalm 23:1"). */
  verseRef: string;
}

const MAX_MISTAKES = 6;
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

/** Pool de palavras: keywords cujo lema aparece em algum versículo do mesmo salmo.
 *  Garante que sempre teremos um versículo de contexto para o jogador. */
function buildWordPool(): ForcaWord[] {
  const seen = new Set<string>();
  const pool: ForcaWord[] = [];
  for (const p of PSALM_BANK) {
    for (const kw of p.keywords as PsalmKeyword[]) {
      const word = kw.en.trim().toLowerCase();
      if (word.length < 3) continue;
      if (!/^[a-z]+$/.test(word)) continue;
      if (seen.has(word)) continue;

      // Encontra um versículo do salmo que contenha a palavra (match em qualquer caso).
      const re = new RegExp(`\\b${word}\\b`, "i");
      const verse =
        p.verses.find((v) => re.test(v.en)) ??
        // fallback: tenta com sufixos comuns (s/es/ed/ing) na palavra do versículo
        p.verses.find((v) => new RegExp(`\\b${word}(s|es|ed|ing)?\\b`, "i").test(v.en));

      if (!verse) continue; // só inclui palavras com versículo de contexto

      seen.add(word);
      pool.push({
        en: word,
        pt: kw.pt,
        ipa: kw.ipa,
        example: kw.example,
        psalmRef: p.title,
        verseEn: verse.en,
        versePt: verse.pt,
        verseRef: verse.ref,
      });
    }
  }
  return pool;
}

function pickRandom<T>(arr: T[], exclude?: T): T {
  if (arr.length === 1) return arr[0];
  for (let i = 0; i < 10; i++) {
    const w = arr[Math.floor(Math.random() * arr.length)];
    if (w !== exclude) return w;
  }
  return arr[0];
}

function ForcaPage() {
  const pool = useMemo(buildWordPool, []);
  const [word, setWord] = useState<ForcaWord>(() => pickRandom(pool));
  const [guessed, setGuessed] = useState<Set<string>>(new Set());
  const [mistakes, setMistakes] = useState(0);
  const [hintUsed, setHintUsed] = useState(false);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(() => {
    if (typeof window === "undefined") return 0;
    return parseInt(window.localStorage.getItem("lumen:forca-best") ?? "0", 10) || 0;
  });
  const { speak, speaking } = useSpeech();

  const letters = word.en.toUpperCase().split("");
  const won = letters.every((l) => guessed.has(l));
  const lost = mistakes >= MAX_MISTAKES;
  const finished = won || lost;

  // Persiste melhor sequência.
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("lumen:forca-best", String(bestStreak));
  }, [bestStreak]);

  // Conta vitórias para a sequência.
  useEffect(() => {
    if (won) {
      setStreak((s) => {
        const next = s + 1;
        setBestStreak((b) => Math.max(b, next));
        return next;
      });
    } else if (lost) {
      setStreak(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [won, lost]);

  const guessLetter = (letter: string) => {
    if (finished || guessed.has(letter)) return;
    const next = new Set(guessed);
    next.add(letter);
    setGuessed(next);
    if (!letters.includes(letter)) setMistakes((m) => m + 1);
  };

  const useHint = () => {
    if (hintUsed || finished) return;
    // Revela uma letra ainda não adivinhada (escolhe a vogal mais comum primeiro).
    const remaining = letters.filter((l) => !guessed.has(l));
    if (!remaining.length) return;
    const vowels = remaining.filter((l) => "AEIOU".includes(l));
    const pick = vowels[0] ?? remaining[0];
    const next = new Set(guessed);
    next.add(pick);
    setGuessed(next);
    setHintUsed(true);
  };

  const nextWord = () => {
    setWord(pickRandom(pool, word));
    setGuessed(new Set());
    setMistakes(0);
    setHintUsed(false);
  };

  // Suporte ao teclado físico no desktop.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toUpperCase();
      if (k.length === 1 && k >= "A" && k <= "Z") guessLetter(k);
      else if (e.key === "Enter" && finished) nextWord();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guessed, finished, word]);

  const livesLeft = MAX_MISTAKES - mistakes;

  return (
    <div className="min-h-screen bg-background flex flex-col pb-28">
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center gap-3 px-4 py-3">
          <Link
            to="/treinos"
            className="-ml-1 p-1 text-muted-foreground hover:text-foreground"
            aria-label="Voltar para treinos"
          >
            <ArrowLeft className="size-6" />
          </Link>
          <div className="flex-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Vocabulário
            </p>
            <h1 className="font-display text-lg font-bold leading-tight">Jogo da Forca</h1>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-gold/10 px-2.5 py-1 text-xs font-extrabold text-gold tabular-nums">
            <Trophy className="size-3.5" /> {bestStreak}
          </span>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 py-4">
        {/* Faixa de status: vidas + boneco compacto + sequência */}
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card/60 px-3 py-2">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Vidas
            </span>
            <div className="flex items-center gap-0.5" aria-label={`${livesLeft} vidas restantes`}>
              {Array.from({ length: MAX_MISTAKES }).map((_, i) => (
                <Heart
                  key={i}
                  className={`size-4 transition ${
                    i < livesLeft ? "fill-streak text-streak" : "text-muted opacity-40"
                  }`}
                />
              ))}
            </div>
          </div>
          <Hangman mistakes={mistakes} />
          <div className="flex flex-col items-end gap-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Sequência
            </span>
            <span className="font-display text-lg font-extrabold text-success tabular-nums">
              {streak}
            </span>
          </div>
        </div>

        {/* DESTAQUE PRINCIPAL: o versículo de contexto */}
        <section
          aria-label="Versículo de contexto"
          className="mt-4 rounded-3xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card p-5 shadow-chunky"
        >
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest text-primary">
              <BookOpen className="size-3.5" />
              {word.verseRef}
            </span>
            <button
              onClick={() => speak(word.verseEn)}
              aria-label="Ouvir versículo"
              className={`flex size-8 items-center justify-center rounded-full bg-card text-primary border border-border ${
                speaking ? "animate-pulse" : ""
              }`}
            >
              <Volume2 className="size-4" />
            </button>
          </div>

          <Quote className="mt-3 size-5 text-primary/40" />
          <p className="mt-1 font-display text-lg font-bold leading-snug text-foreground">
            <ContextVerse verseEn={word.verseEn} word={word.en} finished={finished} />
          </p>
          <p className="mt-2 text-sm font-medium italic text-muted-foreground">
            "{word.versePt}"
          </p>
          <p className="mt-3 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            {word.psalmRef}
          </p>
        </section>

        {/* Pergunta + palavra */}
        <p className="mt-4 text-center text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
          Qual é a palavra que falta?
        </p>
        <div
          className="mt-2 flex flex-wrap justify-center gap-1.5"
          aria-label={`Palavra de ${letters.length} letras`}
        >
          {letters.map((l, i) => {
            const revealed = guessed.has(l) || lost;
            return (
              <span
                key={i}
                className={`flex h-12 w-9 items-center justify-center rounded-lg border-b-4 font-display text-2xl font-bold uppercase tabular-nums ${
                  revealed
                    ? lost && !guessed.has(l)
                      ? "border-destructive text-destructive bg-destructive/5"
                      : "border-success text-foreground bg-success/5"
                    : "border-border text-transparent bg-card"
                }`}
              >
                {revealed ? l : "_"}
              </span>
            );
          })}
        </div>

        {/* Tradução da palavra (apenas se usar dica ou terminar) */}
        {(hintUsed || finished) && (
          <p className="mt-2 text-center text-sm font-semibold text-muted-foreground italic">
            Tradução: <span className="text-foreground not-italic">{word.pt}</span>
          </p>
        )}

        {/* Painel pós-jogo OU teclado */}
        {finished ? (
          <ResultPanel
            won={won}
            word={word}
            speak={speak}
            speaking={speaking}
            onNext={nextWord}
          />
        ) : (
          <Keyboard guessed={guessed} letters={letters} onGuess={guessLetter} onHint={useHint} hintUsed={hintUsed} />
        )}
      </main>

      <BottomNav />
    </div>
  );
}

/** Renderiza o versículo em inglês destacando (ou censurando) a palavra-alvo.
 *  Cobre formas com sufixos comuns (s/es/ed/ing). */
function ContextVerse({
  verseEn,
  word,
  finished,
}: {
  verseEn: string;
  word: string;
  finished: boolean;
}) {
  const tokens = verseEn.split(/(\s+|[.,;:!?"'()\[\]])/);
  const base = word.toLowerCase();
  const isTarget = (t: string) => {
    const m = t.toLowerCase().match(/^([a-z]+)$/);
    if (!m) return false;
    const w = m[1];
    if (w === base) return true;
    if (w === base + "s" || w === base + "es" || w === base + "ed" || w === base + "ing") return true;
    if (base.endsWith("e") && (w === base.slice(0, -1) + "ing" || w === base + "d")) return true;
    return false;
  };

  return (
    <>
      {tokens.map((t, i) => {
        if (!t) return null;
        if (isTarget(t)) {
          if (finished) {
            return (
              <span
                key={i}
                className="rounded-md bg-success/20 px-1.5 py-0.5 font-extrabold text-success"
              >
                {t}
              </span>
            );
          }
          return (
            <span
              key={i}
              className="inline-block rounded-md bg-primary/15 px-2 py-0.5 font-mono font-extrabold tracking-widest text-primary"
              aria-label="palavra a descobrir"
            >
              {"_".repeat(t.length)}
            </span>
          );
        }
        return <span key={i}>{t}</span>;
      })}
    </>
  );
}

function ResultPanel({
  won,
  word,
  speak,
  speaking,
  onNext,
}: {
  won: boolean;
  word: ForcaWord;
  speak: (text: string, opts?: { rate?: number }) => void;
  speaking: boolean;
  onNext: () => void;
}) {
  return (
    <div
      className={`mt-5 rounded-2xl border-2 p-4 ${
        won ? "border-success/40 bg-success/10" : "border-destructive/40 bg-destructive/10"
      }`}
    >
      <p className={`font-display text-lg font-bold ${won ? "text-success" : "text-destructive"}`}>
        {won ? "Acertou! 🎉" : "Você foi enforcado…"}
      </p>
      <div className="mt-2 flex items-center gap-2">
        <button
          onClick={() => speak(word.en)}
          aria-label="Ouvir palavra"
          className={`flex size-9 items-center justify-center rounded-full bg-card text-primary border border-border ${
            speaking ? "animate-pulse" : ""
          }`}
        >
          <Volume2 className="size-4" />
        </button>
        <p className="font-display text-xl font-bold uppercase tabular-nums">{word.en}</p>
        {word.ipa && <span className="text-xs font-mono text-muted-foreground">{word.ipa}</span>}
      </div>
      <p className="mt-1 text-sm font-semibold">{word.pt}</p>
      {word.example && (
        <p className="mt-2 text-xs italic text-muted-foreground">"{word.example}"</p>
      )}
      <button
        onClick={onNext}
        className="mt-4 w-full rounded-2xl bg-primary py-3 font-display text-base font-bold text-primary-foreground shadow-chunky active:translate-y-1 active:shadow-none"
      >
        Próxima palavra
      </button>
    </div>
  );
}

function Keyboard({
  guessed,
  letters,
  onGuess,
  onHint,
  hintUsed,
}: {
  guessed: Set<string>;
  letters: string[];
  onGuess: (l: string) => void;
  onHint: () => void;
  hintUsed: boolean;
}) {
  const wordSet = new Set(letters);
  return (
    <div className="mt-5">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Toque uma letra
        </span>
        <button
          onClick={onHint}
          disabled={hintUsed}
          className="inline-flex items-center gap-1 rounded-full bg-gold/10 px-2.5 py-1 text-[11px] font-extrabold text-gold disabled:opacity-40"
        >
          <Lightbulb className="size-3.5" />
          {hintUsed ? "Dica usada" : "Dica"}
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {ALPHABET.map((l) => {
          const isGuessed = guessed.has(l);
          const isCorrect = isGuessed && wordSet.has(l);
          const isWrong = isGuessed && !wordSet.has(l);
          return (
            <button
              key={l}
              onClick={() => onGuess(l)}
              disabled={isGuessed}
              className={`h-10 rounded-lg font-display text-base font-bold uppercase shadow-sm active:translate-y-0.5 ${
                isCorrect
                  ? "bg-success text-success-foreground"
                  : isWrong
                    ? "bg-muted text-muted-foreground line-through opacity-60"
                    : "bg-card border border-border text-foreground"
              }`}
              aria-label={`Letra ${l}${isCorrect ? " correta" : isWrong ? " errada" : ""}`}
            >
              {l}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Boneco da forca em SVG — partes vão aparecendo conforme `mistakes` cresce (0–6). */
function Hangman({ mistakes }: { mistakes: number }) {
  const stroke = "hsl(var(--foreground))";
  const partVisible = (n: number) => mistakes >= n;
  return (
    <svg
      viewBox="0 0 160 180"
      className="h-20 w-[72px]"
      aria-label={`Forca: ${mistakes} de ${MAX_MISTAKES} erros`}
    >
      {/* Estrutura sempre visível */}
      <line x1="10" y1="170" x2="130" y2="170" stroke={stroke} strokeWidth="4" strokeLinecap="round" />
      <line x1="40" y1="170" x2="40" y2="15" stroke={stroke} strokeWidth="4" strokeLinecap="round" />
      <line x1="40" y1="15" x2="110" y2="15" stroke={stroke} strokeWidth="4" strokeLinecap="round" />
      <line x1="110" y1="15" x2="110" y2="35" stroke={stroke} strokeWidth="4" strokeLinecap="round" />

      {/* 1. Cabeça */}
      {partVisible(1) && (
        <circle cx="110" cy="50" r="14" stroke={stroke} strokeWidth="3.5" fill="none" className="animate-pop-in" />
      )}
      {/* 2. Corpo */}
      {partVisible(2) && (
        <line x1="110" y1="64" x2="110" y2="115" stroke={stroke} strokeWidth="3.5" strokeLinecap="round" className="animate-pop-in" />
      )}
      {/* 3. Braço esquerdo */}
      {partVisible(3) && (
        <line x1="110" y1="78" x2="92" y2="98" stroke={stroke} strokeWidth="3.5" strokeLinecap="round" className="animate-pop-in" />
      )}
      {/* 4. Braço direito */}
      {partVisible(4) && (
        <line x1="110" y1="78" x2="128" y2="98" stroke={stroke} strokeWidth="3.5" strokeLinecap="round" className="animate-pop-in" />
      )}
      {/* 5. Perna esquerda */}
      {partVisible(5) && (
        <line x1="110" y1="115" x2="94" y2="140" stroke={stroke} strokeWidth="3.5" strokeLinecap="round" className="animate-pop-in" />
      )}
      {/* 6. Perna direita + olhos X */}
      {partVisible(6) && (
        <g className="animate-pop-in">
          <line x1="110" y1="115" x2="126" y2="140" stroke={stroke} strokeWidth="3.5" strokeLinecap="round" />
          <line x1="104" y1="46" x2="108" y2="50" stroke="hsl(var(--destructive))" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="108" y1="46" x2="104" y2="50" stroke="hsl(var(--destructive))" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="112" y1="46" x2="116" y2="50" stroke="hsl(var(--destructive))" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="116" y1="46" x2="112" y2="50" stroke="hsl(var(--destructive))" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      )}
    </svg>
  );
}

// Helper exportado para evitar warning de import não usado quando não precisamos.
export { RotateCcw };
