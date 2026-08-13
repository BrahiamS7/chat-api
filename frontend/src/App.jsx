import { useState } from 'react'
import AuthForm from './components/AuthForm.jsx'
import ChatRoom from './components/ChatRoom.jsx'

export default function App() {
  const [sesion, setSesion] = useState(null) // { token, nombre } | null

  if (!sesion) {
    return <AuthForm onAuth={setSesion} />
  }

  return <ChatRoom sesion={sesion} onSalir={() => setSesion(null)} />
}
