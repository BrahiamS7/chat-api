// test-client/client.js
import { io } from "socket.io-client";

const TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwibm9tYnJlIjoicGFsb21hIiwiaWF0IjoxNzg2NDY5MzE2LCJleHAiOjE3ODY0NzY1MTZ9.rxN62mvwb5qHRrEr5trgtbAqrSrJYXO4K1cRc8yr1Uc";

const socket = io("http://localhost:3000", {
  auth: { token: TOKEN },
});

socket.on("connect", () => {
  console.log("✅ Conectado con id:", socket.id);
  socket.emit("join_room", "sala-general");

  setTimeout(() => {
    socket.emit("send_message", {
      sala: "sala-general",
      contenido: "¡Hola desde el cliente de prueba!",
    });
  }, 1000);
});

socket.on("connect_error", (err) => {
  console.log("❌ Error de conexión:", err.message);
});

socket.on("sistema", (msg) => console.log("📢 Sistema:", msg));
socket.on("historial_sala", (mensajes) =>
  console.log("📜 Historial:", mensajes),
);
socket.on("nuevo_mensaje", (msg) => console.log("💬 Nuevo mensaje:", msg));
socket.on("error_mensaje", (err) => console.log("⚠️ Error:", err));
