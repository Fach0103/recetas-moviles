require('dotenv').config();

const express = require('express');
const cors = require('cors');

const database = require('./src/config/db');
const routes = require('./src/routes');
const { errorMiddleware, notFoundMiddleware } = require('./src/middlewares/errorMiddleware');

class App {
  constructor() {
    this.app = express();
    this._configure();
    this._routes();
    this._errorHandling();
  }

  _configure() {
    this.app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*' }));
    this.app.use(express.json());
  }

  _routes() {
    this.app.use('/api', routes);
  }

  _errorHandling() {
    this.app.use(notFoundMiddleware);
    this.app.use(errorMiddleware);
  }

  async start() {
    await database.connect();
    const port = process.env.PORT || 3000;
    this.app.listen(port, () => {
      console.log(`Servidor escuchando en el puerto ${port}`);
    });
  }
}

const app = new App();
app.start().catch((err) => {
  console.error('No se pudo iniciar el servidor:', err.message);
  process.exit(1);
});

module.exports = app;
