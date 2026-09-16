import 'dotenv/config';
import crearServidor from './server.js';

const variablesRequeridas = ['DATABASE_URL', 'JWT_SECRET'];
const faltantes = variablesRequeridas.filter((v) => !process.env[v]);
if (faltantes.length > 0) {
  console.error(`Faltan variables de entorno requeridas: ${faltantes.join(', ')}`);
  process.exit(1);
}

const { httpServer } = crearServidor();
const port = process.env.PORT || 3000;

httpServer.listen(port, () => {
  console.log(`SERVER RUNNING ON PORT ${port}`);
});