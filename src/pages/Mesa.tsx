import React from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "auth/AuthProvider";
import { useMesa } from "data/api";
import { Spinner } from "ui/bits";
import { GmPanel } from "./gm/GmPanel";
import { SheetPage } from "./sheet/SheetPage";

/** /mesa/:id — mestre vê o painel; jogador vê a própria ficha. */
export function MesaPage() {
  const { id } = useParams();
  const { profile } = useAuth();
  const { mesa, members } = useMesa(id);

  if (mesa.loading || members.loading || !profile) return <Spinner label="Abrindo a mesa…" />;
  const me = members.data.find((m) => m.user_id === profile.id);
  if (!mesa.data || !me) {
    return (
      <div className="gm-center-screen">
        <div>
          <p style={{ marginBottom: 12 }}>Você não faz parte desta mesa (ou ela foi apagada).</p>
          <Link to="/mesas">Voltar para minhas mesas</Link>
        </div>
      </div>
    );
  }
  return me.role === "gm" ? (
    <GmPanel mesa={mesa.data} members={members.data} reloadMembers={members.reload} />
  ) : (
    <SheetPage mesa={mesa.data} />
  );
}
