import { createClient, SupabaseClient } from "@supabase/supabase-js";

const url = process.env.REACT_APP_SUPABASE_URL;
const anonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  url && anonKey && !url.includes("SEU-PROJETO"),
);

// Quando o .env.local ainda não foi preenchido o app mostra uma tela de configuração
// em vez de quebrar; o cliente é criado com valores inofensivos só para tipar.
export const supabase: SupabaseClient = createClient(
  isSupabaseConfigured ? (url as string) : "http://localhost:54321",
  isSupabaseConfigured ? (anonKey as string) : "public-anon-key",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);

/** Converte erros do Supabase/Postgres em uma frase legível. */
export function errorMessage(err: unknown): string {
  if (!err) return "Algo deu errado.";
  const msg =
    typeof err === "string"
      ? err
      : (err as { message?: string }).message || String(err);
  if (/Invalid login credentials/i.test(msg))
    return "E-mail ou senha incorretos.";
  if (/User already registered/i.test(msg))
    return "Já existe uma conta com esse e-mail.";
  if (/Email not confirmed/i.test(msg))
    return "Confirme seu e-mail antes de entrar (veja sua caixa de entrada).";
  if (/Password should be at least/i.test(msg))
    return "A senha precisa ter pelo menos 6 caracteres.";
  if (/Failed to fetch/i.test(msg)) return "Sem conexão com o servidor.";
  return msg;
}
