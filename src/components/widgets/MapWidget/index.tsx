import React, { useRef, useState } from "react";
import { useMapPointerDrag } from "../../../hooks/useMapPointerDrag";
import { useMapZoom } from "../../../hooks/useMapZoom";
import { useCampaign } from "../../../state/CampaignContext";
import { readFileAsDataUrl } from "../../../utils/files";
import { MapPinIcon, ResetZoomIcon, UploadIcon } from "../../common/icons";
import styles from "./MapWidget.module.scss";

const CUSTOM_SOURCE = "__custom__";

export function MapWidget() {
  const { activeCampaign, state, dispatch } = useCampaign();
  const { map, characters } = activeCampaign;
  const canvasRef = useRef<HTMLDivElement>(null);
  const startPointerDrag = useMapPointerDrag(canvasRef, dispatch);
  const { viewportRef, scale, isZoomed, canZoomIn, canZoomOut, transformStyle, viewportHandlers, zoomIn, zoomOut, reset } =
    useMapZoom(!state.ui.mapPlacing);

  const [placeSource, setPlaceSource] = useState(CUSTOM_SOURCE);
  const [placeLabel, setPlaceLabel] = useState("");
  const [placeColor, setPlaceColor] = useState("#8b3a3a");

  const uploadImage = async (file: File | undefined | null) => {
    if (!file) return;
    const dataUrl = await readFileAsDataUrl(file);
    dispatch({ type: "SET_MAP_IMAGE", imageUrl: dataUrl });
  };

  const onMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!state.ui.mapPlacing) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    let label = placeLabel || "Marcador";
    let color = placeColor;
    if (placeSource !== CUSTOM_SOURCE) {
      const ch = characters.find((c) => c.id === placeSource);
      if (ch) {
        label = ch.name;
        color = "#65b8a6";
      }
    }
    dispatch({ type: "ADD_MAP_POINTER", x, y, label, color });
    setPlaceLabel("");
  };

  if (!map.imageUrl) {
    return (
      <label
        className={`${styles.uploader} gm-btn`}
        onDrop={(e) => {
          e.preventDefault();
          uploadImage(e.dataTransfer.files[0]);
        }}
        onDragOver={(e) => e.preventDefault()}
      >
        <UploadIcon />
        <span>Arraste ou clique para enviar o mapa</span>
        <input
          type="file"
          accept="image/png,image/jpeg,image/jpg"
          onChange={(e) => uploadImage(e.target.files?.[0])}
          className={styles.hiddenInput}
        />
      </label>
    );
  }

  return (
    <div>
      <div className={styles.toolbar}>
        <label className={`${styles.swapBtn} gm-btn`} title="Trocar mapa">
          <UploadIcon size={15} />
          <input
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            onChange={(e) => uploadImage(e.target.files?.[0])}
            className={styles.hiddenInput}
          />
        </label>
        <select value={placeSource} onChange={(e) => setPlaceSource(e.target.value)} className={styles.select}>
          <option value={CUSTOM_SOURCE}>Marcador personalizado</option>
          {characters.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {placeSource === CUSTOM_SOURCE && (
          <>
            <input
              value={placeLabel}
              onChange={(e) => setPlaceLabel(e.target.value)}
              placeholder="Rótulo"
              className={styles.tinyInput}
            />
            <input
              type="color"
              value={placeColor}
              onChange={(e) => setPlaceColor(e.target.value)}
              className={styles.colorInput}
            />
          </>
        )}
        <button
          type="button"
          onClick={() => dispatch({ type: "TOGGLE_MAP_PLACING" })}
          className={[styles.placingBtn, state.ui.mapPlacing ? styles.placingActive : "", "gm-btn"].join(" ")}
        >
          <MapPinIcon />
          {state.ui.mapPlacing ? "Clique no mapa..." : "Adicionar marcador"}
        </button>
      </div>

      <div
        ref={viewportRef}
        className={styles.mapViewport}
        style={{ cursor: state.ui.mapPlacing ? "crosshair" : isZoomed ? "grab" : "default" }}
        {...viewportHandlers}
      >
        <div
          ref={canvasRef}
          className={styles.mapCanvas}
          style={{
            background: `url(${map.imageUrl}) center/cover no-repeat`,
            ...transformStyle,
          }}
          onClick={onMapClick}
        >
          {map.pointers.map((pt) => (
            <div
              key={pt.id}
              className={styles.pointer}
              style={{ left: `${pt.x}%`, top: `${pt.y}%`, background: pt.color }}
              onPointerDown={startPointerDrag(pt.id)}
              title={pt.label}
            >
              <MapPinIcon size={11} />
              <span className={styles.pointerLabel}>{pt.label}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  dispatch({ type: "REMOVE_MAP_POINTER", id: pt.id });
                }}
                className={styles.pointerRemove}
                aria-label="Remover marcador"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <div className={styles.zoomControls}>
          <button
            type="button"
            onClick={zoomOut}
            disabled={!canZoomOut}
            className={styles.zoomBtn}
            aria-label="Diminuir zoom"
          >
            －
          </button>
          <span className={styles.zoomValue}>{Math.round(scale * 100)}%</span>
          <button
            type="button"
            onClick={zoomIn}
            disabled={!canZoomIn}
            className={styles.zoomBtn}
            aria-label="Aumentar zoom"
          >
            ＋
          </button>
          {isZoomed && (
            <button type="button" onClick={reset} className={styles.zoomBtn} aria-label="Restaurar zoom">
              <ResetZoomIcon />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
