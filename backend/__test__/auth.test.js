import request from "supertest";
import prisma from "../utils/prisma.js";
import crearServidor from "../server.js";

describe("Auth", () => {
  let app;
  let httpServer;
  const emailBase = `user-test-auth-${Date.now()}`;

  beforeAll(async () => {
    const servidor = crearServidor();
    app = servidor.app;
    httpServer = servidor.httpServer;
  });

  afterAll(async () => {
    await prisma.usuario.deleteMany({
      where: { email: { contains: emailBase } },
    });
    httpServer.close();
    await prisma.$disconnect();
  });

  it("debería rechazar el registro sin nombre", async () => {
    const res = await request(app).post("/auth/register").send({
      email: `${emailBase}-1@example.com`,
      password: "contraseñaSegura123",
    });
    expect(res.statusCode).toBe(400);
  });

  it("debería rechazar el registro con email inválido", async () => {
    const res = await request(app).post("/auth/register").send({
      nombre: "Test",
      email: "no-es-un-email",
      password: "contraseñaSegura123",
    });
    expect(res.statusCode).toBe(400);
  });

  it("debería rechazar el registro con contraseña corta", async () => {
    const res = await request(app).post("/auth/register").send({
      nombre: "Test",
      email: `${emailBase}-2@example.com`,
      password: "123",
    });
    expect(res.statusCode).toBe(400);
  });

  it("debería registrar un usuario válido", async () => {
    const email = `${emailBase}-3@example.com`;
    const res = await request(app).post("/auth/register").send({
      nombre: "Test",
      email,
      password: "contraseñaSegura123",
    });
    expect(res.statusCode).toBe(201);
    expect(res.body.token).toBeDefined();
  });

  it("debería rechazar el registro con email duplicado", async () => {
    const email = `${emailBase}-4@example.com`;
    await request(app).post("/auth/register").send({
      nombre: "Test",
      email,
      password: "contraseñaSegura123",
    });
    const res = await request(app).post("/auth/register").send({
      nombre: "Otro",
      email,
      password: "otraContraseña123",
    });
    expect(res.statusCode).toBe(409);
  });

  it("debería normalizar el email a minúsculas", async () => {
    const email = `${emailBase}-5@example.com`;
    await request(app).post("/auth/register").send({
      nombre: "Test",
      email,
      password: "contraseñaSegura123",
    });
    const res = await request(app).post("/auth/login").send({
      email: email.toUpperCase(),
      password: "contraseñaSegura123",
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it("debería fallar el login con credenciales inválidas", async () => {
    const res = await request(app).post("/auth/login").send({
      email: `${emailBase}-inexistente@example.com`,
      password: "loquesea123",
    });
    expect(res.statusCode).toBe(401);
  });

  it("debería invalidar el token tras hacer logout", async () => {
    const email = `${emailBase}-6@example.com`;
    const registerRes = await request(app).post("/auth/register").send({
      nombre: "Test",
      email,
      password: "contraseñaSegura123",
    });
    const token = registerRes.body.token;

    const logoutRes = await request(app)
      .post("/auth/logout")
      .set("Authorization", `Bearer ${token}`);
    expect(logoutRes.statusCode).toBe(200);

    const logoutOtraVez = await request(app)
      .post("/auth/logout")
      .set("Authorization", `Bearer ${token}`);
    expect(logoutOtraVez.statusCode).toBe(401);
  });
});
