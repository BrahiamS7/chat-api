import { useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export default function AuthForm({ onAuth }) {
  const [modo, setModo] = useState('login') // 'login' | 'registro'
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  async function manejarEnvio(e) {
    e.preventDefault()
    setError('')
    setCargando(true)

    const ruta = modo === 'login' ? '/auth/login' : '/auth/register'
    const body =
      modo === 'login' ? { email, password } : { nombre, email, password }

    try {
      const res = await fetch(`${API_URL}${ruta}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'No se pudo completar la solicitud')
      }

      onAuth({ token: data.token, nombre: nombre || email })
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-signal" aria-hidden="true">
          <span className="dot" />
          <span className="signal-text">SEÑAL ACTIVA</span>
        </div>

        <h1 className="auth-title">CANAL</h1>
        <p className="auth-subtitle">Mensajería en vivo, por salas.</p>

        <div className="auth-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={modo === 'login'}
            className={`auth-tab ${modo === 'login' ? 'is-active' : ''}`}
            onClick={() => setModo('login')}
          >
            Entrar
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={modo === 'registro'}
            className={`auth-tab ${modo === 'registro' ? 'is-active' : ''}`}
            onClick={() => setModo('registro')}
          >
            Crear cuenta
          </button>
        </div>

        <form onSubmit={manejarEnvio} className="auth-form">
          {modo === 'registro' && (
            <label className="field">
              <span>Nombre</span>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                autoComplete="name"
              />
            </label>
          )}

          <label className="field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </label>

          <label className="field">
            <span>Contraseña</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={modo === 'login' ? 'current-password' : 'new-password'}
              minLength={4}
            />
          </label>

          {error && <p className="auth-error" role="alert">{error}</p>}

          <button type="submit" className="btn-primary" disabled={cargando}>
            {cargando ? 'Conectando…' : modo === 'login' ? 'Entrar al canal' : 'Crear cuenta'}
          </button>
        </form>
      </div>
    </div>
  )
}
