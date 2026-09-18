import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import CampoTexto from '../components/CampoTexto'
import Boton from '../components/Boton'
import loginBg from '../assets/login-bg.png'
import logoQnexusCompleto from '../assets/logo_qnexus_completo.png'

export default function Registro() {
  const [form, setForm] = useState({
    username: '', password: '', password2: '', email: '', first_name: '', last_name: '', organizacion_nombre: '',
  })
  const [aceptaTerminos, setAceptaTerminos] = useState(false)
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (form.password !== form.password2) {
      setError('Las contraseñas no coinciden.')
      return
    }
    if (!aceptaTerminos) {
      setError('Tenés que aceptar los términos y condiciones para continuar.')
      return
    }

    setGuardando(true)
    try {
      const { password2, ...payload } = form
      await register(payload)
      navigate('/')
    } catch (err) {
      const data = err.response?.data
      const mensaje = data
        ? Object.entries(data).map(([campo, msgs]) => `${campo}: ${[].concat(msgs).join(', ')}`).join(' | ')
        : 'No se pudo crear la cuenta.'
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

      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-[420px] bg-white rounded-xl shadow-[0px_4px_16px_rgba(0,0,0,0.1)] p-8 flex flex-col gap-5"
      >
        <img
          src={logoQnexusCompleto}
          alt="QuiroNexus"
          className="w-[100px] h-[100px] object-contain mx-auto"
        />

        <div className="text-center">
          <h1 className="font-sans font-semibold text-[20px] text-heading">Crear cuenta</h1>
          <p className="font-sans text-[14px] text-texto-secundario mt-1">
            Sos el dueño/a de tu clínica o consultorio.
          </p>
        </div>

        {error && (
          <p className="font-sans text-[14px] text-input-error">{error}</p>
        )}

        <div className="flex gap-3">
          <CampoTexto
            label="Nombre"
            id="first_name"
            name="first_name"
            value={form.first_name}
            onChange={handleChange}
            required
            className="flex-1"
          />
          <CampoTexto
            label="Apellido"
            id="last_name"
            name="last_name"
            value={form.last_name}
            onChange={handleChange}
            required
            className="flex-1"
          />
        </div>

        <CampoTexto
          label="Nombre de tu clínica/consultorio (opcional)"
          id="organizacion_nombre"
          name="organizacion_nombre"
          value={form.organizacion_nombre}
          onChange={handleChange}
          placeholder="Si lo dejás vacío, usamos tu nombre"
        />

        <CampoTexto
          label="Usuario"
          id="username"
          name="username"
          value={form.username}
          onChange={handleChange}
          required
        />

        <CampoTexto
          label="Email"
          id="email"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          required
        />

        <CampoTexto
          label="Contraseña"
          id="password"
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          required
        />

        <CampoTexto
          label="Repetir contraseña"
          id="password2"
          name="password2"
          type="password"
          value={form.password2}
          onChange={handleChange}
          required
        />

        <label className="flex items-start gap-2 font-sans text-[12px] text-texto-secundario">
          <input
            type="checkbox"
            checked={aceptaTerminos}
            onChange={(e) => setAceptaTerminos(e.target.checked)}
            className="mt-0.5"
          />
          <span>
            Acepto los{' '}
            <Link to="/terminos" target="_blank" className="font-medium text-primary hover:underline">
              términos y condiciones
            </Link>
          </span>
        </label>

        <Boton type="submit" variante="primary" disabled={guardando} className="w-full">
          {guardando ? 'Creando...' : 'Crear cuenta'}
        </Boton>

        <p className="font-sans text-[14px] text-texto-secundario text-center">
          ¿Ya tenés cuenta?{' '}
          <Link to="/login" className="font-sans font-medium text-[14px] text-primary hover:underline">
            Iniciar sesión
          </Link>
        </p>
      </form>
    </div>
  )
}
