import { useEffect, useRef, useState } from 'react'
import { createSocket } from '../lib/socket.js'

function formatoHora(iso) {
  const fecha = new Date(iso)
  return fecha.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
}

export default function ChatRoom({ sesion, onSalir }) {
  const [estado, setEstado] = useState('desconectado') // desconectado | conectando | conectado | error
  const [salaActual, setSalaActual] = useState(null)
  const [inputSala, setInputSala] = useState('general')
  const [mensajes, setMensajes] = useState([])
  const [avisos, setAvisos] = useState([])
  const [texto, setTexto] = useState('')
  const socketRef = useRef(null)
  const logRef = useRef(null)

  useEffect(() => {
    const socket = createSocket(sesion.token)
    socketRef.current = socket

    setEstado('conectando')
    socket.connect()

    socket.on('connect', () => setEstado('conectado'))
    socket.on('disconnect', () => setEstado('desconectado'))
    socket.on('connect_error', () => setEstado('error'))

    socket.on('historial_sala', (historial) => {
      setMensajes(historial)
    })

    socket.on('nuevo_mensaje', (mensaje) => {
      setMensajes((prev) => [...prev, mensaje])
    })

    socket.on('sistema', (texto) => {
      setAvisos((prev) => [...prev, texto])
    })

    socket.on('error_mensaje', (payload) => {
      setAvisos((prev) => [...prev, payload.error || 'Ocurrió un error'])
    })

    return () => {
      socket.disconnect()
    }
  }, [sesion.token])

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [mensajes])

  function unirseASala(e) {
    e.preventDefault()
    if (!inputSala.trim() || !socketRef.current) return
    setMensajes([])
    setAvisos([])
    socketRef.current.emit('join_room', inputSala.trim())
    setSalaActual(inputSala.trim())
  }

  function enviarMensaje(e) {
    e.preventDefault()
    if (!texto.trim() || !salaActual || !socketRef.current) return
    socketRef.current.emit('send_message', { sala: salaActual, contenido: texto.trim() })
    setTexto('')
  }

  return (
    <div className="chat-screen">
      <aside className="chat-sidebar">
        <div className="brand">
          <span className="brand-mark">CANAL</span>
          <span className={`status-pill status-${estado}`}>{estado}</span>
        </div>

        <form onSubmit={unirseASala} className="room-form">
          <label className="field">
            <span>Sintonizar sala</span>
            <input
              type="text"
              value={inputSala}
              onChange={(e) => setInputSala(e.target.value)}
              placeholder="nombre-de-sala"
            />
          </label>
          <button type="submit" className="btn-secondary">Unirse</button>
        </form>

        <div className="session-box">
          <span className="session-label">Conectado como</span>
          <span className="session-name">{sesion.nombre}</span>
          <button className="btn-ghost" onClick={onSalir}>Salir</button>
        </div>
      </aside>

      <main className="chat-main">
        <header className="room-header">
          {salaActual ? (
            <>
              <span className="room-flap">{salaActual}</span>
              <span className="room-caption">transmisión en vivo</span>
            </>
          ) : (
            <span className="room-caption">Elegí una sala para empezar</span>
          )}
        </header>

        <div className="log" ref={logRef}>
          {avisos.map((a, i) => (
            <div key={`aviso-${i}`} className="log-system">{a}</div>
          ))}

          {mensajes.map((m) => (
            <div
              key={m.id}
              className={`log-line ${m.autor === sesion.nombre ? 'is-mine' : ''}`}
            >
              <span className="log-time">{formatoHora(m.creadoEn)}</span>
              <span className="log-autor">{m.autor}</span>
              <span className="log-contenido">{m.contenido}</span>
            </div>
          ))}

          {salaActual && mensajes.length === 0 && avisos.length === 0 && (
            <div className="log-empty">Todavía no hay mensajes en esta sala. Escribí el primero.</div>
          )}
        </div>

        <form onSubmit={enviarMensaje} className="composer">
          <input
            type="text"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder={salaActual ? 'Escribí un mensaje…' : 'Unite a una sala primero'}
            disabled={!salaActual}
          />
          <button type="submit" className="btn-primary" disabled={!salaActual || !texto.trim()}>
            Enviar
          </button>
        </form>
      </main>
    </div>
  )
}
