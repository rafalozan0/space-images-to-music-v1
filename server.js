// server.js
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'client', 'build'))); // Asegúrate de que la ruta sea correcta

// Configuración de multer para subir imágenes
const storage = multer.memoryStorage();
const upload = multer({ storage });

app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No se ha subido ningún archivo.');
  }
  res.json({ message: 'Imagen subida con éxito', file: req.file });
});

// Manejar todas las demás rutas y servir la aplicación React
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});