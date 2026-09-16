import { verificarToken } from '../utils/jwt.utils.js';
import prisma from '../utils/prisma.js';

export async function socketAuthMiddleware(socket, next) {
  const token = socket.handshake.auth?.token;

  if (!token) return next(new Error('Token no proporcionado'));

  try {
    const payload = verificarToken(token);

    const revocado = await prisma.tokenRevocado.findUnique({
      where: { jti: payload.jti },
    });
    if (revocado) return next(new Error('Token revocado'));

    socket.usuario = payload;
    next();
  } catch (err) {
    next(new Error('Token inválido o expirado'));
  }
}