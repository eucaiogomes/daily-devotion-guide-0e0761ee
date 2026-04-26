import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import {
  disableDailyReminder,
  registerForPushNotifications,
  scheduleDailyReminder,
} from "@/lib/nativeNotifications";
import {
  getReminderSettings,
  saveReminderSettings,
  syncOfflineMissions,
} from "@/lib/offlineMission";
import { findCurrentDay } from "@/lib/lessonProgress";
import { TOTAL_DAYS } from "@/data/psalms";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "@tanstack/react-router";
import {
  Bell,
  CheckCircle2,
  WifiOff,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  BookOpen,
  Star,
  Info,
  Flame,
  LogOut,
  UserCircle,
} from "lucide-react";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações — Lumen" },
      { name: "description", content: "Ajuste lembretes, aparência e preferências do Lumen." },
    ],
  }),
  component: ConfigPage,
});

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="toggle-track shrink-0"
    >
      <span className="toggle-thumb" />
    </button>
  );
}

function SettingRow({
  icon,
  title,
  description,
  right,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  right: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 py-3.5 border-b border-border/50 last:border-0">
      <div className="size-9 rounded-xl bg-muted flex items-center justify-center text-foreground shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-foreground">{title}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{description}</p>
        )}
      </div>
      {right}
    </div>
  );
}

