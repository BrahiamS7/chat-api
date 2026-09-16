# CANAL — chat en tiempo real por salas

Aplicación de mensajería en vivo: los usuarios se registran, inician sesión y se
unen a salas para chatear en tiempo real vía WebSockets. Backend en
Express + Socket.IO + Prisma/PostgreSQL, frontend en React + Vite.

## Estructura del proyecto

```
api-chat/
├── backend/    API REST + servidor de WebSockets
└── frontend/   Cliente web (React)
```

## Stack

**Backend**
- Express 5 + Socket.IO 4
- Prisma 7 (PostgreSQL) como ORM
- Autenticación con JWT (`jsonwebtoken`) + `bcrypt` para contraseñas
- `helmet`, `cors` y `express-rate-limit` para el endurecimiento del API HTTP
- Jest + Supertest + `socket.io-client` para tests de integración

**Frontend**
- React 18 + Vite
- `socket.io-client` para la conexión en tiempo real
- CSS plano (sin framework), con animaciones nativas

## Requisitos

- Node.js 18+
- Una base de datos PostgreSQL accesible

## Puesta en marcha

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Completá `backend/.env`:

| Variable | Descripción |
| --- | --- |
| `DATABASE_URL` | Cadena de conexión a PostgreSQL |
| `JWT_SECRET` | Secreto para firmar los JWT (obligatorio, sin valor por defecto) |
| `PORT` | Puerto del servidor HTTP/WebSocket (por defecto `3000`) |
| `ALLOWED_ORIGINS` | Orígenes permitidos por CORS, separados por coma. Si se omite, se permite cualquier origen (solo recomendado en desarrollo) |

Aplicá las migraciones y levantá el servidor:

```bash
npx prisma migrate deploy
npm run dev
```

El backend valida al arrancar que `DATABASE_URL` y `JWT_SECRET` estén definidos, y falla explícitamente si faltan.

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

| Variable | Descripción |
| --- | --- |
| `VITE_API_URL` | URL base del backend para las peticiones HTTP (`/auth/*`) |
| `VITE_SOCKET_URL` | URL del servidor de Socket.IO |

La app queda disponible en `http://localhost:5173`.

## Scripts disponibles

**backend/package.json**

| Script | Descripción |
| --- | --- |
| `npm run dev` | Arranca el servidor con recarga automática (`node --watch`) |
| `npm start` | Arranca el servidor en modo producción |
| `npm test` | Corre la suite de Jest (requiere una base de datos accesible) |

**frontend/package.json**

| Script | Descripción |
| --- | --- |
| `npm run dev` | Servidor de desarrollo de Vite |
| `npm run build` | Build de producción |
| `npm run preview` | Sirve el build de producción localmente |

## API REST

Base: `VITE_API_URL` / `http://localhost:3000`

### `POST /auth/register`

```json
// Body
{ "nombre": "Ana", "email": "ana@mail.com", "password": "contraseñaSegura123" }
```

- `201` → `{ "token": "<jwt>" }`
- `400` → nombre vacío, email inválido o contraseña de menos de 8 caracteres
- `409` → el email ya está registrado

### `POST /auth/login`

```json
// Body
{ "email": "ana@mail.com", "password": "contraseñaSegura123" }
```

- `200` → `{ "token": "<jwt>" }`
- `401` → credenciales inválidas

### `POST /auth/logout`

Requiere `Authorization: Bearer <token>`. Revoca el token actual (queda
invalidado aunque no haya expirado todavía).

- `200` → `{ "msg": "Sesión cerrada" }`
- `401` → token no enviado, inválido, expirado o ya revocado

Las tres rutas están limitadas por `express-rate-limit` (20 solicitudes cada
15 minutos por IP).

## WebSockets (Socket.IO)

Conexión autenticada enviando el JWT en el handshake:

```js
io(SOCKET_URL, { auth: { token } })
```

### Eventos que emite el cliente

| Evento | Payload | Descripción |
| --- | --- | --- |
| `join_room` | `"nombre-sala"` (string, `[a-zA-Z0-9_-]`, 1–50 caracteres) | Se une a una sala y pide su historial |
| `send_message` | `{ sala, contenido }` (`contenido` no vacío, máx. 1500 caracteres) | Envía un mensaje a la sala. Limitado a 1 mensaje por segundo por usuario |

### Eventos que emite el servidor

| Evento | Payload | Descripción |
| --- | --- | --- |
| `historial_sala` | `[{ id, contenido, autor, creadoEn }]` | Últimos 20 mensajes de la sala al unirse |
| `nuevo_mensaje` | `{ id, contenido, autor, creadoEn }` | Mensaje nuevo transmitido a todos en la sala |
| `sistema` | `string` | Aviso del sistema (ej. alguien se unió) |
| `error_mensaje` | `{ error: string }` | Error de validación o de rate limit |

## Modelo de datos (Prisma)

- `Usuario`: `id`, `nombre`, `email` (único), `password` (hash)
- `Sala`: `id`, `nombre` (único)
- `Mensaje`: `id`, `contenido`, `creadoEn`, `autorId`, `salaId`
- `TokenRevocado`: `id`, `jti` (único), `expiraEn` — usado para invalidar tokens en `/auth/logout`

## Testing

```bash
cd backend
npm test
```

Los tests corren contra la base de datos configurada en `DATABASE_URL` (no usan
mocks) y limpian los datos de prueba que crean al finalizar.

## Notas de seguridad

- Contraseñas hasheadas con `bcrypt`; JWT firmados con `HS256` y expiración de 2 horas.
- El logout es real: revoca el `jti` del token en base de datos, tanto para el API HTTP como para nuevas conexiones de Socket.IO.
- El rate limiting del chat (1 mensaje/segundo) vive en memoria del proceso: es correcto para una sola instancia del servidor, pero no se comparte si se corre en varias réplicas.
