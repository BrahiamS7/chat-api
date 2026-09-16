import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';
import authRoutes from './routes/auth.routes.js';
import { socketAuthMiddleware } from './middlewares/socket.middleware.js';
import { registrarEventosChat } from './controllers/chat.controller.js';

const origenesPermitidos = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : '*';

if (origenesPermitidos === '*') {
  console.warn(
    'ALLOWED_ORIGINS no está definido: se permitirá cualquier origen (solo recomendado en desarrollo).'
  );
}

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos, intenta de nuevo más tarde' },
});

export default function crearServidor() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: origenesPermitidos },
  });

  app.use(helmet());
  app.use(cors({ origin: origenesPermitidos }));
  app.use(express.json());
  app.use('/auth', authLimiter, authRoutes);

  app.get('/', (req, res) => {
    res.status(200).json({ msg: 'API DE CHAT FUNCIONANDO' });
  });

  app.use((req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
  });

  app.use((err, req, res, next) => {
    console.error('Error no manejado en Express:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  });

  io.use(socketAuthMiddleware);

  io.on('connection', (socket) => {
    console.log(`Conectado: ${socket.usuario.nombre}`);
    registrarEventosChat(io, socket);
  });

  return { app, httpServer, io };
}