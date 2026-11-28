import React from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "auth/AuthProvider";
import { isSupabaseConfigured } from "lib/supabase";
import { Spinner } from "ui/bits";
import { ConfirmProvider } from "ui/Confirm";
import { ToastProvider } from "ui/Toast";
import { LoginPage } from "pages/Login";
import { LobbyPage } from "pages/Lobby";
import { NewMesaPage } from "pages/NewMesa";
import { MesaPage } from "pages/Mesa";
import { BookPage } from "pages/Book";
import { SetupPage } from "pages/Setup";

function RequireAuth({ children }: { children: React.ReactElement }) {
  const { loading, session } = useAuth();
  const loc = useLocation();
  if (loading) return <Spinner />;
  if (!session) return <Navigate to={`/entrar?voltar=${encodeURIComponent(loc.pathname + loc.search)}`} replace />;
  return children;
}

export function App() {
  if (!isSupabaseConfigured) return <SetupPage />;
  return (
    <AuthProvider>
      <ToastProvider>
      <ConfirmProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/entrar" element={<LoginPage />} />
          <Route path="/mesas" element={<RequireAuth><LobbyPage /></RequireAuth>} />
          <Route path="/mesas/nova" element={<RequireAuth><NewMesaPage /></RequireAuth>} />
          <Route path="/mesa/:id" element={<RequireAuth><MesaPage /></RequireAuth>} />
          <Route path="/mesa/:id/livro" element={<RequireAuth><BookPage /></RequireAuth>} />
          <Route path="*" element={<Navigate to="/mesas" replace />} />
        </Routes>
      </BrowserRouter>
      </ConfirmProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
