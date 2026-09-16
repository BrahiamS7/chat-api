import { verificarToken } from '../utils/jwt.utils.js';
import prisma from '../utils/prisma.js';

export async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  try {
    const payload = verificarToken(token);

    const revocado = await prisma.tokenRevocado.findUnique({
      where: { jti: payload.jti },
    });
    if (revocado) {
      return res.status(401).json({ error: 'Token revocado' });
    }

    req.usuario = payload;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
}
