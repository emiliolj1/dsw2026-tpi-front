import { useEffect, useState } from 'react';
import { listDoctors } from '../../doctors/services/listDoctors';
import Button from '../../shared/components/Button';

export default function DoctorFilter({ specialtyId, value, onChange }) {
  const [doctors, setDoctors] = useState(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      const options = new Map();
      let pageIndex = 0;
      let page;

      do {
        page = await listDoctors({
          specialtyId,
          pageIndex,
          pageSize: 100,
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;

        for (const doctor of page.data) options.set(doctor.id, doctor);
        pageIndex += 1;
      } while (page.data.length && pageIndex * page.pageSize < page.total);
      setDoctors(Array.from(options.values()));
    }
    load().catch(() => {
      if (!controller.signal.aborted) setFailed(true);
    });

    return () => controller.abort();
  }, [specialtyId, attempt]);

  return (
    <div>
      <label htmlFor="appointment-doctor">Médico</label>
      <select
        id="appointment-doctor"
        className="w-full rounded-lg border border-med-border px-3 py-2"
        disabled={!doctors}
        value={value}
        onChange={onChange}
      >
        <option value="">
          {doctors || failed ? 'Todos los médicos' : 'Cargando médicos…'}
        </option>
        {doctors?.map((doc) => (
          <option key={doc.id} value={doc.id}>
            {doc.name} ({doc.licenseNumber})
          </option>
        ))}
      </select>
      {failed && (
        <div role="alert">
          No se pudieron cargar los médicos.{' '}
          <Button
            variant="ghost"
            onClick={() => {
              setFailed(false);
              setAttempt((n) => n + 1);
            }}
          >
            Reintentar médicos
          </Button>
        </div>
      )}
    </div>
  );
}
