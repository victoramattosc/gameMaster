import React, { useState, useEffect } from "react";
import styles from "./Iniciativa.module.scss";
import { FiTrash2, FiPlusCircle, FiChevronDown, FiChevronUp } from "react-icons/fi";

export function Iniciativa() {
  const [jogadores, setJogadores] = useState<string[]>(getJogadoresFromCookies() || []);
  const [novoJogador, setNovoJogador] = useState("");

  const adicionarJogador = () => {
    if (novoJogador.trim() !== "") {
      setJogadores([...jogadores, novoJogador]);
      setNovoJogador("");
    }
  };

  const removerJogador = (index: number) => {
    const novaOrdem = [...jogadores];
    novaOrdem.splice(index, 1);
    setJogadores(novaOrdem);
  };

  const moverJogador = (index: number, direcao: "up" | "down") => {
    const novaOrdem = [...jogadores];
    const jogadorMovido = novaOrdem.splice(index, 1)[0];
    const newIndex = direcao === "up" ? index - 1 : index + 1;
    novaOrdem.splice(newIndex, 0, jogadorMovido);
    setJogadores(novaOrdem);
  };

  useEffect(() => {
    saveJogadoresToCookies(jogadores);
  }, [jogadores]);

  return (
    <div>
      <h2 className={styles.title}>Ordem de Jogadores</h2>

      <div className={styles.container}>
        <div className={styles.inputdiv}>
          <input
            type="text"
            value={novoJogador}
            onChange={(e) => setNovoJogador(e.target.value)}
            placeholder="Insira a ordem"
            className={styles.input}
          />
          <button onClick={adicionarJogador} className={styles.botao}>
            <FiPlusCircle color="#65b8a6" size={"20px"} />
          </button>
        </div>
        <ul className={styles.anotacaoList}>
          {jogadores.map((jogador: string, index: number) => (
            <li key={index} className={styles.ordem}>
              {jogador}
              <button onClick={() => moverJogador(index, "up")} className={styles.botao}>
                <FiChevronUp />
                </button>
              <button onClick={() => moverJogador(index, "down")} className={styles.botao}>
                <FiChevronDown />
              </button>
              <button
                onClick={() => removerJogador(index)}
                className={styles.botaotrash}
              >
                <FiTrash2 color="red" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// Função para obter os jogadores do cookie
function getJogadoresFromCookies() {
  const jogadoresString = localStorage.getItem("jogadores");
  return jogadoresString ? JSON.parse(jogadoresString) : [];
}

// Função para salvar os jogadores no cookie
function saveJogadoresToCookies(jogadores: string[]) {
  localStorage.setItem("jogadores", JSON.stringify(jogadores));
}
