import request from "supertest";
import bcrypt from "bcrypt";
import { io as ioClient } from "socket.io-client";
import prisma from "../utils/prisma.js";
import crearServidor from "../server.js";
import { socketAuthMiddleware } from "../middlewares/socket.middleware.js";
import { registrarEventosChat } from "../controllers/chat.controller.js";

describe("Chat", () => {
  let io;
  let httpServer;
  let socket;
  let socketTest;
  let socketA;
  let socketB;
  let user;
  let tokenUser;
  let puerto;

  beforeAll(async () => {
    const servidor = crearServidor();
    io = servidor.io;
    httpServer = servidor.httpServer;
    const app = servidor.app;

    await new Promise((resolve) => {
      httpServer.listen(0, resolve);
    });

    puerto = httpServer.address().port;

    await prisma.mensaje.deleteMany({
      where: {
        autor: {
          email: {
            contains: "user-test",
          },
        },
      },
    });

    await prisma.usuario.deleteMany({
      where: {
        email: {
          contains: "user-test",
        },
      },
    });

    const passwordHasheada = await bcrypt.hash("contraseñaDePrueba123", 10);

    const emailUser = `user-test-${Date.now()}@example.com`;

    user = await prisma.usuario.create({
      data: {
        nombre: "User Test",
        email: emailUser,
        password: passwordHasheada,
      },
    });

    const loginResponse = await request(app).post("/auth/login").send({
      email: emailUser,
      password: "contraseñaDePrueba123",
    });

    expect(loginResponse.statusCode).toBe(200);
    tokenUser = loginResponse.body.token;
    expect(tokenUser).toBeDefined();

    io.use(socketAuthMiddleware);

    io.on("connection", (socket) => {
      console.log("✅ Conectado con id:", socket.id);
      console.log("👤 Usuario:", socket.usuario);
      registrarEventosChat(io, socket);
    });

    socket = ioClient(`http://localhost:${puerto}`, {
      auth: {
        token: tokenUser,
      },
    });

    await new Promise((resolve, reject) => {
      socket.once("connect", resolve);

      socket.once("connect_error", (error) => {
        reject(error);
      });
    });
  });

  afterAll(async () => {
    socket?.disconnect();

    io?.close();

    await new Promise((resolve) => {
      httpServer.close(resolve);
    });

    if (user?.id) {
      await prisma.mensaje.deleteMany({
        where: {
          autorId: user.id,
        },
      });
      await prisma.usuario.deleteMany({
        where: {
          id: user.id,
        },
      });
    }

    await prisma.$disconnect();
  });

  it("debería recibir un nuevo mensaje", async () => {
    const sala = "sala-test";
    const contenido = "contenido-test";

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Tiempo de espera agotado para unirse a la sala"));
      }, 5000);

      socket.once("historial_sala", () => {
        clearTimeout(timeout);
        resolve();
      });

      socket.emit("join_room", sala);
    });

    const mensajeRecibido = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Tiempo de espera agotado para recibir el mensaje"));
      }, 5000);

      socket.once("nuevo_mensaje", (data) => {
        clearTimeout(timeout);
        resolve(data);
      });
    });

    socket.emit("send_message", { sala, contenido });

    const mensajeR = await mensajeRecibido;

    expect(mensajeR).toBeDefined();
    expect(mensajeR.contenido).toBe(contenido);
    expect(mensajeR.autor).toBe("User Test");
    expect(mensajeR.id).toBeDefined();
  });

  it("Deberia fallar si el token no es valido", async () => {
    socketTest = ioClient(`http://localhost:${puerto}`, {
      auth: {
        token: "Erroraproposito",
        transports: ["websocket"]
      },
    });

    const res = await new Promise((resolve, reject) => {
      socketTest.once("connect_error", resolve);

      socketTest.once("connect", (error) => {
        reject(error);
      });
    });

    socketTest?.disconnect();

    const result = await res;
    expect(result.message).toBe("Token inválido o expirado");
  });

  it("debería bloquear el segundo mensaje por rate limit", async () => {
    await new Promise((resolve) => setTimeout(resolve, 1100));
    const primerMensajeOk = new Promise((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error("timeout primer mensaje")),
        5000,
      );
      socket.once("nuevo_mensaje", (data) => {
        clearTimeout(timeout);
        resolve(data);
      });
    });

    const segundoMensajeBloqueado = new Promise((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error("timeout segundo mensaje")),
        5000,
      );
      socket.once("error_mensaje", (data) => {
        clearTimeout(timeout);
        resolve(data);
      });
    });

    socket.once("nuevo_mensaje", (data) =>
      console.log("LLEGÓ nuevo_mensaje:", data),
    );
    socket.once("error_mensaje", (data) =>
      console.log("LLEGÓ error_mensaje:", data),
    );

    socket.emit("send_message", { sala: "sala-test", contenido: "mensaje 1" });
    socket.emit("send_message", { sala: "sala-test", contenido: "mensaje 2" });

    const resultado1 = await primerMensajeOk;
    const resultado2 = await segundoMensajeBloqueado;

    expect(resultado1.contenido).toBe("mensaje 1");
    expect(resultado2.error).toBe("Estas mandando mensajes demasiado rapido");
  });

  it("Deberia estar el mensaje enviado anteriormente", async () => {
    await new Promise((resolve) => setTimeout(resolve, 1100));
    const sala = "sala-historial";
    const contenidoA = "contenidoHistorial";

    socketA = ioClient(`http://localhost:${puerto}`, {
      auth: {
        token: tokenUser
      },
      transports: ["websocket"]
    });

    socketA.emit("join_room", sala);

    const mensajeRecibido = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Tiempo de espera agotado para recibir el mensaje"));
      }, 5000);

      socketA.once("nuevo_mensaje", (data) => {
        clearTimeout(timeout);
        resolve(data);
      });
    });

    socketA.emit("send_message", { sala, contenido: contenidoA });
    const msgA = await mensajeRecibido;

    socketA?.disconnect();

    await new Promise((resolve) => setTimeout(resolve, 1100));
    socketB = ioClient(`http://localhost:${puerto}`, {
      auth: {
        token: tokenUser,
      },
      transports: ["websocket"]
    });

    const resultSala = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Tiempo de espera agotado para unirse a la sala"));
      }, 5000);

      socketB.once("historial_sala", (data) => {
        clearTimeout(timeout);
        resolve(data);
      });
      socketB.emit("join_room", sala);
    });
    const historial = await resultSala;

    expect(historial[0].contenido).toBe(msgA.contenido);
  },15000);
});
