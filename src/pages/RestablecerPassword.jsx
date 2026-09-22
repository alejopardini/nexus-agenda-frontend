import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import apiClient from '../api/client'
import CampoTexto from '../components/CampoTexto'
import Boton from '../components/Boton'
import loginBg from '../assets/login-bg.png'

export default function RestablecerPassword() {
  const { uidb64, token } = useParams()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [exito, setExito] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setGuardando(true)
    try {
      await apiClient.post('/password-reset-confirm/', {
        uidb64,
        token,
        new_password: newPassword,
      })
      setExito(true)
    } catch (err) {
      const data = err.response?.data
      const mensaje = data
        ? Object.values(data).flat().join(' ')
        : 'No se pudo restablecer la contraseña.'
      setError(mensaje)
    } finally {
      setGuardando(false)
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
          Elegir nueva contraseña
        </h1>

        {exito ? (
          <>
            <p className="font-sans text-[14px] text-texto-secundario">
              Tu contraseña se actualizó correctamente.
            </p>
            <Boton to="/login" variante="primary" className="w-full text-center">
              Ir a iniciar sesión
            </Boton>
          </>
        ) : (
          <>
            {error && (
              <div className="flex flex-col gap-1">
                <p className="font-sans text-[14px] text-input-error">{error}</p>
                <Link to="/olvide-password" className="font-sans text-[14px] text-primary hover:underline">
                  Pedir un link nuevo
                </Link>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <CampoTexto
                label="Nueva contraseña"
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />

              <CampoTexto
                label="Confirmar contraseña"
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />

              <Boton type="submit" variante="primary" disabled={guardando} className="w-full">
                {guardando ? 'Guardando...' : 'Restablecer contraseña'}
              </Boton>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
