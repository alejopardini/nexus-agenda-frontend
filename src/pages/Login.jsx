import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Card from '../components/Card'
import CampoTexto from '../components/CampoTexto'
import Boton from '../components/Boton'
import loginBg from '../assets/login-bg.png'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await login(username, password)
      navigate('/')
    } catch (err) {
      setError('Usuario o contraseña incorrectos.')
    }
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden p-4 bg-white">
      {/* bg-top (no bg-center) para priorizar la parte superior de la imagen
          en ventanas más angostas que la imagen original, en vez de recortar
          parejo. */}
      <div
        className="absolute inset-0 bg-cover bg-top"
        style={{ backgroundImage: `url(${loginBg})` }}
      />
      <div className="absolute inset-0 bg-white/15 backdrop-blur-md" />

      <form onSubmit={handleSubmit} className="relative w-full max-w-sm">
        <Card titulo="Iniciar sesión" className="shadow-lg">
          <div className="flex flex-col gap-4">
            {error && (
              <p className="font-sans text-[14px] text-input-error">{error}</p>
            )}

            <CampoTexto
              label="Usuario"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />

            <CampoTexto
              label="Contraseña"
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Boton type="submit" variante="primary" className="w-full">
              Entrar
            </Boton>

            <div className="flex flex-col gap-2 text-center">
              <p className="font-sans text-[14px] text-texto-secundario">
                <Link to="/olvide-password" className="text-primary hover:underline">¿Olvidaste tu contraseña?</Link>
              </p>
              <p className="font-sans text-[14px] text-texto-secundario">
                ¿Sos dueño/a de una clínica? <Link to="/registro" className="text-primary hover:underline">Creá tu cuenta</Link>
              </p>
            </div>
          </div>
        </Card>
      </form>
    </div>
  )
}
