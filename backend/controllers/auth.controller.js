import  prisma  from '../utils/prisma.js';
import { hashPassword, comparePassword, generarToken } from '../utils/jwt.utils.js';

export async function registrar(req, res) {
  try {
    const { email, nombre, password } = req.body;
    const hashed = await hashPassword(password);

    const usuario = await prisma.usuario.create({
      data: { email, nombre, password: hashed }
    });

    const token = generarToken({ id: usuario.id, nombre: usuario.nombre });
    res.status(201).json({ token });
  } catch (err) {
    res.status(400).json({ error: 'No se pudo registrar', detalle: err.message });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    const usuario = await prisma.usuario.findUnique({ where: { email } });

    if (!usuario || !(await comparePassword(password, usuario.password))) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = generarToken({ id: usuario.id, nombre: usuario.nombre });
    res.status(200).json({ token });
  } catch (err) {
    res.status(500).json({ error: 'Error en login' });
  }
}