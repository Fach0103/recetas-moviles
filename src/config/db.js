const mongoose = require('mongoose');

class Database {
  async connect() {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      throw new Error('Falta MONGO_URI en las variables de entorno');
    }

    mongoose.set('strictQuery', true);

    await mongoose.connect(uri);
    console.log('MongoDB conectado:', mongoose.connection.name);

    mongoose.connection.on('error', (err) => {
      console.error('Error de conexión a MongoDB:', err.message);
    });

    return mongoose.connection;
  }

  async disconnect() {
    await mongoose.disconnect();
  }
}

module.exports = new Database();
