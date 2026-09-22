import { useEffect, useRef, useState } from 'react'
import apiClient from '../api/client'
import Layout from '../components/Layout'
import BotonVolver from '../components/BotonVolver'
import Boton from '../components/Boton'
import { useAuth } from '../context/AuthContext'

const COLOR_PRIMARIO_DEFAULT = '#26457a'
const COLOR_SECUNDARIO_DEFAULT = '#59c2bf'

export default function ConfiguracionMarca() {
  const { auth } = useAuth()
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [colorPrimario, setColorPrimario] = useState(COLOR_PRIMARIO_DEFAULT)
  const [colorSecundario, setColorSecundario] = useState(COLOR_SECUNDARIO_DEFAULT)
  const [logoActual, setLogoActual] = useState(null)
  const [logoFile, setLogoFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [errorGuardar, setErrorGuardar] = useState('')
  const [exito, setExito] = useState(false)
  const inputLogoRef = useRef(null)

  useEffect(() => {
    if (auth.rol !== 'dueño') return
    apiClient
      .get('/organizacion/marca/')
      .then((res) => {
        setColorPrimario(res.data.color_primario?.toLowerCase() || COLOR_PRIMARIO_DEFAULT)
        setColorSecundario(res.data.color_secundario?.toLowerCase() || COLOR_SECUNDARIO_DEFAULT)
        setLogoActual(res.data.logo)
      })
      .catch(() => setError('No se pudo cargar la configuración de marca.'))
      .finally(() => setCargando(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (auth.rol !== 'dueño') {
    return (
      <Layout titulo="Marca">
        <p className="text-red-600">No tenés permiso para ver esta pantalla.</p>
      </Layout>
    )
  }

  const handleLogoChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorGuardar('')
    setExito(false)
    setGuardando(true)
    const formData = new FormData()
    formData.append('color_primario', colorPrimario)
    formData.append('color_secundario', colorSecundario)
    if (logoFile) formData.append('logo', logoFile)
    try {
      const res = await apiClient.patch('/organizacion/marca/', formData, {
        headers: { 'Content-Type': undefined }, // dejamos que axios arme el multipart/boundary solo
      })
      setLogoActual(res.data.logo)
      setLogoFile(null)
      setLogoPreview(null)
      if (inputLogoRef.current) inputLogoRef.current.value = ''
      setExito(true)
    } catch (err) {
      const data = err.response?.data
      const mensaje = data
        ? Object.entries(data).map(([campo, msgs]) => `${campo}: ${[].concat(msgs).join(', ')}`).join(' | ')
        : 'No se pudo guardar la marca.'
      setErrorGuardar(mensaje)
    } finally {
      setGuardando(false)
    }
  }

  if (cargando) {
    return (
      <Layout titulo="Configuración de marca">
        <p className="text-texto-secundario text-sm">Cargando...</p>
      </Layout>
    )
  }

  return (
    <Layout titulo="Configuración de marca">
      <BotonVolver to="/" className="mb-4" />
      <div className="bg-white rounded-lg shadow-md p-6 max-w-lg">
        <p className="text-texto-secundario text-sm mb-5">
          Estos colores y el logo se usan en la página pública de reserva de tu organización.
        </p>

        {error && <p className="text-input-error text-sm mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="block text-sm text-texto mb-1" htmlFor="color_primario">
              Color primario
            </label>
            <div className="flex items-center gap-3">
              <input
                id="color_primario"
                type="color"
                value={colorPrimario}
                onChange={(e) => setColorPrimario(e.target.value)}
                className="h-10 w-14 rounded border border-input-border cursor-pointer"
              />
              <span className="text-sm text-texto-secundario font-mono">{colorPrimario}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm text-texto mb-1" htmlFor="color_secundario">
              Color secundario
            </label>
            <div className="flex items-center gap-3">
              <input
                id="color_secundario"
                type="color"
                value={colorSecundario}
                onChange={(e) => setColorSecundario(e.target.value)}
                className="h-10 w-14 rounded border border-input-border cursor-pointer"
              />
              <span className="text-sm text-texto-secundario font-mono">{colorSecundario}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm text-texto mb-1">Logo</label>
            {(logoPreview || logoActual) && (
              <img
                src={logoPreview || logoActual}
                alt="Logo de la organización"
                className="h-20 w-20 object-contain rounded border border-input-border bg-white mb-2"
              />
            )}
            <label
              htmlFor="logo"
              className="inline-block text-sm border border-input-border rounded px-3 py-2 text-texto-secundario cursor-pointer hover:bg-superficie-hover"
            >
              {logoFile ? logoFile.name : 'Elegir imagen...'}
            </label>
            <input
              id="logo"
              type="file"
              accept="image/*"
              ref={inputLogoRef}
              onChange={handleLogoChange}
              className="sr-only"
            />
          </div>

          {errorGuardar && <p className="text-input-error text-sm">{errorGuardar}</p>}
          {exito && <p className="text-turno-confirmado-text text-sm">Marca actualizada correctamente.</p>}

          <Boton type="submit" variante="primary" disabled={guardando} className="w-full">
            {guardando ? 'Guardando...' : 'Guardar cambios'}
          </Boton>
        </form>
      </div>
    </Layout>
  )
}
