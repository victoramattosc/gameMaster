import React, { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import jsQR from "jsqr";
import { CardShell } from "./Popover";
import styles from "./Qr.module.scss";

/** QR code desenhado com as cores do pergaminho. */
export function QrCode({ value, size = 168, label }: { value: string; size?: number; label?: string }) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    let alive = true;
    QRCode.toDataURL(value, { margin: 1, width: size * 2, errorCorrectionLevel: "M", color: { dark: "#2b1f16", light: "#fbf5e6" } })
      .then((u) => alive && setSrc(u))
      .catch(() => alive && setSrc(""));
    return () => {
      alive = false;
    };
  }, [value, size]);
  return (
    <span className={styles.qr} style={{ width: size, height: size }}>
      {src ? <img src={src} alt={label || "QR code do convite"} width={size} height={size} /> : null}
    </span>
  );
}

/** Extrai o código de convite de um link (…?convite=XXX) ou do próprio texto. */
export function parseInviteCode(text: string): string | null {
  const t = text.trim();
  try {
    const u = new URL(t);
    const c = u.searchParams.get("convite");
    if (c) return c.toUpperCase();
  } catch {
    /* não é URL */
  }
  const m = t.toUpperCase().match(/[A-Z]{1,5}-[A-Z0-9]{4}/);
  return m ? m[0] : null;
}

type Detector = { detect(src: CanvasImageSource): Promise<{ rawValue: string }[]> };

/** Leitor de QR pela câmera. Usa BarcodeDetector quando existe e jsQR como alternativa. */
export function QrScanner({ onResult, onClose }: { onResult(code: string): void; onClose(): void }) {
  const video = useRef<HTMLVideoElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [err, setErr] = useState("");
  const [hint, setHint] = useState("Aponte a câmera para o QR code do convite.");

  useEffect(() => {
    let stream: MediaStream | null = null;
    let raf = 0;
    let stopped = false;
    let detector: Detector | null = null;
    const W = window as unknown as { BarcodeDetector?: new (o: { formats: string[] }) => Detector };
    if (W.BarcodeDetector) {
      try {
        detector = new W.BarcodeDetector({ formats: ["qr_code"] });
      } catch {
        detector = null;
      }
    }

    const handle = (text: string) => {
      const code = parseInviteCode(text);
      if (code) {
        stopped = true;
        onResult(code);
      } else {
        setHint("Esse QR não é um convite do Game Master.");
      }
    };

    const tick = async () => {
      if (stopped) return;
      const v = video.current;
      const c = canvas.current;
      if (v && c && v.readyState >= 2 && v.videoWidth) {
        try {
          if (detector) {
            const found = await detector.detect(v);
            if (found[0]?.rawValue) return handle(found[0].rawValue);
          } else {
            const w = Math.min(640, v.videoWidth);
            const h = Math.round((v.videoHeight / v.videoWidth) * w);
            c.width = w;
            c.height = h;
            const ctx = c.getContext("2d", { willReadFrequently: true });
            if (ctx) {
              ctx.drawImage(v, 0, 0, w, h);
              const img = ctx.getImageData(0, 0, w, h);
              const res = jsQR(img.data, w, h, { inversionAttempts: "dontInvert" });
              if (res?.data) return handle(res.data);
            }
          }
        } catch {
          /* tenta no próximo quadro */
        }
      }
      raf = requestAnimationFrame(tick);
    };

    (async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setErr("Este navegador não dá acesso à câmera. Digite o código ou use o link.");
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
        if (stopped) return;
        if (video.current) {
          video.current.srcObject = stream;
          await video.current.play().catch(() => undefined);
        }
        raf = requestAnimationFrame(tick);
      } catch {
        setErr("Não conseguimos abrir a câmera. Libere a permissão no navegador ou digite o código.");
      }
    })();

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [onResult]);

  return (
    <CardShell title="Escanear convite" onClose={onClose}>
      <div className={styles.scanBody}>
        {err ? (
          <div className="gm-error">{err}</div>
        ) : (
          <div className={styles.viewport}>
            <video ref={video} playsInline muted />
            <span className={styles.frame} aria-hidden="true" />
          </div>
        )}
        <canvas ref={canvas} hidden />
        {!err && <div className="gm-hint" style={{ textAlign: "center" }} role="status">{hint}</div>}
      </div>
    </CardShell>
  );
}
