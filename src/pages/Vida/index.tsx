import React, { useState } from "react";
import styles from "./Vida.module.scss";
import {
  FiTrash2,
  FiPlusCircle,
  FiPlus,
  FiMinus
} from "react-icons/fi";

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

  return (
    <div className={styles.all}>
      <h2 className={styles.title}>Personagens e Criaturas</h2>
      <div className={styles.container}>
      <ul className={styles.margin}>
        {characters.map((character: any, index: any) => (
          <li key={index} className={styles.personagens}>
            <span>{character.name}</span>
            <span>Vida: {character.health}</span>
            <button onClick={() => updateHealth(index, 1)} className={styles.botao}>
              <FiPlus />
            </button>
            <button onClick={() => updateHealth(index, -1)} className={styles.botao}>
              <FiMinus />
            </button>
            <button
              onClick={() => removeCharacter(index)}
              className={styles.botaotrash}
            >
              <FiTrash2 color="red" />
            </button>
          </li>
        ))}
      </ul>
      <div className={styles.inputdiv}>
        <input
          className={styles.input}
          type="text"
          placeholder="Nome"
          value={newCharacter.name}
          onChange={(e) =>
            setNewCharacter({ ...newCharacter, name: e.target.value })
          }
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
        <button onClick={addCharacter} className={styles.botao}>
          {" "}
          <FiPlusCircle color="#65b8a6" size={"20px"} />
        </button>
      </div>
      </div>
    </div>
  );
}
