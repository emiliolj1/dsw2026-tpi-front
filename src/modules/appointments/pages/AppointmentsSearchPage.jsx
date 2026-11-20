import { useEffect, useState } from 'react';
import Card from '../../shared/components/Card';
import Button from '../../shared/components/Button';
import TablePagination from '../../shared/components/TablePagination';
import SpecialtySelect from '../../specialties/components/SpecialtySelect';
import DoctorFilter from '../components/DoctorFilter';
import { updateAppointmentStatus } from '../services/updateAppointmentStatus';
import { searchAppointments } from '../services/searchAppointments';

const emptyFilters = {
  dni: '',
  specialtyId: '',
  doctorId: '',
  date: '',
  status: '',
};
const states = {
  BOOKED: 'Reservado',
  CANCELLED: 'Cancelado',
  ATTENDED: 'Atendido',
  NO_SHOW: 'Ausente',
};
const inputClass = 'w-full rounded-lg border border-med-border px-3 py-2';

function AppointmentsSearchPage() {
  const [filters, setFilters] = useState(emptyFilters);
  const [dniError, setDniError] = useState('');
  const [query, setQuery] = useState({
    ...emptyFilters,
    pageIndex: 0,
    pageSize: 10,
  });
  const [pendingId, setPendingId] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [result, setResult] = useState(null);
  const current = result?.query === query ? result : null;
  const page = current?.page;

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const response = await searchAppointments(query, controller.signal);

        if (controller.signal.aborted) return;

        const lastPage = Math.max(
          0,
          Math.ceil(response.total / response.pageSize) - 1
        );

        if (query.pageIndex > lastPage) {
          setQuery({ ...query, pageIndex: lastPage });

          return;
        }

        setResult({ query, page: response });
      } catch (err) {
        if (!controller.signal.aborted) {
          const message = err.response?.data?.message;

          setResult({
            query,
            error:
              typeof message === 'string' && message
                ? message
                : 'No se pudieron cargar los turnos.',
          });
        }
      }
    }
    load();

    return () => controller.abort();
  }, [query]);

  async function markStatus(turn, nextStatus) {
    if (pendingId !== null) return;

    const description = `${turn.patient.fullName} · ${turn.date.split('-').reverse().join('/')} · ${turn.startTime} · ${turn.doctor.name}`;

    if (
      !window.confirm(
        `¿Marcar como ${states[nextStatus].toLowerCase()} el turno de ${description}?`
      )
    )
      return;

    setPendingId(turn.appointmentsId);
    setFeedback(null);
    try {
      const updated = await updateAppointmentStatus(
        turn.appointmentsId,
        nextStatus
      );

      setFeedback({
        role: 'status',
        message: `${description}. Estado actualizado a ${states[updated.appointmentsStatus]}.`,
      });
    } catch (err) {
      const message = err.response?.data?.message;

      setFeedback({
        role: 'alert',
        message:
          typeof message === 'string' && message
            ? message
            : 'No se pudo confirmar el cambio de estado. Revisá el estado del turno antes de reintentar.',
      });
    } finally {
      setPendingId(null);
      setQuery((latest) => ({ ...latest }));
    }
  }

  function submit(event) {
    event.preventDefault();
    const dni = filters.dni.trim().replaceAll('.', '');

    if (dni && (!/^\d{7,10}$/.test(dni) || Number(dni) < 1000000)) {
      setDniError('Ingresá un DNI de 7 a 10 dígitos.');

      return;
    }

    setDniError('');
    setQuery({ ...filters, dni, pageIndex: 0, pageSize: 10 });
  }
  function clear() {
    setFilters(emptyFilters);
    setDniError('');
    setQuery({ ...emptyFilters, pageIndex: 0, pageSize: 10 });
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-med-text-main">
        Búsqueda de turnos
      </h1>
      <Card>
        <form role="search" onSubmit={submit} className="space-y-4">
          <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label htmlFor="appointment-dni">DNI del paciente</label>
              <input
                className={inputClass}
                id="appointment-dni"
                inputMode="numeric"
                value={filters.dni}
                aria-invalid={Boolean(dniError)}
                aria-describedby={dniError ? 'dni-error' : undefined}
                onChange={(e) => {
                  setFilters({ ...filters, dni: e.target.value });
                  setDniError('');
                }}
              />
              {dniError && (
                <p id="dni-error" role="alert">
                  {dniError}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="appointment-specialty">Especialidad</label>
              <SpecialtySelect
                id="appointment-specialty"
                emptyLabel="Todas las especialidades"
                value={filters.specialtyId}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    specialtyId: e.target.value,
                    doctorId: '',
                  })
                }
              />
            </div>
            <DoctorFilter
              key={filters.specialtyId}
              specialtyId={filters.specialtyId}
              value={filters.doctorId}
              onChange={(e) =>
                setFilters({ ...filters, doctorId: e.target.value })
              }
            />
            <div>
              <label htmlFor="appointment-date">Fecha</label>
              <input
                className={inputClass}
                id="appointment-date"
                type="date"
                value={filters.date}
                onChange={(e) =>
                  setFilters({ ...filters, date: e.target.value })
                }
              />
            </div>
            <div>
              <label htmlFor="appointment-status">Estado</label>
              <select
                className={inputClass}
                id="appointment-status"
                value={filters.status}
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value })
                }
              >
                <option value="">Todos los estados</option>
                {Object.entries(states).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit">Buscar</Button>
            <Button variant="outline" onClick={clear}>
              Limpiar
            </Button>
          </div>
        </form>
      </Card>
      <Card className="p-0 overflow-hidden">
        <h2 className="p-5 text-base font-bold text-med-primary-900">
          Turnos encontrados
        </h2>
        {feedback && (
          <p role={feedback.role} className="px-5 pb-3">
            {feedback.message}
          </p>
        )}
        {!current && (
          <p role="status" className="p-5">
            Cargando turnos…
          </p>
        )}
        {current?.error && (
          <div className="p-5" role="alert">
            {current.error}{' '}
            <Button variant="outline" onClick={() => setQuery({ ...query })}>
              Reintentar
            </Button>
          </div>
        )}
        {page && (
          <>
            {page.data.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-med-primary-50">
                    <tr>
                      {[
                        'Fecha y hora',
                        'Paciente',
                        'Médico',
                        'Especialidad',
                        'Estado',
                        'Detalle',
                      ].map((label) => (
                        <th className="px-4 py-3" key={label}>
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-med-border">
                    {page.data.map((turn) => (
                      <tr key={turn.appointmentsId}>
                        <td className="px-4 py-3">
                          {turn.date.split('-').reverse().join('/')}
                          <br />
                          {turn.startTime} – {turn.endTime}
                        </td>
                        <td className="px-4 py-3">
                          {turn.patient.fullName}
                          <br />
                          DNI {turn.patient.dni}
                        </td>
                        <td className="px-4 py-3">{turn.doctor.name}</td>
                        <td className="px-4 py-3">
                          {turn.doctor.specialty.name}
                        </td>
                        <td className="px-4 py-3">
                          {states[turn.appointmentsStatus] ??
                            turn.appointmentsStatus}
                        </td>
                        <td className="px-4 py-3">
                          <details>
                            <summary className="cursor-pointer">
                              Ver detalle
                            </summary>
                            <p>Motivo: {turn.reason || 'Sin registrar'}</p>
                            {turn.appointmentsStatus === 'BOOKED' && (
                              <div className="mt-2 space-y-2">
                                <p className="text-xs text-med-text-muted">
                                  Registrá la asistencia una vez terminado el
                                  turno.
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {['ATTENDED', 'NO_SHOW'].map((status) => (
                                    <Button
                                      key={status}
                                      variant="outline"
                                      disabled={pendingId !== null}
                                      onClick={() => markStatus(turn, status)}
                                    >
                                      Marcar como {states[status].toLowerCase()}
                                    </Button>
                                  ))}
                                </div>
                                {pendingId === turn.appointmentsId && (
                                  <p role="status">Guardando estado…</p>
                                )}
                              </div>
                            )}
                          </details>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="p-5" role="status">
                {Object.keys(emptyFilters).some((key) => query[key])
                  ? 'Ningún turno coincide con los filtros.'
                  : 'Todavía no hay turnos registrados.'}
              </p>
            )}
            <TablePagination
              currentPage={page.pageIndex + 1}
              totalPages={Math.max(1, Math.ceil(page.total / page.pageSize))}
              totalItems={page.total}
              pageSize={page.pageSize}
              onPageChange={(next) =>
                setQuery({ ...query, pageIndex: next - 1 })
              }
            />
          </>
        )}
      </Card>
    </div>
  );
}
export default AppointmentsSearchPage;
