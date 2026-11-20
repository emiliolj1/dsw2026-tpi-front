import { useEffect, useRef, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import Card from '../../shared/components/Card';
import Button from '../../shared/components/Button';
import {
  getAllDoctors,
  getMonthlyRules,
  saveMonthlyRules,
} from '../services/availabilityApi';
import {
  DAYS,
  toFormDays,
  toRequestDays,
  validateDays,
} from '../utils/availabilityValidation';

const INITIAL_FORM = { days: [] };
const NEW_RANGE = { day: 'LUNES', startTime: '09:00', endTime: '12:00' };

function apiErrorMessage(error) {
  if (error?.response?.status === 401) {
    return 'La sesión venció. Volvé a iniciar sesión como administrador.';
  }

  if (error?.response?.status === 403) {
    return 'Necesitás una cuenta administrativa para gestionar horarios.';
  }

  if (error?.response?.status === 429) {
    return 'Se alcanzó el límite de consultas. Probá más tarde.';
  }

  const data = error?.response?.data;
  const details = Array.isArray(data?.details)
    ? data.details.map((item) => item.issue).filter(Boolean)
    : [];

  if (data?.message) {
    return [data.message, ...details].join(' ');
  }

  return error?.message || 'No se pudo conectar con la API.';
}

const CLINIC_MONTH = new Intl.DateTimeFormat('es-AR', {
  month: 'long',
  year: 'numeric',
  timeZone: 'America/Argentina/Buenos_Aires',
}).format(new Date());

function AvailabilityPage() {
  const [doctors, setDoctors] = useState([]);
  const [doctorId, setDoctorId] = useState('');
  const [doctorStatus, setDoctorStatus] = useState('loading');
  const [doctorError, setDoctorError] = useState('');
  const [loadingRules, setLoadingRules] = useState(false);
  const [hasLoadedRules, setHasLoadedRules] = useState(false);
  const [hasExistingPlan, setHasExistingPlan] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const latestRequest = useRef(0);
  const savedRules = useRef([]);
  const form = useForm({ defaultValues: INITIAL_FORM, mode: 'onSubmit' });
  const { control, handleSubmit, register, reset, clearErrors, setError } =
    form;
  const { fields, append, remove } = useFieldArray({ control, name: 'days' });

  // Cargar la lista de médicos reales al montar la pantalla.
  useEffect(() => {
    const controller = new AbortController();

    getAllDoctors(controller.signal)
      .then((items) => {
        if (controller.signal.aborted) {
          return;
        }

        setDoctors(items);
        setLoadingRules(items.length > 0);
        setDoctorId((previous) => previous || items[0]?.id || '');
        setDoctorStatus('ready');
      })
      .catch((error) => {
        if (controller.signal.aborted) {
          return;
        }

        setDoctorStatus('error');
        setDoctorError(apiErrorMessage(error));
      });

    return () => controller.abort();
  }, []);

  // Invalidar y cancelar solicitudes anteriores al cambiar de médico.
  useEffect(() => {
    if (!doctorId) {
      return undefined;
    }

    const controller = new AbortController();
    const request = ++latestRequest.current;

    getMonthlyRules(doctorId, controller.signal)
      .then((rules) => {
        if (controller.signal.aborted || request !== latestRequest.current) {
          return;
        }

        const normalized = toFormDays(rules);

        savedRules.current = normalized;
        reset({ days: normalized });
        setHasExistingPlan(rules.length > 0);
        setHasLoadedRules(true);
        setLoadingRules(false);
        setErrorMessage('');
      })
      .catch((error) => {
        if (controller.signal.aborted || request !== latestRequest.current) {
          return;
        }

        setErrorMessage(apiErrorMessage(error));
        setHasLoadedRules(false);
        setLoadingRules(false);
      });

    return () => controller.abort();
  }, [doctorId, reset]);

  const handleDoctorChange = (event) => {
    setDoctorId(event.target.value);
    setLoadingRules(true);
    setHasLoadedRules(false);
    setHasExistingPlan(false);
    setSuccessMessage('');
    setErrorMessage('');
    savedRules.current = [];
    reset(INITIAL_FORM);
  };

  const handleCancel = () => {
    reset({ days: savedRules.current });
    clearErrors();
    setErrorMessage('');
    setSuccessMessage('');
  };

  const onSubmit = async (data) => {
    setErrorMessage('');
    setSuccessMessage('');
    clearErrors();

    const problems = validateDays(data.days);

    if (problems.length > 0) {
      problems.forEach(({ index, field, message }) => {
        setError(`days.${index}.${field}`, { type: 'validate', message });
      });
      setErrorMessage('Corregí los horarios marcados antes de guardar.');

      return;
    }

    if (data.days.length === 0 && !hasExistingPlan) {
      setSuccessMessage('Este médico ya no tiene franjas configuradas.');

      return;
    }

    if (
      data.days.length === 0 &&
      !window.confirm(
        '¿Retirar todos los horarios libres futuros de este médico? Las citas reservadas se conservan.'
      )
    ) {
      return;
    }

    setSaving(true);
    const editingDoctor = doctorId;
    const request = latestRequest.current;

    try {
      await saveMonthlyRules(
        { doctorId: editingDoctor, days: toRequestDays(data.days) },
        hasExistingPlan || data.days.length === 0
      );

      const refreshed = await getMonthlyRules(editingDoctor);

      if (request !== latestRequest.current) {
        return;
      }

      const normalized = toFormDays(refreshed);

      savedRules.current = normalized;
      reset({ days: normalized });
      setHasExistingPlan(true);
      setSuccessMessage('Disponibilidad guardada y recargada desde la API.');
    } catch (error) {
      if (request === latestRequest.current) {
        // No se reinicia el formulario para preservar lo ingresado.
        setErrorMessage(apiErrorMessage(error));
      }
    } finally {
      setSaving(false);
    }
  };

  const selectedDoctor = doctors.find((doctor) => doctor.id === doctorId);
  const canEdit = Boolean(
    doctorId && hasLoadedRules && !loadingRules && !saving
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-med-text-main">
            Disponibilidad mensual
          </h1>
          <p className="mt-1 text-sm text-med-text-sub">
            Configurá los días y franjas horarias de atención por profesional.
          </p>
        </div>
        <span className="rounded-full bg-med-primary-100 px-4 py-2 text-xs font-semibold capitalize text-med-primary-900">
          {CLINIC_MONTH}
        </span>
      </div>

      <Card className="space-y-4">
        <div className="flex flex-col gap-2">
          <label
            htmlFor="availability-doctor"
            className="font-semibold text-med-text-main"
          >
            Profesional
          </label>
          <select
            id="availability-doctor"
            value={doctorId}
            onChange={handleDoctorChange}
            disabled={doctorStatus !== 'ready' || saving}
            className="w-full max-w-xl"
          >
            <option value="">Seleccionar profesional...</option>
            {doctors.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                {doctor.name} · {doctor.specialty?.name || 'Sin especialidad'}
              </option>
            ))}
          </select>
          {doctorStatus === 'loading' && (
            <p role="status" className="text-sm text-med-text-sub">
              Cargando profesionales...
            </p>
          )}
          {doctorStatus === 'error' && (
            <p role="alert" className="text-sm text-med-danger-text">
              {doctorError}
            </p>
          )}
          {doctorStatus === 'ready' && doctors.length === 0 && (
            <p className="text-sm text-med-text-sub">
              No hay profesionales activos. Creá uno desde la API o el módulo de
              médicos.
            </p>
          )}
          {selectedDoctor && (
            <p className="text-xs text-med-text-muted">
              Matrícula:{' '}
              {selectedDoctor.licenseNumber || 'Sin matrícula informada'}
            </p>
          )}
        </div>
      </Card>

      {doctorId && (
        <Card className="space-y-5">
          <div className="flex flex-col gap-1 border-b border-med-border pb-4">
            <h2 className="text-lg font-semibold text-med-primary-900">
              Días y horarios
            </h2>
            <p className="text-sm text-med-text-sub">
              Se administra el mes vigente de la clínica. Cada rango debe durar
              un múltiplo de 30 minutos. Los horarios del mismo día no pueden
              superponerse.
            </p>
          </div>

          {loadingRules && <p role="status">Cargando planificación...</p>}
          {!loadingRules && hasLoadedRules && (
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col gap-4"
            >
              {fields.length === 0 && (
                <div className="rounded-lg border border-dashed border-med-border bg-med-primary-50 p-5 text-sm text-med-text-sub">
                  Este profesional todavía no tiene franjas para el mes vigente.
                  Agregá una para empezar.
                </div>
              )}

              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="grid grid-cols-1 gap-3 rounded-xl border border-med-border bg-med-bg p-4 sm:grid-cols-[minmax(0,1fr)_140px_140px_auto] sm:items-start"
                >
                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor={`day-${field.id}`}
                      className="text-xs font-semibold text-med-text-sub"
                    >
                      Día de la semana
                    </label>
                    <select
                      id={`day-${field.id}`}
                      disabled={!canEdit}
                      {...register(`days.${index}.day`)}
                    >
                      {DAYS.map((day) => (
                        <option key={day.value} value={day.value}>
                          {day.label}
                        </option>
                      ))}
                    </select>
                    {form.formState.errors.days?.[index]?.day && (
                      <p role="alert" className="text-xs text-med-danger-text">
                        {form.formState.errors.days[index].day.message}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor={`start-${field.id}`}
                      className="text-xs font-semibold text-med-text-sub"
                    >
                      Inicio
                    </label>
                    <input
                      id={`start-${field.id}`}
                      type="time"
                      step="60"
                      disabled={!canEdit}
                      {...register(`days.${index}.startTime`)}
                    />
                    {form.formState.errors.days?.[index]?.startTime && (
                      <p role="alert" className="text-xs text-med-danger-text">
                        {form.formState.errors.days[index].startTime.message}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor={`end-${field.id}`}
                      className="text-xs font-semibold text-med-text-sub"
                    >
                      Fin
                    </label>
                    <input
                      id={`end-${field.id}`}
                      type="time"
                      step="60"
                      disabled={!canEdit}
                      {...register(`days.${index}.endTime`)}
                    />
                    {form.formState.errors.days?.[index]?.endTime && (
                      <p role="alert" className="text-xs text-med-danger-text">
                        {form.formState.errors.days[index].endTime.message}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    disabled={!canEdit}
                    onClick={() => {
                      remove(index);
                      clearErrors();
                    }}
                    className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50 sm:mt-5"
                    aria-label={`Quitar franja ${index + 1}`}
                  >
                    Quitar
                  </button>
                </div>
              ))}

              <div>
                <Button
                  type="button"
                  variant="outline"
                  disabled={!canEdit}
                  onClick={() => {
                    append({ ...NEW_RANGE });
                    clearErrors();
                  }}
                >
                  + Agregar franja
                </Button>
              </div>
              {errorMessage && (
                <p
                  role="alert"
                  className="rounded-lg bg-red-50 px-4 py-3 text-sm text-med-danger-text"
                >
                  {errorMessage}
                </p>
              )}
              {successMessage && (
                <p
                  role="status"
                  className="rounded-lg bg-med-active-bg px-4 py-3 text-sm text-med-active-text"
                >
                  {successMessage}
                </p>
              )}
              <div className="flex flex-wrap justify-end gap-3 border-t border-med-border pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={!canEdit}
                >
                  Cancelar cambios
                </Button>
                <Button type="submit" disabled={!canEdit}>
                  {saving ? 'Guardando...' : 'Guardar disponibilidad'}
                </Button>
              </div>
            </form>
          )}
          {!hasLoadedRules && !loadingRules && errorMessage && (
            <p role="alert" className="text-sm text-med-danger-text">
              {errorMessage}
            </p>
          )}
        </Card>
      )}

      <p className="text-xs text-med-text-muted">
        La API conserva las reservas existentes al editar horarios. La vigencia
        definitiva (mes actual o próxima semana) debe confirmarse con el docente
        antes de modificar esta pantalla.
      </p>
    </div>
  );
}

export default AvailabilityPage;
