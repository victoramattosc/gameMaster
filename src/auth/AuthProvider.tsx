import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "lib/supabase";
import type { Profile } from "lib/types";
import { flushOutbox, getDb, startLocalData, stopLocalData } from "db";

async function cacheProfile(p: Profile) {
  try {
    const db = await getDb();
    await db.profiles.upsert(p);
  } catch {
    /* sem banco local: segue só online */
  }
}

interface AuthValue {
  loading: boolean;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  signIn(email: string, password: string): Promise<void>;
  signUp(email: string, password: string, displayName: string): Promise<{ needsConfirmation: boolean }>;
  signOut(): Promise<void>;
  updateProfile(patch: Partial<Pick<Profile, "display_name" | "color" | "dice_anim">>): Promise<void>;
  refreshProfile(): Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  /** Mostra o perfil guardado no aparelho na hora e confere com o servidor em seguida. */
  const loadProfile = useCallback(async (uid: string | undefined) => {
    if (!uid) {
      setProfile(null);
      void stopLocalData();
      return;
    }
    let cached: Profile | null = null;
    try {
      await startLocalData(uid);
      const doc = await (await getDb()).profiles.findOne(uid).exec();
      cached = doc ? (doc.toJSON() as Profile) : null;
      if (cached) setProfile(cached);
    } catch (e) {
      console.warn("[db] banco local indisponível", e);
    }
    const fromServer = supabase
      .from("profiles")
      .select("*")
      .eq("id", uid)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) return; // offline: fica o do aparelho
        setProfile((data as Profile) ?? null);
        if (data) void cacheProfile(data as Profile);
      });
    if (!cached) await fromServer;
  }, []);

  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!alive) return;
      setSession(data.session);
      await loadProfile(data.session?.user.id);
      if (alive) setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      // O perfil é criado por trigger no cadastro; carregamos fora do callback para não travar o auth.
      setTimeout(() => loadProfile(s?.user.id), 0);
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const value = useMemo<AuthValue>(
    () => ({
      loading,
      session,
      user: session?.user ?? null,
      profile,
      async signIn(email, password) {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
      },
      async signUp(email, password, displayName) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { display_name: displayName.trim() },
            emailRedirectTo: window.location.origin + "/mesas",
          },
        });
        if (error) throw error;
        return { needsConfirmation: !data.session };
      },
      async signOut() {
        // Envia o que ficou pendente e apaga os dados deste usuário do aparelho.
        await flushOutbox().catch(() => undefined);
        await stopLocalData(true);
        await supabase.auth.signOut();
        setProfile(null);
      },
      async updateProfile(patch) {
        if (!session) return;
        const { data, error } = await supabase
          .from("profiles")
          .update(patch)
          .eq("id", session.user.id)
          .select()
          .single();
        if (error) throw error;
        setProfile(data as Profile);
        void cacheProfile(data as Profile);
      },
      async refreshProfile() {
        await loadProfile(session?.user.id);
      },
    }),
    [loading, session, profile, loadProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth precisa estar dentro de <AuthProvider>");
  return ctx;
}
