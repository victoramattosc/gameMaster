import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "auth/AuthProvider";
import { deleteMesaFile, updateFileMeta, uploadMesaFile, useFiles, useMesa, useSignedUrl } from "data/api";
import { errorMessage } from "lib/supabase";
import { SYSTEMS } from "systems";
import { IconBack, IconBook, IconSearch } from "ui/Icons";
import { Spinner } from "ui/bits";
import { useConfirm } from "ui/Confirm";
import { useUploadGuard } from "ui/Toast";
import styles from "./Book.module.scss";

const MARK_KEY = (id: string) => `gm_book_mark_${id}`;

export function BookPage() {
  const { id } = useParams();
  const { profile } = useAuth();
  const confirm = useConfirm();
  const guard = useUploadGuard();
  const { mesa, members } = useMesa(id);
  const files = useFiles(id);
  const books = useMemo(() => files.data.filter((f) => f.kind === "book"), [files.data]);
  const [bookId, setBookId] = useState<string | null>(null);
  const book = books.find((b) => b.id === bookId) || books[0];
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [search, setSearch] = useState("");
  const [applied, setApplied] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [tocDraft, setTocDraft] = useState({ title: "", page: "" });
  const url = useSignedUrl(book?.path);
  const isGm = members.data.some((m) => m.user_id === profile?.id && m.role === "gm");

  // Ao trocar de livro, volta para a página marcada (se houver).
  useEffect(() => {
    if (!book) return;
    let mark = 1;
    try {
      mark = Number(localStorage.getItem(MARK_KEY(book.id))) || 1;
    } catch {
      /* armazenamento indisponível */
    }
    setPage(mark);
    setApplied("");
  }, [book?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (mesa.loading || files.loading) return <Spinner label="Abrindo o livro…" />;
  if (!mesa.data) return <div className="gm-center-screen"><Link to="/mesas">Mesa não encontrada</Link></div>;

  const toc = book?.meta?.toc || [];
  const total = book?.meta?.pages;
  const chapter = toc.filter(([, p]) => p <= page).pop()?.[0];
  const src = url ? `${url}#page=${page}&zoom=${zoom}${applied ? `&search=${encodeURIComponent(applied)}` : ""}` : "";
  const sys = SYSTEMS[mesa.data.system];

  async function upload(f: File | undefined) {
    if (!f || !profile || !id) return;
    setBusy(true);
    setErr("");
    try {
      const created = await uploadMesaFile(id, profile.id, f, "book");
      setBookId(created.id);
    } catch (e) {
      setErr(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function saveToc(next: [string, number][], pages?: number) {
    if (!book) return;
    try {
      await updateFileMeta(book.id, { ...book.meta, toc: next.sort((a, b) => a[1] - b[1]), pages: pages ?? book.meta.pages });
    } catch (e) {
      setErr(errorMessage(e));
    }
  }

  function mark() {
    if (!book) return;
    try {
      localStorage.setItem(MARK_KEY(book.id), String(page));
    } catch {
      /* ignora */
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to={`/mesa/${id}`} className="gm-btn gm-ib gm-ib--round" aria-label="Voltar para a mesa"><IconBack /></Link>
        <IconBook size={28} color="#e0a040" />
        <div style={{ flex: "1 1 240px", minWidth: 0 }}>
          <div className="gm-display" style={{ fontSize: 24, lineHeight: 1.1 }}>{book?.name || "Livro de regras"}</div>
          <div style={{ fontSize: 13, color: "#c9b48a" }}>Livros da mesa “{mesa.data.name}” · visível para mestre e jogadores</div>
        </div>
        <form
          className={styles.search}
          onSubmit={(e) => {
            e.preventDefault();
            setApplied(search.trim());
          }}
        >
          <IconSearch size={18} color="#c9b48a" />
          <input className="gm-in" aria-label="Buscar no livro" placeholder="Buscar no livro" value={search} onChange={(e) => setSearch(e.target.value)} />
        </form>
      </header>

      <div className={styles.body}>
        <aside className={styles.aside}>
          <div className={styles.group}>
            <div className="gm-eyebrow" style={{ color: "#c9b48a" }}>Livros da mesa</div>
            {books.map((b) => (
              <div key={b.id} style={{ display: "flex", gap: 6 }}>
                <button type="button" className={`gm-btn ${styles.bookBtn} ${b.id === book?.id ? styles.bookOn : ""}`} onClick={() => setBookId(b.id)}>
                  <span className={styles.spine} style={{ background: b.id === books[0]?.id ? sys.color : "#8a6a2e" }} />
                  <span style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                    <span style={{ display: "block", fontWeight: 800 }}>{b.name}</span>
                    <span style={{ fontSize: 13, color: "#c9b48a" }}>{b.meta?.pages ? `${b.meta.pages} páginas · ` : ""}PDF</span>
                  </span>
                </button>
                {isGm && (
                  <button type="button" className="gm-btn gm-ib" style={{ height: "auto" }} aria-label={`Remover ${b.name}`} onClick={async () => (await confirm({ title: `Remover “${b.name}”?`, message: "O livro deixa de aparecer para a mesa.", confirmLabel: "Remover", danger: true })) && deleteMesaFile(b)}>✕</button>
                )}
              </div>
            ))}
            {books.length === 0 && <div style={{ color: "#9c8768", fontSize: 14 }}>{isGm ? "Nenhum livro ainda. Envie o PDF de regras." : "O mestre ainda não enviou o livro de regras."}</div>}
            {isGm && (
              <label className="gm-btn gm-btn--tool" style={{ cursor: "pointer" }}>
                {busy ? "Enviando…" : "+ Enviar PDF (livro ou suplemento)"}
                <input type="file" accept="application/pdf" className="gm-sr" onChange={(e) => upload(guard(e.target)[0])} />
              </label>
            )}
          </div>

          {book && (
            <div className={styles.group}>
              <div className="gm-eyebrow" style={{ color: "#c9b48a" }}>Sumário</div>
              {toc.length === 0 && <div style={{ color: "#9c8768", fontSize: 14 }}>{isGm ? "Adicione capítulos para o grupo pular direto para eles." : "Sem sumário cadastrado."}</div>}
              {toc.map(([title, p], i) => (
                <div key={i} style={{ display: "flex", gap: 4 }}>
                  <button type="button" className={`gm-btn ${styles.tocBtn} ${chapter === title ? styles.tocOn : ""}`} onClick={() => setPage(p)}>
                    <span style={{ flex: 1, textAlign: "left" }}>{title}</span>
                    <span style={{ color: "#c9b48a", fontSize: 13 }}>p. {p}</span>
                  </button>
                  {isGm && <button type="button" className="gm-btn" style={{ background: "none", color: "#9c8768" }} aria-label={`Remover ${title}`} onClick={() => saveToc(toc.filter((_, j) => j !== i))}>×</button>}
                </div>
              ))}
              {isGm && (
                <form
                  style={{ display: "flex", gap: 6 }}
                  onSubmit={(e) => {
                    e.preventDefault();
                    const p = Number(tocDraft.page) || page;
                    if (!tocDraft.title.trim()) return;
                    saveToc([...toc, [tocDraft.title.trim(), p]]);
                    setTocDraft({ title: "", page: "" });
                  }}
                >
                  <input className="gm-in gm-in--dark" style={{ flex: 1, height: 38 }} placeholder="Capítulo" aria-label="Título do capítulo" value={tocDraft.title} onChange={(e) => setTocDraft({ ...tocDraft, title: e.target.value })} />
                  <input className="gm-in gm-in--dark" style={{ width: 64, height: 38 }} placeholder={String(page)} aria-label="Página" inputMode="numeric" value={tocDraft.page} onChange={(e) => setTocDraft({ ...tocDraft, page: e.target.value })} />
                  <button type="submit" className="gm-btn gm-ib" style={{ height: 38, width: 38 }} aria-label="Adicionar capítulo">+</button>
                </form>
              )}
              {isGm && (
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#c9b48a" }}>
                  Total de páginas
                  <input className="gm-in gm-in--dark" style={{ width: 80, height: 34 }} inputMode="numeric" defaultValue={total || ""} onBlur={(e) => saveToc(toc, Number(e.target.value) || undefined)} />
                </label>
              )}
            </div>
          )}
          {err && <div className="gm-error gm-error--dark">{err}</div>}
        </aside>

        <main className={styles.main}>
          {book ? (
            <>
              <div className={styles.toolbar}>
                <button type="button" className="gm-btn gm-ib" onClick={() => setPage(Math.max(1, page - 1))} aria-label="Página anterior">‹</button>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700 }}>
                  Página
                  <input className="gm-in gm-in--dark gm-num" style={{ width: 64, height: 40, textAlign: "center", fontSize: 18 }} inputMode="numeric" value={page} onChange={(e) => setPage(Math.max(1, Number(e.target.value) || 1))} aria-label="Número da página" />
                  {total ? `de ${total}` : ""}
                </label>
                <button type="button" className="gm-btn gm-ib" onClick={() => setPage(total ? Math.min(total, page + 1) : page + 1)} aria-label="Próxima página">›</button>
                <span className={styles.sep} />
                <button type="button" className="gm-btn gm-ib" style={{ color: "#f1e6cc" }} onClick={() => setZoom(Math.max(50, zoom - 25))} aria-label="Diminuir zoom">−</button>
                <span style={{ width: 54, textAlign: "center", fontWeight: 700 }}>{zoom}%</span>
                <button type="button" className="gm-btn gm-ib" style={{ color: "#f1e6cc" }} onClick={() => setZoom(Math.min(250, zoom + 25))} aria-label="Aumentar zoom">+</button>
                <button type="button" className="gm-btn gm-btn--tool" onClick={mark}>Marcar página</button>
                {url && <a className="gm-btn gm-btn--ghost-dark" href={src} target="_blank" rel="noopener noreferrer">Abrir em nova aba</a>}
              </div>
              {chapter && <div style={{ color: "#c9b48a", fontWeight: 700 }}>{chapter}</div>}
              <div className={styles.viewer}>
                {src ? <iframe key={src} title={book.name} src={src} /> : <div className="gm-center-screen" style={{ minHeight: 300 }}>Carregando PDF…</div>}
              </div>
              <div style={{ fontSize: 13, color: "#9c8768" }}>
                Se o PDF não aparecer aqui (alguns celulares não exibem PDF embutido), use “Abrir em nova aba”.
              </div>
            </>
          ) : (
            <div className="gm-center-screen" style={{ minHeight: 400 }}>Nenhum livro nesta mesa ainda.</div>
          )}
        </main>
      </div>
    </div>
  );
}

