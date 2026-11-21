import { useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import Button from '../../shared/components/Button';
import Card from '../../shared/components/Card';
import SpecialtySelect from '../../specialties/components/SpecialtySelect';
import { createDoctor } from '../services/createDoctor';
import { updateDoctor } from '../services/updateDoctor';

function normalizeText(value) {
  return value.trim();
}

function DoctorForm({ doctor, onSaved, onCancel }) {
  const pending = useRef(false);
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      name: doctor?.name ?? '',
      licenseNumber: doctor?.licenseNumber ?? '',
      specialtyId: doctor?.specialty?.id ?? '',
    },
  });

  async function save(values) {
    if (pending.current) return;

    pending.current = true;

    try {
      const saved = doctor
        ? await updateDoctor(doctor.id, values)
        : await createDoctor(values);

      onSaved(saved);
    } catch (err) {
      const message = err.response?.data?.message;

      setError('root.server', {
        message:
          typeof message === 'string' && message
            ? message
            : 'No se pudo confirmar la operación. Revisá el listado antes de volver a intentar.',
      });
    } finally {
      pending.current = false;
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
      <form
        onSubmit={handleSubmit(save)}
        noValidate
        aria-labelledby="doctor-form-title"
      >
        <fieldset disabled={isSubmitting} className="space-y-4">
          <div>
            <label
              htmlFor="doctor-name"
              className="block text-sm font-semibold"
            >
              Nombre y apellido
            </label>
            <input
              id="doctor-name"
              autoFocus
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? 'doctor-name-error' : undefined}
              className="mt-1 w-full rounded-lg border border-med-border px-3 py-2"
              {...register('name', {
                setValueAs: normalizeText,
                required: 'Ingresá un nombre de entre 3 y 100 caracteres.',
                minLength: {
                  value: 3,
                  message: 'Ingresá un nombre de entre 3 y 100 caracteres.',
                },
                maxLength: {
                  value: 100,
                  message: 'Ingresá un nombre de entre 3 y 100 caracteres.',
                },
              })}
            />
            {errors.name && (
              <p
                id="doctor-name-error"
                role="alert"
                className="mt-1 text-sm text-red-600"
              >
                {errors.name.message}
              </p>
            )}
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
              aria-invalid={Boolean(errors.licenseNumber)}
              aria-describedby={
                errors.licenseNumber ? 'doctor-license-error' : undefined
              }
              className="mt-1 w-full rounded-lg border border-med-border px-3 py-2"
              {...register('licenseNumber', {
                setValueAs: normalizeText,
                required: 'Ingresá la matrícula.',
              })}
            />
            {errors.licenseNumber && (
              <p
                id="doctor-license-error"
                role="alert"
                className="mt-1 text-sm text-red-600"
              >
                {errors.licenseNumber.message}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="new-doctor-specialty"
              className="block text-sm font-semibold"
            >
              Especialidad del médico
            </label>
            <Controller
              name="specialtyId"
              control={control}
              rules={{
                required:
                  'Seleccioná una especialidad activa. Si el catálogo está vacío, creá una en Especialidades.',
              }}
              render={({ field }) => (
                <SpecialtySelect
                  id="new-doctor-specialty"
                  value={field.value}
                  onChange={(event) => field.onChange(event.target.value)}
                  emptyLabel="Seleccioná una especialidad"
                />
              )}
            />
            {errors.specialtyId && (
              <p role="alert" className="mt-1 text-sm text-red-600">
                {errors.specialtyId.message}
              </p>
            )}
          </div>
          {errors.root?.server && (
            <p role="alert" className="text-sm text-red-600">
              {errors.root.server.message}
            </p>
          )}
          <div className="flex gap-2">
            <Button type="submit">
              {isSubmitting
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
