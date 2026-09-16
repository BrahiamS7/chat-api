// Decodifica el payload de un JWT sin verificar la firma.
// Solo se usa para leer datos no sensibles (ej. nombre) ya emitidos por el backend
// y mostrarlos en la UI; la verificación real de la firma ocurre en el servidor.
export function decodeJwtPayload(token) {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join('')
    )
    return JSON.parse(json)
  } catch {
    return null
  }
}