function ConfigPage() {
  const { user, displayName, signOut } = useAuth();
  const navigate = useNavigate();
  const [online, setOnline] = useState(true);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState("08:00");
  const [message, setMessage] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentDay, setCurrentDay] = useState(1);

  useEffect(() => {
    const settings = getReminderSettings();
    setReminderEnabled(settings.enabled);
    setReminderTime(settings.time);
    setOnline(typeof navigator === "undefined" ? true : navigator.onLine);

    // Dark mode
    const savedDark = localStorage.getItem("lumen:dark-mode") === "true";
    setDarkMode(savedDark);

    // Sound
    const savedSound = localStorage.getItem("lumen:sound") !== "false";
    setSoundEnabled(savedSound);

    // Current day
    setCurrentDay(findCurrentDay(1, TOTAL_DAYS));

    const onOnline = () => {
      setOnline(true);
      syncOfflineMissions().then((result) => {
        if (result.synced > 0) setMessage("Progresso sincronizado com sucesso.");
      });
    };
    const onOffline = () => setOnline(false);

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    syncOfflineMissions().catch(() => undefined);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  const toggleReminder = async () => {
    if (reminderEnabled) {
      await disableDailyReminder();
      setReminderEnabled(false);
      saveReminderSettings({ enabled: false, time: reminderTime });
      setMessage("Lembrete desativado.");
      return;
    }
    await scheduleDailyReminder(reminderTime);
    const push = await registerForPushNotifications();
    setReminderEnabled(true);
    saveReminderSettings({ enabled: true, time: reminderTime });
    setMessage(
      push.registered
        ? "Lembrete ativado neste dispositivo."
        : "Lembrete local ativado.",
    );
  };

  const toggleDark = (v: boolean) => {
    setDarkMode(v);
    localStorage.setItem("lumen:dark-mode", String(v));
    if (v) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  };

  const toggleSound = (v: boolean) => {
    setSoundEnabled(v);
    localStorage.setItem("lumen:sound", String(v));
  };

  const yearProgress = Math.round((currentDay / TOTAL_DAYS) * 100);

  return (
    <div className="min-h-screen bg-gradient-sky pb-28">
      <AppHeader streak={3} gold={42} hearts={5} />

      <main className="mx-auto max-w-md px-5 pt-6 space-y-4">
        <header className="animate-slide-up">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Preferências
          </p>
          <h1 className="font-display text-3xl font-bold leading-tight">Configurações</h1>
        </header>

        {/* Lembrete diário */}
        <section className="rounded-3xl border border-border/60 bg-card p-5 shadow-soft animate-slide-up" style={{ animationDelay: "0.06s" }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Bell className="size-4" />
            </div>
            <h2 className="font-display text-lg font-bold">Lembrete diário</h2>
            {online ? (
              <CheckCircle2 className="size-4 text-success ml-auto" />
            ) : (
              <WifiOff className="size-4 text-muted-foreground ml-auto" />
            )}
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            Escolha um horário para receber uma notificação lembrando você do devocional.
          </p>

          {message && (
            <p className="mb-3 text-xs font-semibold text-primary bg-primary/10 rounded-xl px-3 py-2">
              {message}
            </p>
          )}

          <div className="grid grid-cols-[1fr_auto] gap-2">
            <label className="rounded-2xl border border-border bg-background px-4 py-2.5 cursor-pointer">
              <span className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Horário
              </span>
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="mt-1 w-full bg-transparent font-bold text-foreground outline-none text-sm"
              />
            </label>
            <button
              onClick={toggleReminder}
              className={`inline-flex items-center justify-center gap-2 rounded-full px-5 text-sm font-extrabold shadow-soft active:translate-y-0.5 transition ${
                reminderEnabled
                  ? "bg-success text-success-foreground"
                  : "bg-gradient-hero text-primary-foreground"
              }`}
            >
              <Bell className="size-4" />
              {reminderEnabled ? "Ativo" : "Ativar"}
            </button>
          </div>
        </section>

        {/* Aparência */}
        <section className="rounded-3xl border border-border/60 bg-card px-5 shadow-soft animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <div className="flex items-center gap-2 pt-4 pb-2 border-b border-border/50">
            <div className="size-8 rounded-xl bg-muted flex items-center justify-center">
              {darkMode ? <Moon className="size-4" /> : <Sun className="size-4" />}
            </div>
            <p className="font-display text-lg font-bold">Aparência</p>
          </div>

          <SettingRow
            icon={darkMode ? <Moon className="size-4" /> : <Sun className="size-4" />}
            title="Modo escuro"
            description="Fundo escuro para usar de noite"
            right={<Toggle checked={darkMode} onChange={toggleDark} label="Ativar modo escuro" />}
          />

          <SettingRow
            icon={soundEnabled ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
            title="Sons e áudio"
            description="Efeitos sonoros nas lições"
            right={<Toggle checked={soundEnabled} onChange={toggleSound} label="Ativar sons" />}
          />

          <div className="pb-2" />
        </section>

        {/* Meu progresso */}
        <section className="rounded-3xl border border-border/60 bg-card p-5 shadow-soft animate-slide-up" style={{ animationDelay: "0.14s" }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="size-8 rounded-xl bg-gold/10 text-gold flex items-center justify-center">
              <Star className="size-4 fill-current" />
            </div>
            <h2 className="font-display text-lg font-bold">Meu progresso</h2>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="rounded-2xl bg-primary/10 p-3 text-center">
              <p className="font-display text-2xl font-bold text-primary tabular-nums">{currentDay}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-primary/70 mt-1">Dias</p>
            </div>
            <div className="rounded-2xl bg-streak/10 p-3 text-center">
              <p className="font-display text-2xl font-bold text-streak tabular-nums flex items-center justify-center gap-1">
                <Flame className="size-4 fill-current" />3
              </p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-streak/70 mt-1">Sequência</p>
            </div>
            <div className="rounded-2xl bg-success/10 p-3 text-center">
              <p className="font-display text-2xl font-bold text-success tabular-nums">{yearProgress}%</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-success/70 mt-1">Jornada</p>
            </div>
          </div>

          {/* Barra de progresso geral */}
          <div>
            <div className="flex justify-between text-[10px] font-bold text-muted-foreground mb-1.5">
              <span>Dia {currentDay}</span>
              <span>{TOTAL_DAYS} dias no total</span>
            </div>
            <div className="h-2.5 rounded-full bg-border overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-hero transition-all duration-700"
                style={{ width: `${Math.max(yearProgress, 1)}%` }}
              />
            </div>
          </div>
        </section>

        {/* Minha conta */}
        <section className="rounded-3xl border border-border/60 bg-card px-5 shadow-soft animate-slide-up" style={{ animationDelay: "0.18s" }}>
          <div className="flex items-center gap-2 pt-4 pb-2 border-b border-border/50">
            <div className="size-8 rounded-xl bg-muted flex items-center justify-center">
              <UserCircle className="size-4" />
            </div>
            <p className="font-display text-lg font-bold">Minha conta</p>
          </div>

          <div className="py-3.5 space-y-1">
            <p className="text-sm font-bold text-foreground">
              {displayName ?? "Visitante"}
            </p>
            <p className="text-xs text-muted-foreground">
              {user?.is_anonymous ? "Conta visitante · progresso local" : user?.email}
            </p>
          </div>

          {user?.is_anonymous ? (
            <div className="pb-4">
              <p className="text-xs text-muted-foreground mb-3">
                Crie uma conta para salvar seu progresso em qualquer dispositivo.
              </p>
              <button
                onClick={() => navigate({ to: "/auth" })}
                className="w-full rounded-full bg-gradient-hero text-primary-foreground py-3 text-sm font-bold shadow-soft active:translate-y-0.5 transition"
              >
                Criar conta gratuita
              </button>
            </div>
          ) : (
            <div className="pb-4">
              <button
                onClick={async () => { await signOut(); navigate({ to: "/auth" }); }}
                className="w-full flex items-center justify-center gap-2 rounded-full border-2 border-border bg-background py-3 text-sm font-bold text-foreground active:translate-y-0.5 transition"
              >
                <LogOut className="size-4" />
                Sair da conta
              </button>
            </div>
          )}
        </section>

        {/* Sobre */}
        <section className="rounded-3xl border border-border/60 bg-card p-5 shadow-soft animate-slide-up" style={{ animationDelay: "0.22s" }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="size-8 rounded-xl bg-muted flex items-center justify-center">
              <Info className="size-4" />
            </div>
            <h2 className="font-display text-lg font-bold">Sobre o Lumen</h2>
          </div>

          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              Aprenda inglês em 365 dias com um devocional guiado por dia, baseado nos Salmos.
            </p>
            <p>
              Cada dia tem vocabulário, pronúncia, louvor e oração — tudo simples e no seu ritmo.
            </p>
          </div>

          <div className="mt-4 flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-[11px] font-bold text-muted-foreground">
              <BookOpen className="size-3.5" />
              30 Salmos · 365 dias
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-[11px] font-bold text-muted-foreground">
              Versão 1.0
            </div>
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
