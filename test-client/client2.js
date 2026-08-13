

// test-client/client.js
import { io } from "socket.io-client";

const TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Miwibm9tYnJlIjoiYWJlbGFyZG8iLCJpYXQiOjE3ODY0NjkzOTgsImV4cCI6MTc4NjQ3NjU5OH0.NFWvMKxaJgDh5BsBwA9rmgvkkxpc1eocSLdbdKmvp1o";

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
