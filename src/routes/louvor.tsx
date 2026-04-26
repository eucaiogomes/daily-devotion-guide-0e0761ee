import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Volume2, Mic, ChevronRight, BookOpen, RotateCcw, CheckCircle2 } from "lucide-react";
import { useSpeech } from "@/hooks/useSpeech";
import { useSpeechRecognition, evaluatePronunciation, type SpeechResult } from "@/hooks/useSpeechRecognition";

export const Route = createFileRoute("/louvor")({
  head: () => ({
    meta: [
      { title: "Cantar Louvor — Lumen" },
      { name: "description", content: "Pratique inglês cantando louvores famosos." },
    ],
  }),
  component: LouvorPage,
});

/* ─────────────────────────────────────────────
   BANCO DE MÚSICAS
   Cada linha tem: música, trecho EN, tradução PT,
   versículo relacionado dos Salmos.
───────────────────────────────────────────── */
type PraiseLine = {
  song: string;
  en: string;
  pt: string;
  verse: { ref: string; en: string; pt: string };
};

const PRAISE_POOL: PraiseLine[] = [
  // Amazing Grace
  {
    song: "Amazing Grace",
    en: "Amazing grace, how sweet the sound",
    pt: "Maravilhosa graça, quão doce o som",
    verse: { ref: "Salmo 103:4", en: "Who redeems your life from the pit", pt: "Ele resgata a sua vida da cova" },
  },
  {
    song: "Amazing Grace",
    en: "That saved a wretch like me",
    pt: "Que salvou um miserável como eu",
    verse: { ref: "Salmo 34:22", en: "The Lord redeems his servants", pt: "O Senhor resgata os seus servos" },
  },
  {
    song: "Amazing Grace",
    en: "I once was lost, but now am found",
    pt: "Eu estava perdido, mas agora fui achado",
    verse: { ref: "Salmo 40:2", en: "He lifted me out of the slimy pit", pt: "Ele me tirou de um poço de destruição" },
  },
  {
    song: "Amazing Grace",
    en: "Was blind, but now I see",
    pt: "Era cego, mas agora enxergo",
    verse: { ref: "Salmo 146:8", en: "The Lord gives sight to the blind", pt: "O Senhor dá vista aos cegos" },
  },

  // How Great Thou Art
  {
    song: "How Great Thou Art",
    en: "O Lord my God, when I in awesome wonder",
    pt: "Ó Senhor meu Deus, quando contemplo em admiração",
    verse: { ref: "Salmo 8:1", en: "Lord, our Lord, how majestic is your name", pt: "Senhor, nosso Deus, quão glorioso é o teu nome" },
  },
  {
    song: "How Great Thou Art",
    en: "Consider all the worlds Thy hands have made",
    pt: "Todas as obras que as Tuas mãos criaram",
    verse: { ref: "Salmo 19:1", en: "The heavens declare the glory of God", pt: "Os céus proclamam a glória de Deus" },
  },
  {
    song: "How Great Thou Art",
    en: "Then sings my soul, my Savior God, to Thee",
    pt: "Então canta minha alma ao meu Salvador",
    verse: { ref: "Salmo 103:1", en: "Praise the Lord, my soul", pt: "Bendize, ó minha alma, ao Senhor" },
  },
  {
    song: "How Great Thou Art",
    en: "How great Thou art, how great Thou art",
    pt: "Quão grande és Tu, quão grande és Tu",
    verse: { ref: "Salmo 145:3", en: "Great is the Lord and most worthy of praise", pt: "Grande é o Senhor e mui digno de louvor" },
  },

  // 10,000 Reasons
  {
    song: "10,000 Reasons",
    en: "Bless the Lord, O my soul",
    pt: "Abençoa, ó minha alma, ao Senhor",
    verse: { ref: "Salmo 103:1", en: "Praise the Lord, my soul", pt: "Bendize, ó minha alma, ao Senhor" },
  },
  {
    song: "10,000 Reasons",
    en: "Worship His holy name",
    pt: "Adora o Seu santo nome",
    verse: { ref: "Salmo 29:2", en: "Worship the Lord in the splendor of his holiness", pt: "Adorem o Senhor na beleza da sua santidade" },
  },
  {
    song: "10,000 Reasons",
    en: "The sun comes up, it's a new day dawning",
    pt: "O sol nasce, é o raiar de um novo dia",
    verse: { ref: "Salmo 118:24", en: "This is the day the Lord has made", pt: "Este é o dia que o Senhor fez" },
  },
  {
    song: "10,000 Reasons",
    en: "You're rich in love and You're slow to anger",
    pt: "Tu és rico em amor e tardio em irar",
    verse: { ref: "Salmo 103:8", en: "The Lord is compassionate and gracious, slow to anger", pt: "O Senhor é compassivo e misericordioso, tardio em irar-se" },
  },

  // Great Is Thy Faithfulness
  {
    song: "Great Is Thy Faithfulness",
    en: "Great is Thy faithfulness, O God my Father",
    pt: "Grande é a Tua fidelidade, ó Pai eterno",
    verse: { ref: "Salmo 36:5", en: "Your love, Lord, reaches to the heavens", pt: "Senhor, o teu amor chega até os céus" },
  },
  {
    song: "Great Is Thy Faithfulness",
    en: "Morning by morning new mercies I see",
    pt: "De manhã em manhã novas mercês vejo",
    verse: { ref: "Salmo 90:14", en: "Satisfy us in the morning with your unfailing love", pt: "Sacia-nos de manhã com o teu amor" },
  },
  {
    song: "Great Is Thy Faithfulness",
    en: "All I have needed Thy hand hath provided",
    pt: "Tudo que precisei a Tua mão proveu",
    verse: { ref: "Salmo 23:1", en: "The Lord is my shepherd, I lack nothing", pt: "O Senhor é o meu pastor, nada me faltará" },
  },

  // Here I Am to Worship
  {
    song: "Here I Am to Worship",
    en: "Light of the world, You stepped down into darkness",
    pt: "Luz do mundo, Tu desceste nas trevas",
    verse: { ref: "Salmo 27:1", en: "The Lord is my light and my salvation", pt: "O Senhor é a minha luz e a minha salvação" },
  },
  {
    song: "Here I Am to Worship",
    en: "Here I am to worship, here I am to bow down",
    pt: "Aqui estou para adorar, aqui estou para me curvar",
    verse: { ref: "Salmo 95:6", en: "Come, let us bow down in worship", pt: "Vinde, adoremos e prostremo-nos" },
  },
  {
    song: "Here I Am to Worship",
    en: "You're altogether worthy, altogether wonderful",
    pt: "Tu és completamente digno, completamente maravilhoso",
    verse: { ref: "Salmo 145:5", en: "They speak of the glorious splendor of your majesty", pt: "Falarão da glória esplêndida da tua majestade" },
  },

  // Way Maker
  {
    song: "Way Maker",
    en: "You are way maker, miracle worker",
    pt: "Tu és o Senhor dos milagres, abre caminhos",
    verse: { ref: "Salmo 77:14", en: "You are the God who performs miracles", pt: "Tu és o Deus que realiza maravilhas" },
  },
  {
    song: "Way Maker",
    en: "Promise keeper, light in the darkness",
    pt: "Guardas as promessas, és luz nas trevas",
    verse: { ref: "Salmo 119:105", en: "Your word is a lamp for my feet", pt: "A tua palavra é lâmpada para os meus pés" },
  },
  {
    song: "Way Maker",
    en: "Even when I don't see it, You're working",
    pt: "Mesmo quando não vejo, Tu estás trabalhando",
    verse: { ref: "Salmo 139:5", en: "You hem me in behind and before", pt: "Tu me cercas por detrás e por diante" },
  },

  // What a Beautiful Name
  {
    song: "What a Beautiful Name",
    en: "What a beautiful name it is",
    pt: "Que nome tão belo é este",
    verse: { ref: "Salmo 72:19", en: "Praise be to his glorious name forever", pt: "Bendito seja o seu nome glorioso para sempre" },
  },
  {
    song: "What a Beautiful Name",
    en: "Nothing compares to this name",
    pt: "Nada se compara a este nome",
    verse: { ref: "Salmo 86:8", en: "Among the gods there is none like you, Lord", pt: "Nenhum dos deuses se compara a ti, Senhor" },
  },
  {
    song: "What a Beautiful Name",
    en: "Death could not hold You, the veil tore before You",
    pt: "A morte não pôde te reter, o véu rasgou-se",
    verse: { ref: "Salmo 118:17", en: "I will not die but live, and proclaim what the Lord has done", pt: "Não morrerei, mas viverei e proclamarei as obras do Senhor" },
  },

  // Oceans (Hillsong)
  {
    song: "Oceans",
    en: "Spirit lead me where my trust is without borders",
    pt: "Espírito, guia-me onde minha fé não tem limites",
    verse: { ref: "Salmo 25:1", en: "In you, Lord my God, I put my trust", pt: "Em ti, Senhor meu Deus, eu ponho a minha confiança" },
  },
  {
    song: "Oceans",
    en: "I will call upon Your name",
    pt: "Invocarei o Teu nome",
    verse: { ref: "Salmo 116:2", en: "I will call on him as long as I live", pt: "Invocarei o seu nome enquanto eu viver" },
  },
  {
    song: "Oceans",
    en: "You are mine and I am Yours",
    pt: "Tu és meu e eu sou Teu",
    verse: { ref: "Salmo 100:3", en: "We are his people, the sheep of his pasture", pt: "Nós somos o seu povo e as ovelhas do seu pasto" },
  },

  // Goodness of God
  {
    song: "Goodness of God",
    en: "I love You, Lord, for Your mercy never fails me",
    pt: "Eu te amo, Senhor, pois Tua misericórdia nunca falha",
    verse: { ref: "Salmo 136:1", en: "Give thanks to the Lord, for he is good", pt: "Dai graças ao Senhor, pois ele é bom" },
  },
  {
    song: "Goodness of God",
    en: "All my life You have been faithful",
    pt: "Em toda a minha vida Tu tens sido fiel",
    verse: { ref: "Salmo 89:1", en: "I will sing of the Lord's great love forever", pt: "Cantarei eternamente as misericórdias do Senhor" },
  },
  {
    song: "Goodness of God",
    en: "Running after You, with Your goodness following me",
    pt: "Correndo atrás de Ti, e a Tua bondade me seguindo",
    verse: { ref: "Salmo 23:6", en: "Surely your goodness and love will follow me all my days", pt: "A bondade e a misericórdia me seguirão todos os dias da minha vida" },
  },

  // Holy Holy Holy
  {
    song: "Holy, Holy, Holy",
    en: "Holy, holy, holy, Lord God Almighty",
    pt: "Santo, santo, santo, Senhor Deus todo-poderoso",
    verse: { ref: "Salmo 99:9", en: "For the Lord our God is holy", pt: "Pois o Senhor nosso Deus é santo" },
  },
  {
    song: "Holy, Holy, Holy",
    en: "Early in the morning our song shall rise to Thee",
    pt: "De manhã cedo nosso cântico subirá a Ti",
    verse: { ref: "Salmo 5:3", en: "In the morning, Lord, you hear my voice", pt: "De manhã, Senhor, ouves a minha voz" },
  },

  // Build My Life
  {
    song: "Build My Life",
    en: "Worthy of every song we could ever sing",
    pt: "Digno de todo louvor que poderíamos cantar",
    verse: { ref: "Salmo 18:3", en: "I called to the Lord, who is worthy of praise", pt: "Invoquei o Senhor, que é digno de louvor" },
  },
  {
    song: "Build My Life",
    en: "I will build my life upon Your love",
    pt: "Edificarei minha vida sobre o Teu amor",
    verse: { ref: "Salmo 127:1", en: "Unless the Lord builds the house, the builders labor in vain", pt: "Se o Senhor não edificar a casa, em vão trabalham os que a edificam" },
  },

  // Raise a Hallelujah
  {
    song: "Raise a Hallelujah",
    en: "I raise a hallelujah in the presence of my enemies",
    pt: "Levanto um aleluia na presença dos meus inimigos",
    verse: { ref: "Salmo 23:5", en: "You prepare a table before me in the presence of my enemies", pt: "Tu preparas um banquete na presença dos meus inimigos" },
  },
  {
    song: "Raise a Hallelujah",
    en: "My praise will be my weapon and my shield",
    pt: "O meu louvor será minha arma e meu escudo",
    verse: { ref: "Salmo 28:7", en: "The Lord is my strength and my shield", pt: "O Senhor é a minha força e o meu escudo" },
  },
];

