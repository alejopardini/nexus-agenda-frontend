import { useState } from 'react'

export default function SelectorPlantillaPlan({ plantillas, sesiones, precio, onChangeSesiones, onChangePrecio }) {
  const [plantillaId, setPlantillaId] = useState('')

  const elegirPlantilla = (id) => {
    setPlantillaId(id)
    if (!id) return
    const plantilla = plantillas.find((pl) => String(pl.id) === String(id))
    if (plantilla) {
      onChangeSesiones(String(plantilla.sesiones_totales))
      onChangePrecio(String(plantilla.precio))
    }
  }

  return (
    <>
      {plantillas.length > 0 && (
        <div className="w-full">
          <label className="block text-xs text-slate-500 mb-1">Elegir plantilla</label>
          <select
            value={plantillaId}
            onChange={(e) => elegirPlantilla(e.target.value)}
            className="w-full text-sm border border-slate-300 rounded px-2 py-1.5"
          >
            <option value="">Plan personalizado</option>
            {plantillas.map((pl) => (
              <option key={pl.id} value={pl.id}>{pl.nombre} — {pl.sesiones_totales} sesiones — ${pl.precio}</option>
            ))}
          </select>
        </div>
      )}
      <div>
        <label className="block text-xs text-slate-500 mb-1">Sesiones</label>
        <input
          type="number"
          min="1"
          value={sesiones}
          onChange={(e) => onChangeSesiones(e.target.value)}
          disabled={Boolean(plantillaId)}
          className="w-24 text-sm border border-slate-300 rounded px-2 py-1.5 disabled:bg-slate-100 disabled:text-slate-500"
          required
        />
      </div>
      <div>
        <label className="block text-xs text-slate-500 mb-1">Precio</label>
        <input
          type="number"
          min="0"
          step="0.01"
          value={precio}
          onChange={(e) => onChangePrecio(e.target.value)}
          disabled={Boolean(plantillaId)}
          className="w-28 text-sm border border-slate-300 rounded px-2 py-1.5 disabled:bg-slate-100 disabled:text-slate-500"
          required
        />
      </div>
    </>
  )
}
