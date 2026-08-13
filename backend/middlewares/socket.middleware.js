import { verificarToken } from '../utils/jwt.utils.js';

export function socketAuthMiddleware(socket, next) {
  const token = socket.handshake.auth?.token;

  if (!token) return next(new Error('Token no proporcionado'));

  try {
    const payload = verificarToken(token);
    socket.usuario = payload; // { id, nombre } disponible en todos los eventos
    next();
  } catch (err) {
    next(new Error('Token inválido o expirado'));
  }
}