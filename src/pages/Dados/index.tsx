import React, { useState } from "react";
import styles from "./Dados.module.scss";

import {
    FiTrash2,
    FiPlusCircle,
    FiMinusCircle
  } from "react-icons/fi";

export function Dados(){
    const [tipo, setTipo]:any = useState('somar');
    const [qtde, setQtde]:any = useState(1);
    const [adicional, setAdicional]:any = useState(0);
    const [jogar, setJogar]:any = useState(4); // Inicializado com 4 para D4
    const [generatedText, setGeneratedText]:any = useState('Resultado');
  
    const showNotification = async () => {
      // Adicione sua lógica de notificação aqui
      console.log(generatedText);
    };
  
    const mudarTipo = (event:any) => {
      setTipo(event.target.value);
    };
  
    const somarTipo = () => {
      let total = 0;
      let text = '';
      for (let i = 0; i < qtde; i++) {
        const resultado = Math.floor(Math.random() * jogar + 1);
        text += `${resultado}${qtde === 1 ? '' : (i === qtde - 1 ? '' : ' + ')}`;
        total += resultado;
      }
      total+=adicional;
      text = `${text} + ${adicional} = ${total}`;
      setGeneratedText(text);
      showNotification();
    };
  
    const maiorTipo = () => {
      let maiorNum = null;
      let text = '';
      for (let i = 0; i < qtde; i++) {
        const resultado = Math.floor(Math.random() * jogar + 1);
        text += `${resultado}${qtde === 1 ? '' : (i === qtde - 1 ? '' : ' ; ')}`;
        if (maiorNum === null) {
          maiorNum = resultado;
        } else {
          if (resultado > maiorNum) {
            maiorNum = resultado;
          }
        }
      }
      const total = maiorNum + adicional;
      text = `${text} + ${adicional} = ${total}`;
      setGeneratedText(text);
      showNotification();
    };
  
    const menorTipo = () => {
      let menorNum = null;
      let text = '';
      for (let i = 0; i < qtde; i++) {
        const resultado = Math.floor(Math.random() * jogar + 1);
        text += `${resultado}${qtde === 1 ? '' : (i === qtde - 1 ? '' : ' ; ')}`;
        if (menorNum === null) {
          menorNum = resultado;
        } else {
          if (resultado < menorNum) {
            menorNum = resultado;
          }
        }
      }
      const total = menorNum + adicional;
      text = `${text} + ${adicional} = ${total}`;
      setGeneratedText(text);
      showNotification();
    };
  
    const botaoJogar = (jogar:any) => {
      setGeneratedText(`${qtde}d${jogar} = `);
      setJogar(jogar);
      if (tipo === 'somar') {
        somarTipo();
      } else if (tipo === 'maior') {
        maiorTipo();
      } else if (tipo === 'menor') {
        menorTipo();
      }
    };
  
    const addValor = () => {
      setAdicional((prevValue:any) => prevValue + 1);
    };
  
    const remValor = () => {
      setAdicional((prevValue:any) => (prevValue > 0 ? prevValue - 1 : 0));
    };
  
    const addDado = () => {
      setQtde((prevValue:any) => prevValue + 1);
    };
  
    const remDado = () => {
      setQtde((prevValue:any) => (prevValue > 1 ? prevValue - 1 : 1));
    };
  
    return (
        <div>
        <h2 className={styles.title}>Rolagem de Dados</h2>
      <div className={styles.main}>

        <select value={tipo} onChange={mudarTipo} className={styles.select}>
          <option value="somar">Somar</option>
          <option value="maior">Maior</option>
          <option value="menor">Menor</option>
        </select>
  
        {/* Cartões para diferentes tipos de dados */}
        <div className={styles.row2}>
          <button onClick={() => botaoJogar(4)} className={styles.botaodado}>Lançar D4</button>
          <button onClick={() => botaoJogar(6)} className={styles.botaodado}>Lançar D6</button>
          <button onClick={() => botaoJogar(8)} className={styles.botaodado}>Lançar D8</button>
          <button onClick={() => botaoJogar(10)} className={styles.botaodado}>Lançar D10</button>
          <button onClick={() => botaoJogar(12)} className={styles.botaodado}>Lançar D12</button>
          <button onClick={() => botaoJogar(20)} className={styles.botaodado}>Lançar D20</button>
          <button onClick={() => botaoJogar(100)} className={styles.botaodado}>Lançar D100</button>
        </div>
  
        <div className={styles.footer}>
          <div className={styles.row}>
            <button onClick={addValor} className={styles.botao}>
              <FiPlusCircle color="#65b8a6" size={"20px"}/></button>
            <span className={styles.text}>+{adicional}</span>
            <button onClick={remValor} className={styles.botao}>
              <FiMinusCircle color="#65b8a6" size={"20px"}/></button>
          </div>
          <div className={styles.row}>
            <button onClick={addDado} className={styles.botao}>
              <FiPlusCircle color="#65b8a6" size={"20px"}/></button>
            <span className={styles.text}>{qtde}d</span>
            <button onClick={remDado} className={styles.botao}>
              <FiMinusCircle color="#65b8a6" size={"20px"}/></button>
          </div>
        </div>
  
        {/* Exibir o texto gerado */}
        <div className={styles.result}>{generatedText}</div>
      </div>
      </div>
    );
  }
