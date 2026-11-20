import { useEffect, useState } from 'react';
import Card from '../../shared/components/Card';
import Button from '../../shared/components/Button';
import SpecialtyForm from '../components/SpecialtyForm';
import { listSpecialties } from '../services/listSpecialties';
import { deleteSpecialty } from '../services/deleteSpecialty';

function SpecialtiesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterError, setFilterError] = useState('');
  const [query, setQuery] = useState({ name: '', pageIndex: 0 });
  const [result, setResult] = useState(null);
  const [editor, setEditor] = useState(null);
  const [notice, setNotice] = useState('');
  const [removingId, setRemovingId] = useState(null);
  const [removalError, setRemovalError] = useState('');
  const busy = Boolean(editor) || removingId !== null;
  const loading = result?.query !== query;
  const page = loading ? null : result.page;
  const error = loading ? '' : result.error;

  useEffect(() => {
    const controller = new AbortController();

    async function loadPage() {
      try {
        const data = await listSpecialties({
          ...query,
          signal: controller.signal,
        });

        if (controller.signal.aborted) {
          return;
        }

        const lastPage = Math.max(0, Math.ceil(data.total / data.pageSize) - 1);

        if (query.pageIndex > lastPage) {
          setQuery({ ...query, pageIndex: lastPage });

          return;
        }

        setResult({ query, page: data, error: '' });
      } catch (err) {
        if (!controller.signal.aborted) {
          const message = err.response?.data?.message;

          setResult({
            query,
            page: null,
            error:
              typeof message === 'string' && message
                ? message
                : 'No se pudieron cargar las especialidades.',
          });
        }
      }
    }

    loadPage();

    return () => controller.abort();
  }, [query]);

  function search(event) {
    event.preventDefault();

    const name = searchTerm.trim();

    if (name && (name.length < 3 || name.length > 100)) {
      setFilterError('Ingresá entre 3 y 100 caracteres para buscar.');

      return;
    }

    setFilterError('');
    setQuery({ name, pageIndex: 0 });
  }

  function showSaved({ name }) {
    setEditor(null);
    setRemovalError('');
    setNotice(
      `${editor.specialty ? 'Se actualizó' : 'Se creó'} la especialidad «${name}».`
    );
    setSearchTerm(name);
    setFilterError('');
    setQuery({ name, pageIndex: 0 });
  }

  function clearSearch() {
    setSearchTerm('');
    setFilterError('');
    setQuery({ name: '', pageIndex: 0 });
  }

  async function removeSpecialty({ id, name }) {
    if (
      removingId ||
      !window.confirm(`¿Dar de baja la especialidad «${name}»?`)
    ) {
      return;
    }

    setRemovalError('');
    setNotice('');
    setRemovingId(id);

    try {
      await deleteSpecialty(id);
      setNotice(`Se dio de baja la especialidad «${name}».`);
    } catch (err) {
      const message = err.response?.data?.message;

      setRemovalError(
        typeof message === 'string' && message.trim()
          ? `Baja de «${name}». ${message}`
          : `No se pudo confirmar la baja de «${name}».`
      );
    } finally {
      setRemovingId(null);
      setQuery((current) => ({ ...current }));
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Cabecera con Título, Buscador y Botón */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-med-text-main">
            Directorio de Especialidades
          </h1>
          <p className="text-sm text-med-text-sub mt-1">
            Administre las categorías médicas, servicios y disponibilidad del
            personal especializado.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <form onSubmit={search} role="search">
            <div className="flex flex-wrap items-center gap-2">
              <label htmlFor="specialty-name" className="sr-only">
                Nombre de la especialidad
              </label>
              <input
                id="specialty-name"
                type="search"
                placeholder="Buscar por nombre"
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setFilterError('');
                }}
                aria-invalid={Boolean(filterError)}
                aria-describedby={
                  filterError ? 'specialty-filter-error' : undefined
                }
                className="px-3 py-2 text-sm border border-med-border rounded-lg"
              />
              <Button type="submit" variant="secondary">
                Buscar
              </Button>
              {(searchTerm || query.name) && (
                <Button variant="ghost" onClick={clearSearch}>
                  Limpiar
                </Button>
              )}
            </div>
            {filterError && (
              <p
                id="specialty-filter-error"
                role="alert"
                className="mt-1 text-sm text-red-600"
              >
                {filterError}
              </p>
            )}
          </form>

          {/* Botón Nueva Especialidad */}
          <Button
            aria-expanded={editor?.specialty === null}
            disabled={busy}
            onClick={() => {
              setNotice('');
              setRemovalError('');
              setEditor({ specialty: null });
            }}
            className="flex items-center gap-1.5 bg-med-primary-900 hover:bg-med-primary-800 text-white font-medium"
          >
            <span>+</span>
            <span>Nueva Especialidad</span>
          </Button>
        </div>
      </div>

      {editor && (
        <SpecialtyForm
          specialty={editor.specialty}
          onSaved={showSaved}
          onCancel={() => setEditor(null)}
        />
      )}
      {notice && (
        <p role="status" className="text-sm font-medium text-med-primary-900">
          {notice}
        </p>
      )}
      {removalError && (
        <p role="alert" className="text-sm font-medium text-red-600">
          {removalError}
        </p>
      )}
      {/* Tabla Principal de Especialidades */}
      <Card className="p-0 overflow-hidden border-med-border">
        <div className="p-5 border-b border-med-border">
          <h2 className="text-base font-bold text-med-primary-900">
            Registros de Especialidades
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-med-primary-50/70 text-[11px] uppercase tracking-wider text-med-text-sub border-b border-med-border">
              <tr>
                <th className="px-6 py-3.5">Nombre de la Especialidad</th>
                <th className="px-6 py-3.5">Descripción</th>
                <th className="px-6 py-3.5 text-center">Estado</th>
                <th className="px-6 py-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-med-border-subtle">
              {(loading || error || page?.data.length === 0) && (
                <tr>
                  <td colSpan={4} className="px-6 py-5 text-med-text-sub">
                    {loading && (
                      <span role="status">Cargando especialidades…</span>
                    )}
                    {error && (
                      <div
                        role="alert"
                        className="flex flex-wrap items-center gap-3"
                      >
                        <span>{error}</span>
                        <Button
                          variant="outline"
                          onClick={() => setQuery({ ...query })}
                        >
                          Reintentar
                        </Button>
                      </div>
                    )}
                    {page?.data.length === 0 && (
                      <span role="status">
                        {query.name
                          ? 'Ninguna especialidad coincide con la búsqueda.'
                          : 'Todavía no hay especialidades registradas.'}
                      </span>
                    )}
                  </td>
                </tr>
              )}
              {page?.data.map((spec) => (
                <tr
                  key={spec.id}
                  className="hover:bg-gray-50/70 transition-colors"
                >
                  <td className="px-6 py-4 font-semibold text-med-primary-900">
                    {spec.name}
                  </td>

                  {/* Descripción */}
                  <td className="px-6 py-4 text-med-text-sub max-w-md">
                    {spec.description}
                  </td>

                  <td className="px-6 py-4 text-center">
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-med-active-bg text-med-active-text">
                      Activa
                    </span>
                  </td>

                  {/* Acciones: Editar y Eliminar */}
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 text-med-text-muted">
                      <button
                        title="Editar especialidad"
                        className="p-1.5 rounded-lg hover:bg-med-primary-50 text-med-text-muted hover:text-med-primary-900 transition"
                        aria-label={`Editar ${spec.name}`}
                        disabled={busy}
                        onClick={() => {
                          setNotice('');
                          setRemovalError('');
                          setEditor({ specialty: spec });
                        }}
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                          />
                        </svg>
                      </button>

                      <button
                        type="button"
                        title="Dar de baja la especialidad"
                        aria-label={`Dar de baja ${spec.name}`}
                        disabled={busy}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-med-text-muted hover:text-med-danger-text transition disabled:opacity-50"
                        onClick={() => removeSpecialty(spec)}
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {page && (
          <div className="p-4 bg-med-primary-50/50 border-t border-med-border flex items-center justify-between gap-2 text-xs text-med-text-sub">
            <span aria-live="polite">
              {page.total <= 1
                ? page.total === 1
                  ? '1 registro'
                  : '0 registros'
                : `${page.pageIndex * page.pageSize + 1}–${page.pageIndex * page.pageSize + page.data.length} de ${page.total} registros`}
            </span>
            <nav aria-label="Páginas de especialidades" className="flex gap-2">
              <Button
                variant="outline"
                disabled={page.pageIndex === 0}
                className="disabled:opacity-50"
                onClick={() =>
                  setQuery({ ...query, pageIndex: page.pageIndex - 1 })
                }
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                disabled={(page.pageIndex + 1) * page.pageSize >= page.total}
                className="disabled:opacity-50"
                onClick={() =>
                  setQuery({ ...query, pageIndex: page.pageIndex + 1 })
                }
              >
                Siguiente
              </Button>
            </nav>
          </div>
        )}
      </Card>
    </div>
  );
}

export default SpecialtiesPage;
