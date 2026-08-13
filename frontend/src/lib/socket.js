import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000'

// Crea una conexión de socket nueva, autenticada con el JWT del login.
// No se conecta automáticamente: el que la llama decide cuándo (autoConnect: false)
// para poder mostrar estados de carga/errores de conexión con claridad.
export function createSocket(token) {
  return io(SOCKET_URL, {
    auth: { token },
    autoConnect: false
  })
}
