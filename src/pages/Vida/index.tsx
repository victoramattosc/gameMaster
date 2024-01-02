import React, { useState } from "react";
import styles from "./Vida.module.scss";
import { FiTrash2, FiPlusCircle, FiMinusCircle } from "react-icons/fi";

export function Vida() {
  const [characters, setCharacters]: any = useState([]);
  const [newCharacter, setNewCharacter]: any = useState({
    name: "",
    health: "",
  });

  const addCharacter = () => {
    if (newCharacter.name.trim() !== "") {
      setCharacters([...characters, { ...newCharacter }]);
      setNewCharacter({ name: "", health: "" });
    }
  };

  const updateHealth = (index: any, amount: any) => {
    const updatedCharacters = [...characters];
    updatedCharacters[index].health += amount;
    setCharacters(updatedCharacters);
  };

  const removeCharacter = (index: any) => {
    const updatedCharacters = [...characters];
    updatedCharacters.splice(index, 1);
    setCharacters(updatedCharacters);
  };

  const adjustHealth = (index: any, amount: any) => {
    const updatedCharacters = [...characters];
    updatedCharacters[index].health += amount;
    setCharacters(updatedCharacters);
  };

  return (
    <div className={styles.all}>
      <h2 className={styles.title}>Personagens e Criaturas</h2>
      <div className={styles.container}>
        <ul className={styles.anotacaoList}>
          {characters.map((character: any, index: any) => (
            <li key={index} className={styles.personagens}>
              <span>{character.name}</span>
              <span>Vida: {character.health}</span>

              <div className={styles.buttonColumn}>
              <div className={styles.buttonRow}>
              <button onClick={() => updateHealth(index, 1)} className={styles.botaoFi}>
              <FiPlusCircle color="#65b8a6" size={"20px"} />
              </button>
              <button onClick={() => adjustHealth(index, 10)} className={styles.botao}><span className={styles.text}>+10</span></button>
              </div>

              <div className={styles.buttonRowTwo}>
              <button onClick={() => updateHealth(index, -1)} className={styles.botaoFi}>
              <FiMinusCircle color="#65b8a6" size={"20px"} />
              </button>
              <button onClick={() => adjustHealth(index, -10)} className={styles.botao}><span className={styles.text}>-10</span></button>
              </div>
              </div>

              <button onClick={() => removeCharacter(index)} className={styles.botaotrash}>
                <FiTrash2 color="red" />
              </button>
              {/* Botões para ajustar a vida em uma quantidade específica */}

            </li>
          ))}
        </ul>
        <div className={styles.inputdiv}>
          <input
            className={styles.input}
            type="text"
            placeholder="Nome"
            value={newCharacter.name}
            onChange={(e) => setNewCharacter({ ...newCharacter, name: e.target.value })}
          />
          <input
            className={styles.input}
            type="number"
            placeholder="Vida inicial"
            value={newCharacter.health}
            onChange={(e) =>
              setNewCharacter({
                ...newCharacter,
                health: parseInt(e.target.value, 10) || 0,
              })
            }
          />
          <button onClick={addCharacter} className={styles.botaoAdd}>
            {" "}
            <FiPlusCircle color="#65b8a6" size={"20px"} />
          </button>
        </div>
      </div>
    </div>
  );
}
