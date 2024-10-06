const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Ruta de prueba para ver si el servidor está funcionando
app.get('/api/test', (req, res) => {
  res.send('API funcionando correctamente');
});

// Puesta en marcha del servidor
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Servidor corriendo en el puerto ${port}`);
});
