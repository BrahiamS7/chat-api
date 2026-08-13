Chat en Tiempo Real (WebSocket)

Aplicación de chat en tiempo real donde los usuarios pueden registrarse, iniciar sesión y unirse a salas escribiendo su nombre para conversar con otras personas conectadas.

Características
Registro e inicio de sesión de usuarios
Autenticación de sesión
Creación/ingreso a salas de chat por nombre
Mensajería en tiempo real mediante WebSockets
Persistencia de usuarios y mensajes en base de datos
Tecnologías

Backend
Node.js
WebSocket (ws / socket.io)
Prisma (ORM)
PostgreSQL

Frontend
React
Vite

Requisitos previos

Antes de empezar, asegúrate de tener instalado:

Node.js (v18 o superior recomendado)
PostgreSQL corriendo localmente o en un servicio remoto
npm o yarn
Instalación
Clona el repositorio
bash
git clone https://github.com/tu-usuario/tu-repositorio.git
cd tu-repositorio
Instala las dependencias del backend
bash
cd backend
npm install
Instala las dependencias del frontend
bash
cd ../frontend
npm install
Configura las variables de entorno (ver sección de abajo)
Ejecuta las migraciones de Prisma
bash
cd ../backend
npx prisma migrate dev
Variables de entorno

Crea un archivo .env en la carpeta backend con las siguientes variables:

env
DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/nombre_db"
JWT_SECRET="tu_secreto_aqui"
PORT=3000

Ajusta los nombres de las variables según cómo las hayas definido en tu código.

Uso

Debes levantar el backend y el frontend en terminales separadas.

Terminal 1 — Backend

bash
cd backend
npm run dev

Terminal 2 — Frontend

bash
cd frontend
npm run dev

Luego abre tu navegador en http://localhost:5173 (o el puerto que indique Vite).

Estructura del proyecto
├── backend/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── src/
│   └── package.json
├── frontend/
│   ├── src/
│   └── package.json
└── README.md
Roadmap / Mejoras futuras
 Historial de mensajes por sala
 Lista de usuarios conectados en tiempo real
 Notificaciones de mensajes nuevos
 Salas privadas
 Contribución
Las contribuciones son bienvenidas. Para contribuir:
Haz un fork del proyecto
Crea una rama para tu feature (git checkout -b feature/nueva-funcionalidad)
Haz commit de tus cambios (git commit -m 'Agrega nueva funcionalidad')
Haz push a tu rama (git push origin feature/nueva-funcionalidad)
Abre un Pull Request


Autor
BrahiamS7
