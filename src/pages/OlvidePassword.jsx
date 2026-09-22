import { useState } from 'react'
import { Link } from 'react-router-dom'
import apiClient from '../api/client'
import CampoTexto from '../components/CampoTexto'
import Boton from '../components/Boton'
import loginBg from '../assets/login-bg.png'

const MENSAJE_GENERICO = 'Si el email existe, te enviamos un link para restablecer tu contraseña.'

export default function OlvidePassword() {
  const [email, setEmail] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setEnviando(true)
    try {
      await apiClient.post('/password-reset/', { email })
    } catch {
      // no distinguir el error del caso "email no existe": mismo mensaje siempre
    } finally {
      setEnviando(false)
      setEnviado(true)
    }
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden p-4 bg-white">
      <div
        className="absolute inset-0 bg-cover bg-top"
        style={{ backgroundImage: `url(${loginBg})` }}
      />
      <div className="absolute inset-0 bg-white/15 backdrop-blur-md" />

      <div className="relative w-full max-w-[420px] bg-white rounded-xl shadow-[0px_4px_16px_rgba(0,0,0,0.1)] p-8 flex flex-col gap-5">
        <div className="text-center">
          <span className="font-sans font-semibold text-[28px]">
            <span className="text-primary">Nexus</span> <span className="text-secondary">Agenda</span>
          </span>
          <p className="font-sans text-[13px] text-texto-secundario mt-1">Gestionada por Zoe</p>
        </div>

        <h1 className="font-sans font-semibold text-[20px] text-heading text-center">
          Recuperar contraseña
        </h1>

        {enviado ? (
          <p className="font-sans text-[14px] text-texto-secundario">{MENSAJE_GENERICO}</p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <CampoTexto
              label="Email"
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Boton type="submit" variante="primary" disabled={enviando} className="w-full">
              {enviando ? 'Enviando...' : 'Enviar link'}
            </Boton>
          </form>
        )}

        <p className="font-sans text-[14px] text-texto-secundario text-center">
          <Link to="/login" className="font-sans font-medium text-[14px] text-primary hover:underline">
            Volver a iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
