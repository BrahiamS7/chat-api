import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import authRoutes from './routes/auth.routes.js';
import { socketAuthMiddleware } from './middlewares/socket.middleware.js';
import { registrarEventosChat } from './controllers/chat.controller.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' }
});


app.use(cors({
  origin: '*',
}));
app.use(express.json());
app.use('/auth', authRoutes);

app.get('/', (req, res) => {
  res.status(200).json({ msg: "API DE CHAT FUNCIONANDO" });
});

io.use(socketAuthMiddleware);

io.on('connection', (socket) => {
  console.log(`Conectado: ${socket.usuario.nombre}`);
  registrarEventosChat(io, socket);
});

const port = 3000;
httpServer.listen(port, () => {
  console.log(`SERVER RUNNING ON PORT ${port}`);
});