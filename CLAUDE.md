# QuiroNexus — Frontend (React + Vite)

Frontend de la app de gestión de turnos y fichas clínicas **exclusiva para quiroprácticos**. Consume la API del backend Django, que corre en paralelo en `http://127.0.0.1:8000/api` (carpeta hermana `Medical-Assistent`, repo distinto).

## Alcance del proyecto — importante

Este proyecto **pivotó** desde un diseño más ambicioso (multi-especialidad, autoregistro de profesionales por mail, invitaciones, "Mis pacientes" cross-organización). Esa versión quedó preservada en la rama de git `plataforma-multiespecialidad` — **no la toques a menos que se pida explícitamente**. El desarrollo activo es en `main`, con el alcance recortado a quiropraxia.

No reintroduzcas pantallas de registro de profesional por mail ni de invitaciones — fueron sacadas a propósito. El alta de profesional/secretaria es siempre directa (usuario/contraseña creados por el dueño).

## Stack

- React + Vite
- Tailwind CSS v4
- react-router-dom
- axios (cliente en `src/api/client.js`)
- react-datepicker (para el calendario de turnos)

## Estructura

- `src/context/AuthContext.jsx` — maneja login/registro/logout, guarda `{ token, username, rol, organizacion_id, organizacion_nombre, profesional_id }` en localStorage.
- `src/components/ProtectedRoute.jsx` — envuelve rutas que requieren sesión.
- `src/components/Navbar.jsx` — menú principal, con submenús condicionados por `auth.rol`.
- `src/components/Layout.jsx` — envuelve Navbar + contenido de cada página.
- `src/components/BotonVolver.jsx` — componente reutilizable para el link de "volver" a la lista anterior, usado en pantallas de detalle/alta/edición.
- `src/pages/` — una página por pantalla.

## Convenciones

- Nombres de componentes, variables de estado y texto de UI en **español**.
- Tailwind utility classes directo en JSX, sin CSS separado.
- Patrón estándar de cada página: `useState` para loading/error/datos, `useEffect` con `apiClient.get(...)` al montar, manejo de error con mensaje visible (no solo consola).
- Los formularios muestran errores del backend tal cual vienen (`err.response?.data`), no mensajes genéricos inventados — el backend ya manda mensajes claros.
- **Ocultar en la UI lo que el backend igual rechazaría** — si un botón/link lleva a una acción que un rol no puede hacer, no se muestra para ese rol (además del check en el backend). Ya hubo bugs por mostrar opciones que después tiraban 403.
- Subida de archivos con `FormData`: pasar `headers: { 'Content-Type': undefined }` en la llamada de axios para que arme el multipart/boundary correctamente — no dejar que el header por defecto lo pise.

## Roles y qué ve cada uno

- **dueño**: todo — pacientes, profesionales, secretaria, plan, turnos, disponibilidad, cierres de sucursal.
- **secretaria**: pacientes y turnos, sin ver contenido clínico ni datos personales sensibles de pacientes sin vínculo. No gestiona profesionales ni plan.
- **profesional**: solo sus propios turnos/consultas. No crea turnos ni pacientes. Ve datos completos solo de pacientes con los que tiene vínculo (turno, consulta, o interconsulta aprobada) — de lo contrario, solo nombre y apellido.

## Testing manual

No hay tests automatizados. Se prueba manualmente con `npm run dev` + el backend Django corriendo en paralelo. El archivo `PROYECTO.md` en el repo del backend tiene el estado completo del proyecto si hace falta más contexto.