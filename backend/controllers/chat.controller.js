import prisma  from '../utils/prisma.js';

export function registrarEventosChat(io, socket) {
  socket.on('join_room', async (nombreSala) => {
    socket.join(nombreSala);
    socket.to(nombreSala).emit('sistema', `${socket.usuario.nombre} se unió a la sala`);

    try {
      const salaDB = await prisma.sala.findUnique({ where: { nombre: nombreSala } });

      // si la sala no existe todavía en la DB, no hay historial que cargar
      if (!salaDB) return;

      const mensajes = await prisma.mensaje.findMany({
        where: { salaId: salaDB.id },
        orderBy: { creadoEn: 'desc' },
        take: 20,
        include: { autor: { select: { nombre: true } } }
      });

      // los traemos desc (más recientes primero) para el take,
      // pero al cliente se los mandamos en orden cronológico normal
      const historial = mensajes.reverse().map((m) => ({
        id: m.id,
        contenido: m.contenido,
        autor: m.autor.nombre,
        creadoEn: m.creadoEn
      }));

      socket.emit('historial_sala', historial);
    } catch (err) {
      socket.emit('error_mensaje', { error: 'No se pudo cargar el historial' });
    }
  });

  socket.on('send_message', async ({ sala, contenido }) => {
    try {
      const salaDB = await prisma.sala.upsert({
        where: { nombre: sala },
        update: {},
        create: { nombre: sala }
      });

      const mensaje = await prisma.mensaje.create({
        data: {
          contenido,
          autorId: socket.usuario.id,
          salaId: salaDB.id
        },
        include: { autor: { select: { nombre: true } } }
      });

      io.to(sala).emit('nuevo_mensaje', {
        id: mensaje.id,
        contenido: mensaje.contenido,
        autor: mensaje.autor.nombre,
        creadoEn: mensaje.creadoEn
      });
    } catch (err) {
       console.error('Error en send_message:', err);
      socket.emit('error_mensaje', { error: 'No se pudo enviar el mensaje' });
    }
  });

  socket.on('disconnect', () => {
    console.log(`${socket.usuario?.nombre} se desconectó`);
  });
}