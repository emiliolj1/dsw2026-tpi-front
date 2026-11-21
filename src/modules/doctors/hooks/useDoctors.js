import { useEffect, useState } from 'react';
import { getApiError } from '../../shared/api/apiError';
import { deleteDoctor } from '../services/deleteDoctor';
import { listDoctors } from '../services/listDoctors';

const emptyFilters = { name: '', specialtyId: '' };

export function useDoctors() {
  const [draft, setDraft] = useState(emptyFilters);
  const [filterError, setFilterError] = useState('');
  const [query, setQuery] = useState({ ...emptyFilters, pageIndex: 0 });
  const [result, setResult] = useState(null);
  const [removingId, setRemovingId] = useState(null);
  const [removalError, setRemovalError] = useState('');
  const loading = result?.query !== query;

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const page = await listDoctors({ ...query, signal: controller.signal });

        if (controller.signal.aborted) {
          return;
        }

        const lastPage = Math.max(0, Math.ceil(page.total / page.pageSize) - 1);

        if (query.pageIndex > lastPage) {
          setQuery((current) =>
            current === query ? { ...query, pageIndex: lastPage } : current
          );

          return;
        }

        setResult({ query, page, error: '' });
      } catch (error) {
        if (!controller.signal.aborted) {
          const { message } = getApiError(error);

          setResult({
            query,
            page: null,
            error:
              typeof message === 'string' && message.trim()
                ? message
                : 'No se pudo cargar el listado de médicos.',
          });
        }
      }
    }

    load();

    return () => controller.abort();
  }, [query]);

  function changeName(name) {
    setDraft((current) => ({ ...current, name }));
    setFilterError('');
  }

  function changeSpecialty(specialtyId) {
    setDraft((current) => ({ ...current, specialtyId }));
  }

  function search() {
    const name = draft.name.trim();

    if (name && (name.length < 3 || name.length > 100)) {
      setFilterError('Ingresá entre 3 y 100 caracteres para buscar.');

      return;
    }

    setFilterError('');
    setQuery({ name, specialtyId: draft.specialtyId, pageIndex: 0 });
  }

  function showDoctor(name) {
    const filters = { name, specialtyId: '' };

    setDraft(filters);
    setFilterError('');
    setQuery({ ...filters, pageIndex: 0 });
  }

  function changePage(nextPage) {
    setQuery((current) => ({ ...current, pageIndex: nextPage - 1 }));
  }

  function reload() {
    setQuery((current) => ({ ...current }));
  }

  async function removeDoctor(id) {
    setRemovalError('');
    setRemovingId(id);

    try {
      await deleteDoctor(id);

      return true;
    } catch (error) {
      const { message, status } = getApiError(error);
      const hasMessage = typeof message === 'string' && message.trim();
      const guidance =
        'No se pudo confirmar la baja. Revisá el listado antes de volver a intentar.';

      if (!status || !hasMessage) {
        setRemovalError(guidance);
      } else if (status >= 500) {
        setRemovalError(`${message} ${guidance}`);
      } else {
        setRemovalError(message);
      }

      return false;
    } finally {
      setRemovingId(null);
      reload();
    }
  }

  return {
    draft,
    hasAppliedFilters: Boolean(query.name || query.specialtyId),
    filterError,
    loading,
    page: loading ? null : result.page,
    error: loading ? '' : result.error,
    removalError,
    removingId,
    changeName,
    changeSpecialty,
    search,
    clearSearch: () => showDoctor(''),
    showDoctor,
    changePage,
    reload,
    removeDoctor,
    clearRemovalError: () => setRemovalError(''),
  };
}