/* ─── Utilitários ─── */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ─── Componente principal ─── */
type Phase = "ready" | "recording" | "scored";

function LouvorPage() {
  const [pool, setPool] = useState<PraiseLine[]>(() => shuffle(PRAISE_POOL));
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>("ready");
  const [score, setScore] = useState<SpeechResult | null>(null);
  const [sessionCount, setSessionCount] = useState(0);
  const autoRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const line = pool[idx % pool.length];

  const { speak, speaking } = useSpeech();
  const { supported, listening, transcript, interim, error, start, stop, reset } =
    useSpeechRecognition("en-US");

  // Quando a gravação termina, calcula o score
  useEffect(() => {
    if (!listening && transcript && phase === "recording") {
      const r = evaluatePronunciation(line.en, transcript, 0.55);
      setScore(r);
      setPhase("scored");
    }
  }, [listening, transcript, phase, line.en]);

  // Auto-avança após acerto alto (≥ 80%) depois de 2 s
  useEffect(() => {
    if (phase === "scored" && score && score.accuracy >= 0.8) {
      autoRef.current = setTimeout(() => advance(), 2000);
    }
    return () => { if (autoRef.current) clearTimeout(autoRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, score]);

  const advance = () => {
    if (autoRef.current) clearTimeout(autoRef.current);
    // quando acaba o pool, reshuffle
    const nextIdx = idx + 1;
    if (nextIdx >= pool.length) setPool(shuffle(PRAISE_POOL));
    setIdx(nextIdx);
    setPhase("ready");
    setScore(null);
    reset();
    setSessionCount((n) => n + 1);
  };

  const startRecording = () => {
    reset();
    setScore(null);
    setPhase("recording");
    start();
  };

  const stopRecording = () => {
    stop();
  };

  const tryAgain = () => {
    reset();
    setScore(null);
    setPhase("ready");
  };

  const transcriptText = transcript || interim;

  return (
    <div className="min-h-screen bg-gradient-sky flex flex-col pb-6">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/treinos" className="p-1 -ml-1 text-muted-foreground" aria-label="Voltar">
            <ArrowLeft className="size-6" />
          </Link>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Fala e escuta
            </p>
            <h1 className="font-display text-base font-bold leading-tight truncate">Cantar Louvor</h1>
          </div>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-extrabold tabular-nums text-primary">
            {sessionCount} hoje
          </span>
        </div>
      </header>

      <main className="flex-1 max-w-md mx-auto w-full px-5 py-5 flex flex-col gap-4">

        {/* Badge da música */}
        <div className="flex items-center justify-between gap-3 animate-slide-up">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-card border border-border/60 px-3 py-1.5 text-xs font-bold shadow-sm min-w-0 truncate">
            🎵 {line.song}
          </span>
          <button
            onClick={() => advance()}
            className="text-[11px] font-bold text-muted-foreground flex items-center gap-1 hover:text-foreground"
          >
            Pular <ChevronRight className="size-3.5" />
          </button>
        </div>

        {/* Card da letra */}
        <section className="rounded-3xl bg-card border border-border/60 p-5 shadow-soft animate-slide-up" style={{ animationDelay: "0.05s" }}>
          {/* Botões de escuta */}
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => speak(line.en)}
              aria-label="Ouvir"
              className={`inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-4 py-2 text-xs font-extrabold active:scale-95 transition ${speaking ? "animate-pulse" : ""}`}
            >
              <Volume2 className="size-4" />
              Ouvir
            </button>
            <button
              onClick={() => speak(line.en, { rate: 0.55 })}
              className="inline-flex items-center gap-2 rounded-full bg-muted text-muted-foreground px-4 py-2 text-xs font-extrabold active:scale-95 transition"
            >
              🐢 Devagar
            </button>
          </div>

          {/* Letra em inglês com coloração de score */}
          <p className="font-display text-2xl leading-snug break-words">
            {phase === "scored" && score
              ? line.en.split(/\s+/).map((tok, i) => {
                  const norm = tok.toLowerCase().replace(/[^a-z0-9']/g, "");
                  const sc = score.scores.find((s) => s.word === norm);
                  const matched = sc?.matched ?? false;
                  return (
                    <span
                      key={i}
                      className={`mr-1 ${matched ? "text-success" : "text-destructive line-through decoration-2"}`}
                    >
                      {tok}
                    </span>
                  );
                })
              : line.en}
          </p>

          {/* Tradução */}
          <p className="text-sm text-muted-foreground mt-2 italic break-words">{line.pt}</p>

          {/* Transcrição ao vivo */}
          {(listening || transcriptText) && (
            <div className="mt-3 rounded-2xl bg-muted/60 border border-border px-4 py-2.5 min-h-[44px]">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {listening ? "Ouvindo…" : "Você disse"}
              </p>
              <p className="text-sm font-semibold text-foreground mt-0.5">
                {transcriptText || <span className="opacity-40">—</span>}
              </p>
            </div>
          )}
        </section>

        {/* Versículo relacionado */}
        <section className="rounded-3xl bg-gradient-to-br from-primary/8 via-card to-card border border-primary/20 p-4 shadow-sm animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-primary mb-2">
            <BookOpen className="size-3.5" />
            {line.verse.ref}
          </span>
          <p className="font-display text-base font-bold leading-snug text-foreground break-words">
            "{line.verse.en}"
          </p>
          <p className="text-xs text-muted-foreground italic mt-1.5 break-words">
            "{line.verse.pt}"
          </p>
        </section>

        {/* Score (fase: scored) */}
        {phase === "scored" && score && (
          <div
            className={`rounded-3xl border-2 p-4 text-center animate-pop-in ${
              score.accuracy >= 0.8
                ? "border-success/40 bg-success/10"
                : score.accuracy >= 0.5
                  ? "border-gold/40 bg-gold/10"
                  : "border-destructive/30 bg-destructive/8"
            }`}
          >
            <p className="text-3xl mb-1">
              {score.accuracy >= 0.8 ? "🎉" : score.accuracy >= 0.5 ? "👍" : "💪"}
            </p>
            <p className="font-display text-4xl font-bold tabular-nums">
              {Math.round(score.accuracy * 100)}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {score.scores.filter((s) => s.matched).length} de {score.scores.length} palavras certas
            </p>
            {score.accuracy >= 0.8 && (
              <p className="text-xs font-bold text-success mt-1">Indo para a próxima…</p>
            )}
          </div>
        )}

        {/* Erro de permissão */}
        {error === "not-allowed" && (
          <p className="text-xs text-destructive font-bold text-center rounded-2xl bg-destructive/10 px-4 py-2.5">
            Permita o acesso ao microfone para praticar a fala.
          </p>
        )}
        {!supported && (
          <p className="text-xs text-muted-foreground font-bold text-center rounded-2xl bg-muted px-4 py-2.5">
            Reconhecimento de voz não disponível. Use Chrome ou Edge.
          </p>
        )}
      </main>

      {/* Barra de ações fixa */}
      <div className="sticky bottom-0 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 bg-gradient-to-t from-background via-background/95 to-transparent">
        <div className="max-w-md mx-auto space-y-2">
          {phase === "ready" && (
            <button
              onClick={startRecording}
              disabled={!supported}
              className="w-full flex items-center justify-center gap-3 rounded-full bg-gradient-hero text-primary-foreground py-4 font-display text-base font-bold shadow-soft active:translate-y-0.5 transition disabled:opacity-40"
            >
              <Mic className="size-5" />
              Repetir em voz alta
            </button>
          )}

          {phase === "recording" && (
            <button
              onClick={stopRecording}
              className="w-full flex items-center justify-center gap-3 rounded-full bg-destructive text-white py-4 font-display text-base font-bold shadow-soft active:translate-y-0.5 animate-pulse"
            >
              <Mic className="size-5" />
              Parar gravação
            </button>
          )}

          {phase === "scored" && (
            <div className="flex gap-2">
              {score && score.accuracy < 0.8 && (
                <button
                  onClick={tryAgain}
                  className="flex-1 flex items-center justify-center gap-2 rounded-full bg-card border-2 border-border py-3.5 font-bold text-sm text-foreground active:translate-y-0.5 transition"
                >
                  <RotateCcw className="size-4" />
                  Tentar de novo
                </button>
              )}
              <button
                onClick={advance}
                className={`flex items-center justify-center gap-2 rounded-full bg-gradient-hero text-primary-foreground py-3.5 font-bold text-sm shadow-soft active:translate-y-0.5 transition ${
                  score && score.accuracy < 0.8 ? "flex-1" : "w-full"
                }`}
              >
                <CheckCircle2 className="size-4" />
                Próxima linha
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
