const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Ruta para la raíz (/)
app.get('/', (req, res) => {
  res.send('Bienvenido a Space Images to Music API');
});

// Ruta para /api/test (ruta de ejemplo para API)
app.get('/api/test', (req, res) => {
  res.send('API funcionando correctamente');
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Servidor corriendo en el puerto ${port}`);
});
