import React, { useState, useEffect } from "react";
import styles from "./Anotacoes.module.scss";
import { FiTrash2, FiPlusCircle } from "react-icons/fi";

export function Anotacoes() {
  const [anotacoes, setAnotacoes] = useState<string[]>([]);
  const [novaAnotacao, setNovaAnotacao] = useState("");

  // Função para carregar as anotações salvas nos cookies ao carregar a página
  useEffect(() => {
    const savedAnotacoes = localStorage.getItem("anotacoes");
    if (savedAnotacoes) {
      setAnotacoes(JSON.parse(savedAnotacoes));
    }
  }, []);

  const adicionarAnotacao = () => {
    if (novaAnotacao.trim() !== "") {
      const updatedAnotacoes = [...anotacoes, novaAnotacao];
      setAnotacoes(updatedAnotacoes);
      localStorage.setItem("anotacoes", JSON.stringify(updatedAnotacoes));
      setNovaAnotacao("");
    }
  };

  const removerAnotacao = (index: number) => {
    const updatedAnotacoes = anotacoes.filter((_, i) => i !== index);
    setAnotacoes(updatedAnotacoes);
    localStorage.setItem("anotacoes", JSON.stringify(updatedAnotacoes));
  };

  return (
    <div className={styles.all}>
      <h2 className={styles.title}>Anotações</h2>
      <div className={styles.container}>
        <ul className={styles.anotacaoList}>
          {anotacoes.map((anotacao, index) => (
            <li key={index} className={styles.anotacao}>
              {anotacao}
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
