import { Iniciativa } from "./Iniciativa";
import { Dados } from "./Dados";
import { Anotacoes } from "./Anotacoes";
import { Vida } from "./Vida";

import styles from "./Home.module.scss";

export function Home() {
  return (
    <main className={styles.main}>
      <div className={styles.title}>
        <text>Game Master | To GM by GM</text>
      </div>

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
    </main>
  );
}
