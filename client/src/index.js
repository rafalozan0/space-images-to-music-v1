// client/src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Importa los estilos globales
import SpaceImageToMusicApp from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <SpaceImageToMusicApp />
  </React.StrictMode>
);