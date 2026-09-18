import { useEffect, useState } from 'react'
import apiClient from '../api/client'
import Layout from '../components/Layout'
import FichaPacienteModal from '../components/FichaPacienteModal'
import BuscadorPaciente from '../components/BuscadorPaciente'
import NuevoPacienteModal from '../components/NuevoPacienteModal'
import SelectorPlantillaPlan from '../components/SelectorPlantillaPlan'
import Modal from '../components/Modal'
import Boton from '../components/Boton'

export default function Planes() {
  const [planes, setPlanes] = useState([])
  const [pacientes, setPacientes] = useState([])
  const [plantillasPlan, setPlantillasPlan] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [pacienteAbiertoId, setPacienteAbiertoId] = useState(null)

  const [modalAbierto, setModalAbierto] = useState(false)
  const [nuevoPaciente, setNuevoPaciente] = useState('')
  const [formPlan, setFormPlan] = useState({ sesiones_totales: '', precio: '', notas: '' })
  const [guardando, setGuardando] = useState(false)
  const [errorForm, setErrorForm] = useState('')
  const [modalNuevoPacienteAbierto, setModalNuevoPacienteAbierto] = useState(false)

  const cargarPlanes = () => {
    apiClient
      .get('/planes/')
      .then((res) => setPlanes(res.data))
      .catch(() => setError('No se pudieron cargar los planes.'))
  }

  useEffect(() => {
    Promise.all([
      apiClient.get('/planes/'),
      apiClient.get('/pacientes/'),
      apiClient.get('/plantillas-plan/'),
    ])
      .then(([planesRes, pacientesRes, plantillasRes]) => {
        setPlanes(planesRes.data)
        setPacientes(pacientesRes.data)
        setPlantillasPlan(plantillasRes.data.filter((pl) => pl.activo))
      })
      .catch(() => setError('No se pudieron cargar los planes.'))
      .finally(() => setLoading(false))
  }, [])

  const pacientesPorId = {}
  pacientes.forEach((p) => { pacientesPorId[p.id] = p })

  const abrirModal = () => {
    setModalAbierto(true)
    setNuevoPaciente('')
    setFormPlan({ sesiones_totales: '', precio: '', notas: '' })
    setErrorForm('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorForm('')
    if (!nuevoPaciente) {
      setErrorForm('Elegí un paciente.')
      return
    }
    setGuardando(true)
    try {
      await apiClient.post('/planes/', {
        paciente: nuevoPaciente,
        sesiones_totales: formPlan.sesiones_totales,
        precio: formPlan.precio,
        notas: formPlan.notas,
      })
      setModalAbierto(false)
      cargarPlanes()
    } catch (err) {
      const data = err.response?.data
      const mensaje = data ? Object.values(data).flat().join(' ') : 'No se pudo guardar el plan.'
      setErrorForm(mensaje)
    } finally {
      setGuardando(false)
    }
  }

  const termino = busqueda.trim().toLowerCase()
  const planesActivos = planes.filter((p) => p.activo)
  const planesFiltrados = termino
    ? planesActivos.filter((p) => {
        const pac = pacientesPorId[p.paciente]
        return pac && `${pac.nombre} ${pac.apellido}`.toLowerCase().includes(termino)
      })
    : planesActivos

  return (
    <Layout>
      {loading && <p className="text-slate-500">Cargando...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && !error && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4 gap-4">
            <h1 className="text-xl font-bold text-slate-800 whitespace-nowrap">Planes</h1>
            <input
              type="text"
              placeholder="Buscar por nombre de paciente..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="flex-1 max-w-xs border border-slate-300 rounded px-3 py-1.5 text-sm"
            />
            <Boton variante="primary" onClick={abrirModal} className="whitespace-nowrap">
              + Asignar plan
            </Boton>
          </div>

          {planesActivos.length === 0 ? (
            <p className="text-slate-500">No hay planes activos cargados todavía.</p>
          ) : planesFiltrados.length === 0 ? (
            <p className="text-slate-500">Ningún plan coincide con "{busqueda}".</p>
          ) : (
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-200">
                  <th className="py-2">Paciente</th>
                  <th className="py-2">Sesiones</th>
                  <th className="py-2">Restantes</th>
                  <th className="py-2">Precio</th>
                  <th className="py-2">Fecha de compra</th>
                </tr>
              </thead>
              <tbody>
                {planesFiltrados.map((p) => {
                  const pac = pacientesPorId[p.paciente]
                  return (
                    <tr key={p.id} className="border-b border-slate-100">
                      <td className="py-2">
                        <button
                          onClick={() => setPacienteAbiertoId(p.paciente)}
                          className="text-texto hover:text-btn-primary transition-colors"
                        >
                          {pac ? `${pac.nombre} ${pac.apellido}` : '—'}
                        </button>
                      </td>
                      <td className="py-2">{p.sesiones_usadas} / {p.sesiones_totales}</td>
                      <td className="py-2">{p.sesiones_restantes}</td>
                      <td className="py-2">${p.precio}</td>
                      <td className="py-2">{p.fecha_compra}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            </div>
          )}
        </div>
      )}

      {pacienteAbiertoId && (
        <FichaPacienteModal pacienteId={pacienteAbiertoId} onClose={() => setPacienteAbiertoId(null)} />
      )}

      {modalAbierto && (
        <Modal titulo="Asignar plan" onClose={() => setModalAbierto(false)}>
          {errorForm && <p className="text-input-error mb-3">{errorForm}</p>}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm text-slate-600 mb-1">Paciente</label>
              <BuscadorPaciente
                pacientes={pacientes}
                value={nuevoPaciente}
                onChange={setNuevoPaciente}
                onNuevoPaciente={() => setModalNuevoPacienteAbierto(true)}
              />
            </div>

            <div className="flex flex-wrap gap-2 items-end">
              <SelectorPlantillaPlan
                plantillas={plantillasPlan}
                sesiones={formPlan.sesiones_totales}
                precio={formPlan.precio}
                onChangeSesiones={(v) => setFormPlan((prev) => ({ ...prev, sesiones_totales: v }))}
                onChangePrecio={(v) => setFormPlan((prev) => ({ ...prev, precio: v }))}
              />
            </div>

            <div>
              <label className="block text-sm text-slate-600 mb-1">Notas (opcional)</label>
              <input
                type="text"
                value={formPlan.notas}
                onChange={(e) => setFormPlan({ ...formPlan, notas: e.target.value })}
                className="w-full border border-slate-300 rounded px-3 py-2"
              />
            </div>

            <Boton type="submit" variante="primary" disabled={guardando} className="w-full">
              {guardando ? 'Guardando...' : 'Asignar plan'}
            </Boton>
          </form>
        </Modal>
      )}

      {modalNuevoPacienteAbierto && (
        <NuevoPacienteModal
          onClose={() => setModalNuevoPacienteAbierto(false)}
          onCreado={(p) => {
            setPacientes((prev) => [...prev, p])
            setNuevoPaciente(p.id)
          }}
        />
      )}
    </Layout>
  )
}
