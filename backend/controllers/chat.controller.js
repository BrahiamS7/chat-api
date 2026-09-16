import prisma from "../utils/prisma.js";

const ultimoMensajePorUser = new Map();
const NOMBRE_SALA_REGEX = /^[a-zA-Z0-9_-]{1,50}$/;

export function registrarEventosChat(io, socket) {
  socket.on("join_room", async (nombreSala) => {
    if (typeof nombreSala !== "string" || !NOMBRE_SALA_REGEX.test(nombreSala)) {
      return socket.emit("error_mensaje", { error: "Nombre de sala inválido" });
    }

    try {
      socket.join(nombreSala);
      socket
        .to(nombreSala)
        .emit("sistema", `${socket.usuario.nombre} se unió a la sala`);

      const salaDB = await prisma.sala.findUnique({
        where: { nombre: nombreSala },
      });

      if (!salaDB) return;

      const mensajes = await prisma.mensaje.findMany({
        where: { salaId: salaDB.id },
        orderBy: { creadoEn: "desc" },
        take: 20,
        include: { autor: { select: { nombre: true } } },
      });

      const historial = mensajes.reverse().map((m) => ({
        id: m.id,
        contenido: m.contenido,
        autor: m.autor.nombre,
        creadoEn: m.creadoEn,
      }));

      socket.emit("historial_sala", historial);
    } catch (err) {
      socket.emit("error_mensaje", { error: "No se pudo cargar el historial" });
    }
  });

  socket.on("send_message", async ({ sala, contenido }) => {
    try {
      if (typeof sala !== "string" || !NOMBRE_SALA_REGEX.test(sala)) {
        return socket.emit("error_mensaje", { error: "Nombre de sala inválido" });
      }
      const ahora = Date.now();
      const ultimoMensaje = ultimoMensajePorUser.get(socket.usuario.id);
      if (ultimoMensaje && ahora - ultimoMensaje < 1000) {
        return socket.emit("error_mensaje", {
          error: "Estas mandando mensajes demasiado rapido",
        });
      }
      if (
        typeof contenido !== "string" ||
        contenido.trim().length === 0 ||
        contenido.trim().length > 1500
      ) {
        return socket.emit("error_mensaje", {
          error: "Mensaje vacio o supero la cantidad maxima de caracteres",
        });
      }
      ultimoMensajePorUser.set(socket.usuario.id, ahora);
      const salaDB = await prisma.sala.upsert({
        where: { nombre: sala },
        update: {},
        create: { nombre: sala },
      });

      const mensaje = await prisma.mensaje.create({
        data: {
          contenido,
          autorId: socket.usuario.id,
          salaId: salaDB.id,
        },
        include: { autor: { select: { nombre: true } } },
      });
      io.to(sala).emit("nuevo_mensaje", {
        id: mensaje.id,
        contenido: mensaje.contenido,
        autor: mensaje.autor.nombre,  
        creadoEn: mensaje.creadoEn,
      });
    } catch (err) {
      console.error("Error en send_message:", err);
      socket.emit("error_mensaje", { error: "No se pudo enviar el mensaje" });
    }
  });

  socket.on("disconnect", () => {
    ultimoMensajePorUser.delete(socket.usuario.id);
    console.log(`${socket.usuario?.nombre} se desconectó`);
  });
}
