import React from "react";
import { useCampaign } from "../../../state/CampaignContext";
import { parseSpotifyUrl } from "../../../utils/spotify";
import { AddRow } from "../../common/AddRow";
import { Chip } from "../../common/Pill";
import { MusicIcon } from "../../common/icons";
import { Modal } from "../Modal";
import styles from "./MusicModal.module.scss";

export function MusicModal() {
  const { activeCampaign, dispatch } = useCampaign();
  const { music } = activeCampaign;

  const close = () => dispatch({ type: "TOGGLE_MUSIC_MODAL" });

  const addMusic = () => {
    const parsed = parseSpotifyUrl(music.url);
    if (!parsed) return;
    dispatch({ type: "ADD_MUSIC", embedUrl: parsed.embedUrl, label: parsed.key });
  };

  return (
    <Modal
      onClose={close}
      title={
        <>
          <MusicIcon size={18} /> Música da Sessão
        </>
      }
    >
      <div className={styles.addRow}>
        <AddRow
          value={music.url}
          onChange={(url) => dispatch({ type: "SET_MUSIC_URL", url })}
          onSubmit={addMusic}
          placeholder="Cole o link do Spotify"
        />
      </div>

      {music.currentEmbedUrl ? (
        <div className={styles.embedWrap}>
          <iframe
            src={music.currentEmbedUrl}
            width="100%"
            height="152"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            title="Player do Spotify"
            className={styles.embed}
          />
        </div>
      ) : (
        <div className={styles.empty}>
          Nenhuma música ainda. Cole um link de faixa, álbum ou playlist do Spotify.
        </div>
      )}

      <div className={styles.saved}>
        {music.saved.map((m) => (
          <div key={m.id} className={styles.savedRow}>
            <Chip
              onClick={() => dispatch({ type: "SELECT_MUSIC", embedUrl: m.embedUrl })}
              onRemove={() => dispatch({ type: "REMOVE_MUSIC", id: m.id })}
              className={styles.savedChip}
              labelClassName={styles.savedLabel}
            >
              {m.label}
            </Chip>
          </div>
        ))}
      </div>
    </Modal>
  );
}
