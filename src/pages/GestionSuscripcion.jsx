import Layout from '../components/Layout'
import BotonVolver from '../components/BotonVolver'

export default function GestionSuscripcion() {
  return (
    <Layout titulo="Gestión de suscripción">
      <BotonVolver to="/profesionales" className="mb-4" />
      <div className="bg-white rounded-lg shadow-md p-6 max-w-md">
        <p className="text-slate-600 text-sm">
          Esta función va a estar disponible próximamente. Todavía no podés cambiar de
          plan ni gestionar el pago de tu suscripción desde acá.
        </p>
      </div>
    </Layout>
  )
}
