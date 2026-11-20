import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { instance } from '../../shared/api/axiosInstance';
import { getApiError } from '../../shared/api/apiError';
import Card from '../../shared/components/Card';

const clinicDateFormatter = new Intl.DateTimeFormat('en', {
  timeZone: 'America/Argentina/Buenos_Aires',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

function getClinicDate() {
  const parts = clinicDateFormatter.formatToParts(new Date());
  const [year, month, day] = ['year', 'month', 'day'].map(
    (type) => parts.find((part) => part.type === type).value
  );

  return `${year}-${month}-${day}`;
}

function Metric({ title, result }) {
  return (
    <Card className="p-6">
      <h2 className="text-lg text-med-primary-900">{title}</h2>
      {result?.error ? (
        <p role="alert" className="mt-2 text-sm text-med-danger-text">
          {result.error}
        </p>
      ) : (
        <p className="mt-2 text-3xl font-semibold text-med-primary-900">
          {result?.page.total ?? '…'}
        </p>
      )}
    </Card>
  );
}

function OverviewPage() {
  const [results, setResults] = useState({});

  useEffect(() => {
    const controller = new AbortController();

    async function load(key, path, params) {
      try {
        const { data } = await instance.get(path, {
          params,
          signal: controller.signal,
        });

        if (!controller.signal.aborted) {
          setResults((current) => ({ ...current, [key]: { page: data } }));
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          const { message } = getApiError(error);

          setResults((current) => ({ ...current, [key]: { error: message } }));
        }
      }
    }

    load('doctors', '/api/doctors', { pageSize: 5 });
    load('specialties', '/api/specialties', { pageSize: 1 });
    load('booked', '/api/appointments', {
      date: getClinicDate(),
      status: 'BOOKED',
      pageSize: 1,
    });

    return () => controller.abort();
  }, []);

  const doctors = results.doctors?.page;
  const actionClass =
    'rounded-lg border border-med-primary-900 px-4 py-2 text-sm font-medium text-med-primary-900 hover:bg-med-primary-50';

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-3xl text-med-primary-900">Panel administrativo</h1>
        <div className="flex flex-wrap gap-2">
          <Link to="/admin/doctors" className={actionClass}>
            Gestionar médicos
          </Link>
          <Link to="/admin/specialties" className={actionClass}>
            Gestionar especialidades
          </Link>
        </div>
      </header>

      <section aria-label="Indicadores" className="grid gap-4 sm:grid-cols-3">
        <Metric title="Médicos activos" result={results.doctors} />
        <Metric title="Especialidades activas" result={results.specialties} />
        <Metric title="Turnos confirmados hoy" result={results.booked} />
      </section>

      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl text-med-primary-900">
            Profesionales médicos
          </h2>
          <Link to="/admin/doctors" className={actionClass}>
            Ver detalle
          </Link>
        </div>

        {results.doctors?.error && (
          <p role="alert" className="mt-4 text-sm text-med-danger-text">
            No se pudo cargar el listado. {results.doctors.error}
          </p>
        )}
        {!results.doctors && (
          <p role="status" className="mt-4 text-sm text-med-text-sub">
            Cargando profesionales…
          </p>
        )}
        {doctors?.data.length === 0 && (
          <p className="mt-4 text-sm text-med-text-sub">
            Todavía no hay médicos activos.
          </p>
        )}
        {doctors?.data.length > 0 && (
          <>
            <ul className="mt-4 divide-y divide-med-border">
              {doctors.data.map((doctor) => (
                <li
                  key={doctor.id}
                  className="flex flex-wrap justify-between gap-x-4 gap-y-1 py-3"
                >
                  <div>
                    <p className="font-medium text-med-primary-900">
                      {doctor.name}
                    </p>
                    {doctor.specialty?.name && (
                      <p className="text-sm text-med-text-sub">
                        {doctor.specialty.name}
                      </p>
                    )}
                  </div>
                  <p className="text-sm text-med-text-sub">
                    Matrícula {doctor.licenseNumber}
                  </p>
                </li>
              ))}
            </ul>
            <p className="border-t border-med-border pt-3 text-sm text-med-text-sub">
              {doctors.data.length} de {doctors.total} profesionales activos
            </p>
          </>
        )}
      </Card>
    </div>
  );
}

export default OverviewPage;
