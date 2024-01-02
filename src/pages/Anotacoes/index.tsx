import React, { useState } from "react";
import styles from "./Anotacoes.module.scss";
import { FiTrash2, FiPlusCircle } from "react-icons/fi";


export function Anotacoes() {
  const [anotacao, setAnotacao]: any = useState([]);
  const [novaAnotacao, setNovaAnotacao]: any = useState("");

  const adicionarAnotacao = () => {
    if (novaAnotacao.trim() !== "") {
      setAnotacao([...anotacao, novaAnotacao]);
      setNovaAnotacao("");
    }
  };

  const removerAnotacao = (index: any) => {
    const novaOrdem = [...anotacao];
    novaOrdem.splice(index, 1);
    setAnotacao(novaOrdem);
  };

  return (
    <div className={styles.all}>
      <h2 className={styles.title}>Anotações</h2>
      <div className={styles.container}>
        <ul className={styles.anotacaoList}>
          {anotacao.map((jogador: any, index: any) => (
            <li key={index} className={styles.anotacao}>
              {jogador}
              <button
                onClick={() => removerAnotacao(index)}
                className={styles.botaotrash}
              >
                <FiTrash2 color="red" />
              </button>
            </li>
          ))}
        </ul>
        <div className={styles.inputdiv}>
          <input
            type="text"
            value={novaAnotacao}
            onChange={(e) => setNovaAnotacao(e.target.value)}
            placeholder="Faça suas anotações aqui"
            className={styles.input}
          />
          <button onClick={adicionarAnotacao} className={styles.botao}>
            <FiPlusCircle color="#65b8a6" size={"20px"} />
          </button>
        </div>
      </div>
    </div>
  );
}