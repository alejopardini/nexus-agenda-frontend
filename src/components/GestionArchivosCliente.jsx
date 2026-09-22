import { useEffect, useId, useRef, useState } from 'react'
import { Pencil, PenTool, Archive, ArchiveRestore, Trash2 } from 'lucide-react'
import apiClient from '../api/client'
import AnotadorArchivo from './AnotadorArchivo'
import Boton from './Boton'
import BotonIcono from './BotonIcono'
import { formatearFecha } from '../utils/fechas'

export default function GestionArchivosCliente({ clienteId }) {
  const [archivos, setArchivos] = useState([])
  const [archivosError, setArchivosError] = useState(false)
  const [archivoFile, setArchivoFile] = useState(null)
  const [subiendo, setSubiendo] = useState(false)
  const [archivoAAnotar, setArchivoAAnotar] = useState(null)
  const [mostrarArchivados, setMostrarArchivados] = useState(false)
  const [editandoNombreId, setEditandoNombreId] = useState(null)
  const [nombreEditado, setNombreEditado] = useState('')
  const [nombreInvalido, setNombreInvalido] = useState(false)
  const [guardandoNombre, setGuardandoNombre] = useState(false)
  const inputArchivoRef = useRef(null)
  const idInputArchivo = useId()

  const cargarArchivos = () => {
    apiClient
      .get('/archivos/')
      .then((res) => {
        setArchivos(res.data.filter((a) => String(a.cliente) === String(clienteId)))
        setArchivosError(false)
      })
      .catch(() => setArchivosError(true))
  }

  useEffect(() => {
    cargarArchivos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteId])

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!archivoFile) return
    setSubiendo(true)
    const formData = new FormData()
    formData.append('cliente', clienteId)
    formData.append('archivo', archivoFile)
    formData.append('nombre', archivoFile.name)
    try {
      await apiClient.post('/archivos/', formData, {
        headers: { 'Content-Type': undefined }, // dejamos que axios arme el multipart/boundary solo
      })
      setArchivoFile(null)
      if (inputArchivoRef.current) inputArchivoRef.current.value = ''
      cargarArchivos()
    } catch (err) {
      const data = err.response?.data
      const mensaje = data
        ? Object.entries(data).map(([campo, msgs]) => `${campo}: ${[].concat(msgs).join(', ')}`).join(' | ')
        : 'No se pudo subir el archivo.'
      alert(mensaje)
    } finally {
      setSubiendo(false)
    }
  }

  const archivarArchivo = async (archivoId) => {
    try {
      await apiClient.post(`/archivos/${archivoId}/archivar/`)
      cargarArchivos()
    } catch {
      alert('No se pudo archivar el archivo.')
    }
  }

  const desarchivarArchivo = async (archivoId) => {
    try {
      await apiClient.post(`/archivos/${archivoId}/desarchivar/`)
      cargarArchivos()
    } catch {
      alert('No se pudo restaurar el archivo.')
    }
  }

  const iniciarEdicionNombre = (archivo) => {
    setEditandoNombreId(archivo.id)
    setNombreEditado(archivo.nombre)
    setNombreInvalido(false)
  }

  const cancelarEdicionNombre = () => {
    setEditandoNombreId(null)
    setNombreInvalido(false)
  }

  const guardarNombreArchivo = async (archivoId) => {
    const valor = nombreEditado.trim()
    if (!valor) {
      setNombreInvalido(true)
      return
    }
    setGuardandoNombre(true)
    try {
      const formData = new FormData()
      formData.append('nombre', valor)
      await apiClient.patch(`/archivos/${archivoId}/`, formData, {
        headers: { 'Content-Type': undefined }, // dejamos que axios arme el multipart/boundary solo
      })
      setEditandoNombreId(null)
      cargarArchivos()
    } catch {
      alert('No se pudo renombrar el archivo.')
    } finally {
      setGuardandoNombre(false)
    }
  }

  const eliminarArchivo = async (archivoId) => {
    if (!confirm('¿Seguro que querés eliminar este archivo? Esta acción no se puede deshacer.')) return
    if (!confirm('Confirmá de nuevo: el archivo se va a eliminar definitivamente.')) return
    try {
      await apiClient.delete(`/archivos/${archivoId}/`)
      cargarArchivos()
    } catch {
      alert('No se pudo eliminar el archivo.')
    }
  }

  if (archivosError) {
    return (
      <p className="text-slate-400 text-sm">
        Este contenido es clínico y no está disponible para tu rol.
      </p>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <Boton variante="ghost" tamaño="sm" onClick={() => setMostrarArchivados(!mostrarArchivados)}>
          {mostrarArchivados ? 'Ver archivos activos' : 'Ver archivados'}
        </Boton>
      </div>

      {!mostrarArchivados && (
        <form onSubmit={handleUpload} className="flex flex-col gap-2 mb-4">
          <label
            htmlFor={idInputArchivo}
            className="w-full text-sm border border-slate-300 rounded px-3 py-2 text-slate-600 truncate cursor-pointer hover:bg-slate-50"
          >
            {archivoFile ? archivoFile.name : 'Elegir archivo...'}
          </label>
          <input
            id={idInputArchivo}
            type="file"
            ref={inputArchivoRef}
            onChange={(e) => setArchivoFile(e.target.files[0])}
            className="sr-only"
          />
          <Boton type="submit" variante="primary" disabled={!archivoFile || subiendo} className="w-full">
            {subiendo ? 'Subiendo...' : 'Subir'}
          </Boton>
        </form>
      )}

      {archivos.filter((a) => Boolean(a.archivado) === mostrarArchivados).length === 0 ? (
        <p className="text-slate-500 text-sm">
          {mostrarArchivados ? 'No hay archivos archivados.' : 'No hay archivos subidos todavía.'}
        </p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {archivos.filter((a) => Boolean(a.archivado) === mostrarArchivados).map((a) => {
            const esImagen = /\.(png|jpe?g|gif|webp)$/i.test(a.archivo)
            return (
              <li key={a.id} className="py-2 text-sm flex justify-between items-center">
                {editandoNombreId === a.id ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      autoFocus
                      value={nombreEditado}
                      disabled={guardandoNombre}
                      onChange={(e) => {
                        setNombreEditado(e.target.value)
                        setNombreInvalido(false)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') guardarNombreArchivo(a.id)
                        if (e.key === 'Escape') cancelarEdicionNombre()
                      }}
                      className={`text-sm border rounded px-2 py-1 ${
                        nombreInvalido ? 'border-red-500' : 'border-slate-300'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => guardarNombreArchivo(a.id)}
                      disabled={guardandoNombre}
                      className="text-green-600 hover:text-green-700 text-xs px-1 disabled:opacity-50"
                      title="Guardar"
                    >
                      ✓
                    </button>
                    <button
                      type="button"
                      onClick={cancelarEdicionNombre}
                      disabled={guardandoNombre}
                      className="text-slate-400 hover:text-red-600 text-xs px-1 disabled:opacity-50"
                      title="Cancelar"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <a href={a.archivo} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {a.nombre}
                    </a>
                    <BotonIcono
                      icono={Pencil}
                      texto="Renombrar"
                      onClick={() => iniciarEdicionNombre(a)}
                    />
                  </div>
                )}
                <div className="flex items-center gap-3">
                  {!mostrarArchivados && esImagen && (
                    <BotonIcono
                      icono={PenTool}
                      texto="Anotar"
                      onClick={() => setArchivoAAnotar(a)}
                    />
                  )}
                  {!mostrarArchivados && (
                    <BotonIcono
                      icono={Archive}
                      texto="Archivar"
                      color="warning"
                      onClick={() => archivarArchivo(a.id)}
                    />
                  )}
                  {mostrarArchivados && (
                    <>
                      <BotonIcono
                        icono={ArchiveRestore}
                        texto="Restaurar"
                        color="success"
                        onClick={() => desarchivarArchivo(a.id)}
                      />
                      <BotonIcono
                        icono={Trash2}
                        texto="Eliminar"
                        color="destructive"
                        onClick={() => eliminarArchivo(a.id)}
                      />
                    </>
                  )}
                  <span className="text-slate-400 text-xs">
                    {formatearFecha(a.fecha_subida)}
                  </span>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {archivoAAnotar && (
        <AnotadorArchivo
          archivo={archivoAAnotar}
          clienteId={clienteId}
          onClose={() => setArchivoAAnotar(null)}
          onGuardado={cargarArchivos}
        />
      )}
    </div>
  )
}
