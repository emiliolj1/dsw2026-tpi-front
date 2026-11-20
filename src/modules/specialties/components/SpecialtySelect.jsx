import { useEffect, useState } from 'react';
import Button from '../../shared/components/Button';
import { listSpecialties } from '../services/listSpecialties';

function SpecialtySelect({ id, value, onChange, emptyLabel }) {
  const [options, setOptions] = useState(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const specialties = new Map();
        let pageIndex = 0;
        let page;

        do {
          page = await listSpecialties({
            pageIndex,
            pageSize: 100,
            signal: controller.signal,
          });

          if (controller.signal.aborted) {
            return;
          }

          for (const specialty of page.data) {
            specialties.set(specialty.id, specialty);
          }

          pageIndex += 1;
        } while (page.data.length && pageIndex * page.pageSize < page.total);

        setOptions(Array.from(specialties.values()));
      } catch {
        if (!controller.signal.aborted) {
          setFailed(true);
        }
      }
    }

    load();

    return () => controller.abort();
  }, [attempt]);

  return (
    <div>
      <select
        id={id}
        value={value}
        onChange={onChange}
        disabled={!options}
        className="w-full rounded-lg border border-med-border bg-white px-3 py-2 text-sm"
      >
        <option value="">
          {options || failed ? emptyLabel : 'Cargando especialidades…'}
        </option>
        {options?.map(({ id: specialtyId, name }) => (
          <option key={specialtyId} value={specialtyId}>
            {name}
          </option>
        ))}
      </select>
      {failed && (
        <div
          className="mt-1 flex items-center gap-2 text-sm text-red-600"
          role="alert"
        >
          No se pudieron cargar las especialidades.
          <Button
            variant="ghost"
            onClick={() => {
              setFailed(false);
              setAttempt((n) => n + 1);
            }}
          >
            Reintentar especialidades
          </Button>
        </div>
      )}
    </div>
  );
}

export default SpecialtySelect;
