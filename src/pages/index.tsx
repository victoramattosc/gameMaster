import { Iniciativa } from "./Iniciativa";
import { Dados } from "./Dados";
import { Anotacoes } from "./Anotacoes";
import { Vida } from "./Vida";

import icon from "../assets/GM.png";

import styles from "./Home.module.scss";

export function Home() {
  <link rel="icon" href="../assets/GM.png" />;

  return (
    <main className={styles.main}>
      <div className={styles.title}>
        <text>Game Master | To GM by GM</text>
      </div>

      <div className={styles.content}>
        <div className={styles.group}>
          {/*Iniciativa*/}
          <div className={styles.iniciativa}>
            <Iniciativa />
          </div>

          {/*Dados*/}
          <div className={styles.dados}>
            <Dados />
          </div>
        </div>

        <div className={styles.imagem}>
          <img src={icon} alt="icon" className={styles.icon} />
        </div>

        <div className={styles.group}>
          {/*Anotações*/}
          <div className={styles.anotacoes}>
            <Anotacoes />
          </div>

          {/*Vida*/}
          <div className={styles.vida}>
            <Vida />
          </div>
        </div>
      </div>
    </main>
  );
}
