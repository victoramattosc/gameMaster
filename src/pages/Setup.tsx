import React from "react";
import { Logo } from "ui/Icons";

export function SetupPage() {
  return (
    <div className="gm-center-screen">
      <div className="gm-sec" style={{ maxWidth: 560, textAlign: "left" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Logo size={56} />
          <h1 className="gm-display" style={{ fontSize: 30 }}>Configure o Supabase</h1>
        </div>
        <p>O Game Master precisa de um projeto Supabase para contas, mesas e fichas em tempo real.</p>
        <ol style={{ listStyle: "decimal", paddingLeft: 20, display: "flex", flexDirection: "column", gap: 6 }}>
          <li>Crie um projeto em supabase.com.</li>
          <li>No SQL Editor, rode <code>supabase/migrations/0001_init.sql</code>.</li>
          <li>Copie <code>.env.example</code> para <code>.env.local</code> e preencha URL e anon key.</li>
          <li>Reinicie o <code>npm start</code>.</li>
        </ol>
      </div>
    </div>
  );
}
