# Turno Norte

Frontend para pacientes y administración de la clínica.

## Integrantes

- Ferreyra, Lucas Tomas
- Ferreyra, Matias Ignacio
- Lopez, Carlos Facundo
- Luna Jandar, Emilio

## Arranque local

1. Levantá la API en `http://localhost:5278` siguiendo la [guía de integración del backend](https://github.com/emiliolj1/dsw2026-tpi/blob/development/docs/backend/integracion-frontend.md).
2. Con Node.js 22.12+ o 24 LTS, ejecutá `npm ci` y `npm run dev -- --port 5173 --strictPort`.
3. Abrí `http://localhost:5173/login` para pacientes o `http://localhost:5173/admin/login` para administración.

Si la API usa otra dirección, definí `VITE_BACKEND_URL` en `.env.development.local` y reiniciá Vite. Usá `npm run lint` y `npm run build` para verificar los cambios.

## Integración de módulos

- Llamá a la API con `instance` de `src/modules/shared/api/axiosInstance.js`. Adjunta el JWT y elimina la sesión vigente si la API rechaza ese token con HTTP 401.
- Usá `getApiError(error)` de `src/modules/shared/api/apiError.js` para acceder a `status`, `errorCode`, `message` y `details`.
- `useAuth()` expone `session`, que contiene `{ token, role }` y agrega `dni` numérico para `PACIENTE`. Sin sesión, devuelve `session: null`.

## Panel administrativo

El panel consulta los totales y el listado inicial de médicos con `GET /api/doctors`, `GET /api/specialties` y `GET /api/appointments?date=YYYY-MM-DD&status=BOOKED`. La fecha se calcula en la zona horaria de la clínica. La acción **Ver detalle** abre el listado de médicos.

## Recorrido de defensa

1. Iniciá sesión como administrador y verificá los indicadores del panel.
2. Creá una especialidad y un médico. Configurá franjas futuras en su agenda.
3. Iniciá sesión como paciente desde un móvil, elegí un horario y reservá.
4. Confirmá que la cita se ve en **Mis turnos** y en la búsqueda administrativa.
5. Cancelá la cita desde el portal del paciente y verificá el resultado en administración.
