import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff, Mail, Lock, User, Loader2, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import doveMascot from "@/assets/dove-mascot.png";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — Lumen" },
      { name: "description", content: "Entre ou crie sua conta no Lumen." },
    ],
  }),
  component: AuthPage,
});

type Mode = "login" | "register";

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Redireciona se já estiver logado
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate({ to: "/" });
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (mode === "register") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: name || email.split("@")[0] },
          },
        });
        if (error) throw error;

        // Se a sessão já veio (confirmação de e-mail desativada), entra direto
        if (data.session) {
          navigate({ to: "/" });
          return;
        }

        // Tenta fazer login mesmo assim (por se a confirmação estiver desligada no projeto)
        const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
        if (!loginError) {
          navigate({ to: "/" });
          return;
        }

        // Confirmação de e-mail obrigatória — pede para o usuário verificar
        setSuccess("Conta criada! Verifique seu e-mail e depois faça login.");
        setMode("login");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/" });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      // Traduz mensagens comuns
      if (msg.includes("Invalid login credentials")) {
        setError("E-mail ou senha incorretos.");
      } else if (msg.includes("Email not confirmed")) {
        setError("Confirme seu e-mail antes de entrar.");
      } else if (msg.includes("already registered")) {
        setError("Este e-mail já está cadastrado. Faça login.");
      } else if (msg.includes("Password should be")) {
        setError("A senha deve ter pelo menos 6 caracteres.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const continueAsGuest = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInAnonymously();
      // Se login anônimo não estiver habilitado no projeto, segue mesmo assim
      if (error && !error.message.includes("not enabled")) throw error;
    } catch (err) {
      // Falha silenciosa — app funciona offline com localStorage
      console.warn("Login anônimo indisponível, continuando sem auth:", err);
    } finally {
      setLoading(false);
      navigate({ to: "/" });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-sky flex flex-col items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8 animate-slide-up">
          <div className="size-16 rounded-3xl bg-gradient-hero shadow-soft flex items-center justify-center mb-3">
            <img src={doveMascot} alt="" aria-hidden="true" className="size-11 object-contain" />
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground">Lumen</h1>
          <p className="text-sm text-muted-foreground mt-1">Inglês com os Salmos</p>
        </div>

        {/* Card */}
        <div className="bg-card rounded-3xl border border-border/60 shadow-soft p-6 animate-slide-up" style={{ animationDelay: "0.06s" }}>

          {/* Toggle login/register */}
          <div className="flex rounded-2xl bg-muted p-1 mb-6">
            {(["login", "register"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(null); setSuccess(null); }}
                className={`flex-1 py-2 rounded-xl text-sm font-bold transition ${
                  mode === m
                    ? "bg-card shadow-sm text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {m === "login" ? "Entrar" : "Criar conta"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">

            {/* Nome (só no register) */}
            {mode === "register" && (
              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground block mb-1.5">
                  Seu nome
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Como quer ser chamado?"
                    autoComplete="name"
                    className="w-full rounded-2xl border border-border bg-background pl-10 pr-4 py-3 text-sm font-semibold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                  />
                </div>
              </div>
            )}

            {/* E-mail */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground block mb-1.5">
                E-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  autoComplete="email"
                  className="w-full rounded-2xl border border-border bg-background pl-10 pr-4 py-3 text-sm font-semibold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                />
              </div>
            </div>

            {/* Senha */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground block mb-1.5">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "register" ? "Mínimo 6 caracteres" : "Sua senha"}
                  required
                  minLength={6}
                  autoComplete={mode === "register" ? "new-password" : "current-password"}
                  className="w-full rounded-2xl border border-border bg-background pl-10 pr-12 py-3 text-sm font-semibold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                  aria-label={showPassword ? "Esconder senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {/* Mensagens */}
            {error && (
              <p className="text-xs font-semibold text-destructive bg-destructive/10 rounded-xl px-3 py-2.5">
                {error}
              </p>
            )}
            {success && (
              <p className="text-xs font-semibold text-success bg-success/10 rounded-xl px-3 py-2.5">
                {success}
              </p>
            )}

            {/* Botão principal */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-full bg-gradient-hero text-primary-foreground py-3.5 font-display text-sm font-bold shadow-soft active:translate-y-0.5 transition disabled:opacity-60 mt-2"
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : mode === "login" ? (
                "Entrar"
              ) : (
                "Criar minha conta"
              )}
            </button>
          </form>
        </div>

        {/* Continuar sem conta */}
        <div className="mt-5 text-center animate-slide-up" style={{ animationDelay: "0.12s" }}>
          <button
            onClick={continueAsGuest}
            disabled={loading}
            className="text-sm font-bold text-muted-foreground hover:text-foreground transition inline-flex items-center gap-1.5"
          >
            <BookOpen className="size-3.5" />
            Continuar sem criar conta
          </button>
          <p className="text-xs text-muted-foreground mt-1 opacity-70">
            Progresso salvo apenas neste dispositivo
          </p>
        </div>

      </div>
    </div>
  );
}
