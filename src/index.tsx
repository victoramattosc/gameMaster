import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { GameMasterApp } from 'app/GameMasterApp';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <GameMasterApp />
  </React.StrictMode>
);

