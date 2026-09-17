import Layout from '../components/Layout'
import BotonVolver from '../components/BotonVolver'
import CatalogoEditable from '../components/CatalogoEditable'
import { useAuth } from '../context/AuthContext'

const CAMPOS_TIPO_TURNO = [
  { name: 'nombre', label: 'Nombre', type: 'text', width: 'flex-1 min-w-[160px]' },
  { name: 'precio', label: 'Precio', type: 'number', min: 0, step: 0.01, width: 'w-28' },
  { name: 'duracion_minutos', label: 'Duración (min)', type: 'number', min: 1, width: 'w-32' },
]
const VALORES_TIPO_TURNO = { nombre: '', precio: '', duracion_minutos: '' }

const CAMPOS_PLANTILLA_PLAN = [
  { name: 'nombre', label: 'Nombre', type: 'text', width: 'flex-1 min-w-[160px]' },
  { name: 'sesiones_totales', label: 'Sesiones', type: 'number', min: 1, width: 'w-24' },
  { name: 'precio', label: 'Precio', type: 'number', min: 0, step: 0.01, width: 'w-28' },
]
const VALORES_PLANTILLA_PLAN = { nombre: '', sesiones_totales: '', precio: '' }

export default function ValoresTurnos() {
  const { auth } = useAuth()

  if (auth.rol !== 'dueño') {
    return (
      <Layout titulo="Valores turnos">
        <BotonVolver to="/turnos" className="mb-4" />
        <p className="text-red-600">No tenés permiso para ver esta pantalla. Pedile al dueño que administre los valores de turnos.</p>
      </Layout>
    )
  }

  return (
    <Layout titulo="Valores turnos">
      <BotonVolver to="/turnos" className="mb-4" />
      <div className="space-y-6">
        <CatalogoEditable
          titulo="Tipos de turno"
          endpoint="/tipos-turno/"
          campos={CAMPOS_TIPO_TURNO}
          valoresIniciales={VALORES_TIPO_TURNO}
          renderResumen={(item) => `${item.nombre} — $${item.precio} — ${item.duracion_minutos} min`}
        />
        <CatalogoEditable
          titulo="Plantillas de plan"
          endpoint="/plantillas-plan/"
          campos={CAMPOS_PLANTILLA_PLAN}
          valoresIniciales={VALORES_PLANTILLA_PLAN}
          renderResumen={(item) => `${item.nombre} — ${item.sesiones_totales} sesiones — $${item.precio}`}
        />
      </div>
    </Layout>
  )
}
