import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../shared/components/Card';
import Button from '../../shared/components/Button';
import TablePagination from '../../shared/components/TablePagination';
import SpecialtySelect from '../../specialties/components/SpecialtySelect';
import DoctorForm from '../components/DoctorForm';
import { deleteDoctor } from '../services/deleteDoctor';
import { listDoctors } from '../services/listDoctors';

function DoctorsPage() {
  const navigate = useNavigate();
  const [editor, setEditor] = useState(null);
  const [notice, setNotice] = useState('');
  const [removingId, setRemovingId] = useState(null);
  const [removalError, setRemovalError] = useState('');
  const actionsDisabled = Boolean(editor) || removingId !== null;
  const [searchTerm, setSearchTerm] = useState('');
  const [specialtyId, setSpecialtyId] = useState('');
  const [filterError, setFilterError] = useState('');
  const [query, setQuery] = useState({
    name: '',
    specialtyId: '',
    pageIndex: 0,
  });
  const [result, setResult] = useState(null);
  const loading = result?.query !== query;
  const page = loading ? null : result.page;
  const error = loading ? '' : result.error;

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const data = await listDoctors({ ...query, signal: controller.signal });

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
                : 'No se pudo cargar el listado de médicos.',
          });
        }
      }
    }

    load();

    return () => controller.abort();
  }, [query]);

  async function removeDoctor({ id, name, licenseNumber }) {
    if (
      actionsDisabled ||
      !window.confirm(`¿Dar de baja a ${name} (matrícula ${licenseNumber})?`)
    ) {
      return;
    }

    setNotice('');
    setRemovalError('');
    setRemovingId(id);

    try {
      await deleteDoctor(id);
      setNotice(`Se dio de baja a ${name} (matrícula ${licenseNumber}).`);
    } catch (err) {
      const message = err.response?.data?.message;

      setRemovalError(
        typeof message === 'string' && message
          ? message
          : 'No se pudo confirmar la baja. Revisá el listado antes de volver a intentar.'
      );
    } finally {
      setRemovingId(null);
      setQuery((current) => ({ ...current }));
    }
  }

  function search(event) {
    event.preventDefault();

    const name = searchTerm.trim();

    if (name && (name.length < 3 || name.length > 100)) {
      setFilterError('Ingresá entre 3 y 100 caracteres para buscar.');

      return;
    }

    setFilterError('');
    setQuery({ name, specialtyId, pageIndex: 0 });
  }

  function clearSearch() {
    setSearchTerm('');
    setSpecialtyId('');
    setFilterError('');
    setQuery({ name: '', specialtyId: '', pageIndex: 0 });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Título y Acciones de Cabecera */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-med-text-main">
            Directorio de Doctores
          </h1>
          <p className="text-sm text-med-text-sub mt-1">
            Gestione el personal médico y supervise su disponibilidad actual.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={() => navigate('/admin/availability')}
            className="flex items-center gap-2 bg-med-primary-900 hover:bg-med-primary-800 text-white"
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
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>Agregar Disponibilidad Horaria</span>
          </Button>

          <Button
            disabled={actionsDisabled}
            onClick={() => {
              setNotice('');
              setRemovalError('');
              setEditor({ doctor: null });
            }}
            className="flex items-center gap-1.5 bg-med-primary-700 hover:bg-med-primary-800 text-white"
          >
            <span>+</span>
            <span>Nuevo Doctor</span>
          </Button>
        </div>
      </div>

      {editor && (
        <DoctorForm
          doctor={editor.doctor}
          onCancel={() => setEditor(null)}
          onSaved={(doctor) => {
            setEditor(null);
            setNotice(
              `${editor.doctor ? 'Se actualizó a' : 'Se registró a'} ${doctor.name} (matrícula ${doctor.licenseNumber}).`
            );
            setSearchTerm(doctor.name);
            setSpecialtyId('');
            setFilterError('');
            setQuery({ name: doctor.name, specialtyId: '', pageIndex: 0 });
          }}
        />
      )}
      {removalError && (
        <p role="alert" className="text-sm text-red-600">
          {removalError}
        </p>
      )}
      {removingId && (
        <p role="status" className="text-sm text-med-text-sub">
          Procesando la baja…
        </p>
      )}
      {notice && (
        <p role="status" className="text-sm text-med-primary-900">
          {notice}
        </p>
      )}

      <form
        role="search"
        onSubmit={search}
        className="flex flex-wrap items-end gap-3"
      >
        <div>
          <label
            htmlFor="doctor-search"
            className="block text-sm font-semibold"
          >
            Nombre del médico
          </label>
          <input
            id="doctor-search"
            type="search"
            value={searchTerm}
            onChange={(event) => {
              setSearchTerm(event.target.value);
              setFilterError('');
            }}
            aria-invalid={Boolean(filterError)}
            aria-describedby={filterError ? 'doctor-filter-error' : undefined}
            className="rounded-lg border border-med-border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label
            htmlFor="doctor-specialty"
            className="block text-sm font-semibold"
          >
            Especialidad
          </label>
          <SpecialtySelect
            id="doctor-specialty"
            value={specialtyId}
            onChange={(event) => setSpecialtyId(event.target.value)}
            emptyLabel="Todas las especialidades"
          />
        </div>
        <Button type="submit" variant="secondary">
          Buscar
        </Button>
        {(searchTerm || specialtyId || query.name || query.specialtyId) && (
          <Button variant="ghost" onClick={clearSearch}>
            Limpiar
          </Button>
        )}
        {filterError && (
          <p
            id="doctor-filter-error"
            role="alert"
            className="w-full text-sm text-red-600"
          >
            {filterError}
          </p>
        )}
      </form>

      {/* Tabla Principal */}
      <Card className="p-0 overflow-hidden border-med-border">
        <div className="p-5 border-b border-med-border">
          <h2 className="text-base font-bold text-med-primary-900">
            Registros de Doctores
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-med-primary-50/70 text-[11px] uppercase tracking-wider text-med-text-sub border-b border-med-border">
              <tr>
                <th className="px-6 py-3.5">Nombre del Doctor</th>
                <th className="px-6 py-3.5">Especialidad</th>
                <th className="px-6 py-3.5 text-center">Matrícula</th>
                <th className="px-6 py-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-med-border-subtle">
              {(loading || error || page?.data.length === 0) && (
                <tr>
                  <td colSpan={4} className="px-6 py-5 text-med-text-sub">
                    {loading && <span role="status">Cargando médicos…</span>}
                    {error && (
                      <div role="alert" className="flex items-center gap-3">
                        {error}
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
                        {query.name || query.specialtyId
                          ? 'Ningún médico coincide con los filtros.'
                          : 'Todavía no hay médicos registrados.'}
                      </span>
                    )}
                  </td>
                </tr>
              )}
              {page?.data.map((doc) => (
                <tr
                  key={doc.id}
                  className="hover:bg-gray-50/70 transition-colors"
                >
                  <td className="px-6 py-4 font-semibold text-med-primary-900">
                    {doc.name}
                  </td>
                  <td className="px-6 py-4">
                    {doc.specialty?.name || 'Sin especialidad'}
                  </td>
                  <td className="px-6 py-4 text-center">{doc.licenseNumber}</td>

                  {/* Botones de Acciones (Ojo, Lápiz, Basurero) */}
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 text-med-primary-600">
                      <button
                        title="Ver detalle"
                        className="p-1.5 rounded-lg hover:bg-med-primary-50 text-med-primary-600 hover:text-med-primary-900 transition"
                        onClick={() => alert(`Ver detalle de ${doc.name}`)}
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
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      </button>

                      <button
                        title="Editar profesional"
                        className="p-1.5 rounded-lg hover:bg-med-primary-50 text-med-primary-600 hover:text-med-primary-900 transition"
                        aria-label={`Editar a ${doc.name}`}
                        disabled={actionsDisabled}
                        onClick={() => {
                          setNotice('');
                          setRemovalError('');
                          setEditor({ doctor: doc });
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
                        title="Dar de baja al médico"
                        aria-label={`Dar de baja a ${doc.name} (matrícula ${doc.licenseNumber})`}
                        disabled={actionsDisabled}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-med-danger-text transition"
                        onClick={() => removeDoctor(doc)}
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
          <TablePagination
            currentPage={page.pageIndex + 1}
            totalPages={Math.max(1, Math.ceil(page.total / page.pageSize))}
            totalItems={page.total}
            pageSize={page.pageSize}
            onPageChange={(next) => setQuery({ ...query, pageIndex: next - 1 })}
          />
        )}
      </Card>
    </div>
  );
}

export default DoctorsPage;
