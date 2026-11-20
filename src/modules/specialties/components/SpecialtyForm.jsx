import { useRef } from 'react';
import { useForm } from 'react-hook-form';
import Card from '../../shared/components/Card';
import Button from '../../shared/components/Button';
import { createSpecialty } from '../services/createSpecialty';
import { updateSpecialty } from '../services/updateSpecialty';

function normalizeText(value) {
  return value.trim().replace(/\s+/g, ' ');
}

function SpecialtyForm({ specialty, onSaved, onCancel }) {
  const pending = useRef(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      name: specialty?.name ?? '',
      description: specialty?.description ?? '',
    },
  });

  async function save(values) {
    if (pending.current) {
      return;
    }

    pending.current = true;

    try {
      const saved = specialty
        ? await updateSpecialty(specialty.id, values)
        : await createSpecialty(values);

      onSaved(saved);
    } catch (error) {
      const message = error.response?.data?.message;

      setError('root.server', {
        message:
          typeof message === 'string' && message
            ? message
            : 'No se pudo confirmar el guardado. Revisá el listado antes de volver a intentar.',
      });
    } finally {
      pending.current = false;
    }
  }

  return (
    <Card>
      <h2
        id="new-specialty-title"
        className="mb-4 text-lg font-bold text-med-primary-900"
      >
        {specialty ? 'Editar especialidad' : 'Nueva especialidad'}
      </h2>
      <form
        aria-labelledby="new-specialty-title"
        noValidate
        onSubmit={handleSubmit(save)}
        className="space-y-4"
      >
        <div>
          <label
            htmlFor="new-specialty-name"
            className="block text-sm font-semibold"
          >
            Nombre
          </label>
          <input
            id="new-specialty-name"
            autoFocus
            readOnly={isSubmitting}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'new-name-error' : undefined}
            className="mt-1 w-full border border-med-border rounded-lg px-3 py-2"
            {...register('name', {
              setValueAs: normalizeText,
              required: 'Ingresá el nombre.',
              minLength: {
                value: 3,
                message: 'El nombre debe tener al menos 3 caracteres.',
              },
              maxLength: {
                value: 100,
                message: 'El nombre admite hasta 100 caracteres.',
              },
            })}
          />
          {errors.name && (
            <p
              id="new-name-error"
              role="alert"
              className="mt-1 text-sm text-red-600"
            >
              {errors.name.message}
            </p>
          )}
        </div>
        <div>
          <label
            htmlFor="new-specialty-description"
            className="block text-sm font-semibold"
          >
            Descripción
          </label>
          <textarea
            id="new-specialty-description"
            rows={2}
            readOnly={isSubmitting}
            aria-invalid={Boolean(errors.description)}
            aria-describedby={
              errors.description ? 'new-description-error' : undefined
            }
            className="mt-1 w-full border border-med-border rounded-lg px-3 py-2"
            {...register('description', {
              setValueAs: normalizeText,
              required: 'Ingresá la descripción.',
              minLength: {
                value: 10,
                message: 'La descripción debe tener al menos 10 caracteres.',
              },
              maxLength: {
                value: 100,
                message: 'La descripción admite hasta 100 caracteres.',
              },
            })}
          />
          {errors.description && (
            <p
              id="new-description-error"
              role="alert"
              className="mt-1 text-sm text-red-600"
            >
              {errors.description.message}
            </p>
          )}
        </div>
        {errors.root?.server && (
          <p role="alert" className="text-sm text-red-600">
            {errors.root.server.message}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? 'Guardando…'
              : specialty
                ? 'Guardar cambios'
                : 'Guardar especialidad'}
          </Button>
          <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  );
}

export default SpecialtyForm;
