# feat(frontend): editor mensual de disponibilidad por médico

## Alcance

- Pantalla administrativa en `/admin/availability` y acceso por menú/botón de médicos.
- Listado de médicos reales con paginación desde `GET /api/doctors`.
- Precarga de reglas mensuales mediante `GET /api/doctors/{id}/availabilities`.
- Múltiples franjas por día con `React Hook Form` + `useFieldArray`.
- Validación de horarios, duración múltiplo de 30 minutos y superposiciones.
- Alta por POST y reemplazo por PUT, confirmación antes de quitar todas las franjas.
- Recarga después de guardar, recuperación de datos al cancelar, protección frente a respuestas tardías al cambiar de médico y visualización de errores de API.

## Evidencias (completar con resultados reales)

- [ ] `node --test src/modules/availability/utils/availabilityValidation.test.mjs`.
- [ ] `npm.cmd run lint`.
- [ ] `npm.cmd run build`.
- [ ] Login administrativo real contra la API local.
- [ ] POST inicial y GET reflejan franjas creadas.
- [ ] PUT de edición y GET reflejan cambios.
- [ ] Validaciones por superposición/duración.
- [ ] PUT con `days: []` mantiene citas previamente reservadas (verificar también desde backend).
- [ ] Consulta de slots con rol PACIENTE refleja las franjas y la preservación de reservas.
- [ ] Cambio rápido de médico y error de API no mezclan formularios.

## Dependencias / decisiones por confirmar

- Vigencia definitiva: consigna "próxima semana" vs. contrato API "mes actual".
- Integración definitiva de autenticación con Emilio.
- Tratamiento de un mes sin reglas después de haber guardado `days: []` (GET devuelve `[]`).
- Integración del listado de médicos real del compañero responsable.

No incluir datos de pacientes, credenciales ni tokens en las capturas o comentarios.
