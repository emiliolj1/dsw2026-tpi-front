import { useRef, useState } from 'react';
import Button from '../../shared/components/Button';
import Card from '../../shared/components/Card';
import SpecialtySelect from '../../specialties/components/SpecialtySelect';
import { createDoctor } from '../services/createDoctor';
import { updateDoctor } from '../services/updateDoctor';

function DoctorForm({ doctor, onSaved, onCancel }) {
  const [specialtyId, setSpecialtyId] = useState(doctor?.specialty?.id ?? '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const pending = useRef(false);

  async function save(event) {
    event.preventDefault();

    if (pending.current) return;

    const form = event.currentTarget;
    const name = form.elements.name.value.trim();
    const licenseNumber = form.elements.licenseNumber.value.trim();

    if (name.length < 3 || name.length > 100) {
      setError('Ingresá un nombre de entre 3 y 100 caracteres.');
      form.elements.name.focus();

      return;
    }

    if (!licenseNumber) {
      setError('Ingresá la matrícula.');
      form.elements.licenseNumber.focus();

      return;
    }

    if (!specialtyId) {
      setError(
        'Seleccioná una especialidad activa. Si el catálogo está vacío, creá una en Especialidades.'
      );

      return;
    }

    pending.current = true;
    setSaving(true);
    setError('');
    try {
      const values = { name, licenseNumber, specialtyId };
      const saved = doctor
        ? await updateDoctor(doctor.id, values)
        : await createDoctor(values);

      onSaved(saved);
    } catch (err) {
      const message = err.response?.data?.message;

      setError(
        typeof message === 'string' && message
          ? message
          : 'No se pudo confirmar la operación. Revisá el listado antes de volver a intentar.'
      );
    } finally {
      pending.current = false;
      setSaving(false);
    }
  }

  return (
    <Card>
      <h2
        id="doctor-form-title"
        className="mb-4 text-lg font-bold text-med-primary-900"
      >
        {doctor ? 'Editar médico' : 'Nuevo médico'}
      </h2>
      <form onSubmit={save} noValidate aria-labelledby="doctor-form-title">
        <fieldset disabled={saving} className="space-y-4">
          <div>
            <label
              htmlFor="doctor-name"
              className="block text-sm font-semibold"
            >
              Nombre y apellido
            </label>
            <input
              id="doctor-name"
              name="name"
              defaultValue={doctor?.name ?? ''}
              autoFocus
              required
              className="mt-1 w-full rounded-lg border border-med-border px-3 py-2"
            />
          </div>
          <div>
            <label
              htmlFor="doctor-license"
              className="block text-sm font-semibold"
            >
              Matrícula
            </label>
            <input
              id="doctor-license"
              name="licenseNumber"
              defaultValue={doctor?.licenseNumber ?? ''}
              required
              className="mt-1 w-full rounded-lg border border-med-border px-3 py-2"
            />
          </div>
          <div>
            <label
              htmlFor="new-doctor-specialty"
              className="block text-sm font-semibold"
            >
              Especialidad del médico
            </label>
            <SpecialtySelect
              id="new-doctor-specialty"
              value={specialtyId}
              onChange={(event) => setSpecialtyId(event.target.value)}
              emptyLabel="Seleccioná una especialidad"
            />
          </div>
          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <Button type="submit">
              {saving
                ? 'Guardando…'
                : doctor
                  ? 'Guardar cambios'
                  : 'Guardar médico'}
            </Button>
            <Button variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          </div>
        </fieldset>
      </form>
    </Card>
  );
}

export default DoctorForm;
