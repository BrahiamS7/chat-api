import  prisma  from '../utils/prisma.js';
import { hashPassword, comparePassword, generarToken } from '../utils/jwt.utils.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN_LENGTH = 8;

function normalizarEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : email;
}

export async function registrar(req, res) {
  try {
    const { nombre, password } = req.body;
    const email = normalizarEmail(req.body.email);

    if (typeof nombre !== 'string' || nombre.trim().length === 0) {
      return res.status(400).json({ error: 'El nombre es obligatorio' });
    }
    if (typeof email !== 'string' || !EMAIL_REGEX.test(email)) {
      return res.status(400).json({ error: 'El email no es válido' });
    }
    if (typeof password !== 'string' || password.length < PASSWORD_MIN_LENGTH) {
      return res.status(400).json({
        error: `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres`,
      });
    }

    const hashed = await hashPassword(password);

    const usuario = await prisma.usuario.create({
      data: { email, nombre: nombre.trim(), password: hashed }
    });

    const token = generarToken({ id: usuario.id, nombre: usuario.nombre });
    res.status(201).json({ token });
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Ese email ya está registrado' });
    }
    console.error('Error en registrar:', err);
    res.status(500).json({ error: 'No se pudo registrar' });
  }
}

export async function logout(req, res) {
  try {
    const { jti, exp } = req.usuario;

    await prisma.tokenRevocado.upsert({
      where: { jti },
      update: {},
      create: { jti, expiraEn: new Date(exp * 1000) },
    });

    // Limpieza best-effort de tokens ya expirados para no crecer indefinidamente
    prisma.tokenRevocado
      .deleteMany({ where: { expiraEn: { lt: new Date() } } })
      .catch((err) => console.error('Error limpiando tokens revocados:', err));

    res.status(200).json({ msg: 'Sesión cerrada' });
  } catch (err) {
    console.error('Error en logout:', err);
    res.status(500).json({ error: 'No se pudo cerrar sesión' });
  }
}

export async function login(req, res) {
  try {
    const email = normalizarEmail(req.body.email);
    const { password } = req.body;

    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
    }

    const usuario = await prisma.usuario.findUnique({ where: { email } });

    if (!usuario || !(await comparePassword(password, usuario.password))) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = generarToken({ id: usuario.id, nombre: usuario.nombre });
    res.status(200).json({ token });
  } catch (err) {
    console.error('Error en login:', err);
    res.status(500).json({ error: 'Error en login' });
  }
}