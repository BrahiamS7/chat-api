import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET no está definido en las variables de entorno');
}

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_ALGORITHM = 'HS256';
const JWT_EXPIRES_IN = '2h';
export const JWT_EXPIRES_IN_SECONDS = 2 * 60 * 60;

export const hashPassword = (password) => bcrypt.hash(password, 10);
export const comparePassword = (password, hash) => bcrypt.compare(password, hash);

export const generarToken = (payload) =>
  jwt.sign({ ...payload, jti: crypto.randomUUID() }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    algorithm: JWT_ALGORITHM,
  });

export const verificarToken = (token) =>
  jwt.verify(token, JWT_SECRET, { algorithms: [JWT_ALGORITHM] });