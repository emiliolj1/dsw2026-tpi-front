import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../shared/components/Card';
import Button from '../../shared/components/Button';
import TablePagination from '../../shared/components/TablePagination';
import SpecialtySelect from '../../specialties/components/SpecialtySelect';
import DoctorForm from '../components/DoctorForm';
import { useDoctors } from '../hooks/useDoctors';

function DoctorsPage() {
  const navigate = useNavigate();
  const [editor, setEditor] = useState(null);
  const [notice, setNotice] = useState('');
  const {
    draft,
    hasAppliedFilters,
    filterError,
    loading,
    page,
    error,
    removingId,
    removalError,
    changeName,
    changeSpecialty,
    search,
    clearSearch,
    showDoctor,
    changePage,
    reload,
    removeDoctor,
    clearRemovalError,
  } = useDoctors();
  const actionsDisabled = Boolean(editor) || removingId !== null;

  async function confirmRemoval({ id, name, licenseNumber }) {
    if (
      actionsDisabled ||
      !window.confirm(`¿Dar de baja a ${name} (matrícula ${licenseNumber})?`)
    ) {
      return;
    }

    setNotice('');

    if (await removeDoctor(id)) {
      setNotice(`Se dio de baja a ${name} (matrícula ${licenseNumber}).`);
    }
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
              clearRemovalError();
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
            showDoctor(doctor.name);
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
        onSubmit={(event) => {
          event.preventDefault();
          search();
        }}
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
            value={draft.name}
            onChange={(event) => changeName(event.target.value)}
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
            value={draft.specialtyId}
            onChange={(event) => changeSpecialty(event.target.value)}
            emptyLabel="Todas las especialidades"
          />
        </div>
        <Button type="submit" variant="secondary">
          Buscar
        </Button>
        {(draft.name || draft.specialtyId || hasAppliedFilters) && (
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
                        <Button variant="outline" onClick={reload}>
                          Reintentar
                        </Button>
                      </div>
                    )}
                    {page?.data.length === 0 && (
                      <span role="status">
                        {hasAppliedFilters
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
                          clearRemovalError();
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
                        onClick={() => confirmRemoval(doc)}
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
            label="Páginas de médicos"
            currentPage={page.pageIndex + 1}
            totalPages={Math.max(1, Math.ceil(page.total / page.pageSize))}
            totalItems={page.total}
            pageSize={page.pageSize}
            onPageChange={changePage}
          />
        )}
      </Card>
    </div>
  );
}

export default DoctorsPage;
