import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../shared/components/Card';
import Button from '../../shared/components/Button';
import useAuth from '../../auth/hook/useAuth';
import { getApiError } from '../../shared/api/apiError';
import { createAppointment } from '../services/patientApi';
import useBookingCatalog from '../hooks/useBookingCatalog';
import { formatLongDate, formatTime } from '../helpers/dateFormat';

const selectClass =
  'w-full px-3.5 py-2.5 text-sm bg-white border border-med-border rounded-lg text-med-text-main focus:outline-none focus:ring-2 focus:ring-med-primary-600 disabled:bg-gray-50 disabled:text-med-text-muted';

function PatientHome() {
  const navigate = useNavigate();
  const { session } = useAuth();

  // ---- Lo que el paciente elige ----
  const [specialtyId, setSpecialtyId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [reason, setReason] = useState('');

  // ---- Estados de pantalla ----
  const [sending, setSending] = useState(false);
  const [createdAppointment, setCreatedAppointment] = useState(null);

  // Sirve para volver a pedir los horarios cuando alguien nos "ganó" un turno.
  const [slotsReloadKey, setSlotsReloadKey] = useState(0);

  // ---- Lo que viene del backend (hook propio) ----
  const {
    specialties,
    doctors,
    slots,
    loadingSpecialties,
    loadingDoctors,
    loadingSlots,
    error,
    setError,
    setDoctors,
    setSlots,
  } = useBookingCatalog({ specialtyId, doctorId, slotsReloadKey });

  function handleSpecialtyChange(event) {
    setSpecialtyId(event.target.value);
    // Al cambiar de especialidad se borra todo lo que dependía de ella.
    setDoctorId('');
    setDoctors([]);
    setSlots([]);
    setSelectedSlot(null);
    setError('');
  }

  function handleDoctorChange(event) {
    setDoctorId(event.target.value);
    setSlots([]);
    setSelectedSlot(null);
    setError('');
  }

  // Ordenamos los horarios por fecha y hora, y los agrupamos por día.
  const sortedSlots = [...slots].sort((a, b) =>
    `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`)
  );
  const slotsByDate = {};

  for (const slot of sortedSlots) {
    if (!slotsByDate[slot.date]) slotsByDate[slot.date] = [];

    slotsByDate[slot.date].push(slot);
  }

  // El primer horario libre se marca como "Próximo", pero NO se elige solo.
  const nextSlotId = sortedSlots[0]?.availabilitySlotId;

  const currentDoctor = doctors.find((d) => d.id === doctorId);
  const reasonIsValid = reason.trim().length >= 5;
  const canConfirm = Boolean(selectedSlot) && reasonIsValid && !sending;

  async function handleConfirm() {
    setSending(true);
    setError('');

    try {
      const appointment = await createAppointment({
        doctorId,
        availabilitySlotId: selectedSlot.availabilitySlotId,
        dni: session.dni,
        reason,
      });

      setCreatedAppointment(appointment);
      setSelectedSlot(null);
      setReason('');
      setSlotsReloadKey((key) => key + 1);
    } catch (e) {
      const apiError = getApiError(e);

      setError(apiError.message);

      // 404 o 409: el horario ya no está. Lo sacamos, recargamos la lista
      // y dejamos el motivo escrito para no hacerle perder lo que tipeó.
      if (apiError.status === 404 || apiError.status === 409) {
        setSelectedSlot(null);
        setSlotsReloadKey((key) => key + 1);
      }
    } finally {
      setSending(false);
    }
  }

  function handleNewReservation() {
    setCreatedAppointment(null);
    setError('');
  }

  // ---- Pantalla de turno confirmado ----
  if (createdAppointment) {
    return (
      <div className="max-w-xl mx-auto">
        <Card className="p-6 sm:p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
            ✓
          </div>
          <h1 className="text-xl font-bold text-med-primary-900">
            ¡Turno reservado!
          </h1>
          <div className="mt-5 p-4 bg-med-primary-50 border border-med-primary-200/60 rounded-xl text-sm text-med-primary-900 text-left space-y-1">
            <p>
              <strong>Médico:</strong> {createdAppointment.doctor.name}
            </p>
            <p>
              <strong>Especialidad:</strong>{' '}
              {createdAppointment.doctor.specialty?.name}
            </p>
            <p>
              <strong>Fecha:</strong> {formatLongDate(createdAppointment.date)},{' '}
              {formatTime(createdAppointment.startTime)} hs
            </p>
            <p>
              <strong>Motivo:</strong> {createdAppointment.reason}
            </p>
          </div>
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Button
              className="w-full text-sm"
              onClick={() => navigate('/appointments')}
            >
              Ver mis turnos
            </Button>
            <Button
              variant="secondary"
              className="w-full text-sm"
              onClick={handleNewReservation}
            >
              Reservar otro
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // ---- Pantalla de reserva ----
  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto">
      <Card className="p-6 sm:p-7">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-med-primary-900">
          Reservar turno médico
        </h1>
        <p className="text-xs sm:text-sm text-med-text-sub mt-1">
          Elegí la especialidad, el profesional y un horario disponible.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="specialty"
              className="text-xs font-semibold text-med-text-sub"
            >
              Especialidad
            </label>
            <select
              id="specialty"
              value={specialtyId}
              onChange={handleSpecialtyChange}
              disabled={loadingSpecialties || specialties.length === 0}
              className={selectClass}
            >
              <option value="">
                {loadingSpecialties
                  ? 'Cargando especialidades...'
                  : 'Seleccioná una especialidad'}
              </option>
              {specialties.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="doctor"
              className="text-xs font-semibold text-med-text-sub"
            >
              Médico
            </label>
            <select
              id="doctor"
              value={doctorId}
              onChange={handleDoctorChange}
              disabled={!specialtyId || loadingDoctors || doctors.length === 0}
              className={selectClass}
            >
              <option value="">
                {loadingDoctors
                  ? 'Cargando médicos...'
                  : 'Seleccioná un médico'}
              </option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            {specialtyId && !loadingDoctors && doctors.length === 0 && (
              <p className="text-xs text-med-text-muted">
                No hay médicos para esta especialidad.
              </p>
            )}
          </div>
        </div>
      </Card>

      {error && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {doctorId && (
        <Card className="p-5 sm:p-6">
          <h2 className="text-base font-bold text-med-primary-900">
            Horarios de {currentDoctor?.name}
          </h2>

          {loadingSlots && (
            <p className="text-sm text-med-text-sub mt-4">
              Buscando horarios...
            </p>
          )}

          {!loadingSlots && sortedSlots.length === 0 && (
            <p className="text-sm text-med-text-muted mt-4">
              Este médico no tiene horarios disponibles por ahora.
            </p>
          )}

          <div className="flex flex-col gap-5 mt-4">
            {Object.entries(slotsByDate).map(([date, daySlots]) => (
              <div key={date}>
                <h3 className="text-sm font-semibold text-med-text-main mb-2">
                  {formatLongDate(date)}
                </h3>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {daySlots.map((slot) => {
                    const isSelected =
                      selectedSlot?.availabilitySlotId ===
                      slot.availabilitySlotId;
                    const isNext = slot.availabilitySlotId === nextSlotId;

                    return (
                      <button
                        key={slot.availabilitySlotId}
                        type="button"
                        onClick={() => setSelectedSlot(slot)}
                        aria-pressed={isSelected}
                        className={`relative py-2 px-2 text-xs font-semibold rounded-lg border transition-all ${
                          isSelected
                            ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                            : isNext
                              ? 'bg-med-primary-50 border-med-primary-600 text-med-primary-900'
                              : 'bg-white border-med-border text-med-primary-900 hover:border-med-primary-600'
                        }`}
                      >
                        {formatTime(slot.startTime)}
                        {isNext && !isSelected && (
                          <span className="block text-[10px] font-bold text-med-primary-700">
                            Próximo
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {selectedSlot && (
        <div className="bg-med-primary-50 border border-med-primary-200/60 rounded-2xl p-5 sm:p-6 flex flex-col gap-4">
          <div className="border-l-4 border-med-primary-900 pl-3.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-med-text-sub">
              Resumen de la reserva
            </span>
            <p className="text-base sm:text-lg font-bold text-med-primary-900 mt-0.5">
              {formatLongDate(selectedSlot.date)},{' '}
              {formatTime(selectedSlot.startTime)} hs
            </p>
            <p className="text-xs text-med-text-sub mt-0.5">
              {currentDoctor?.name} • Duración: 30 min
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="reason"
              className="text-xs font-semibold text-med-text-sub"
            >
              Motivo de la consulta
            </label>
            <textarea
              id="reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Contanos brevemente el motivo (mínimo 5 caracteres)"
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-med-border rounded-lg text-med-text-main focus:outline-none focus:ring-2 focus:ring-med-primary-600"
            />
            {reason.length > 0 && !reasonIsValid && (
              <p className="text-xs text-red-500 font-medium">
                El motivo debe tener al menos 5 caracteres.
              </p>
            )}
          </div>

          <Button
            type="button"
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="w-full sm:w-auto sm:self-end py-3 px-6 rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? 'Reservando...' : 'Confirmar turno'}
          </Button>
        </div>
      )}
    </div>
  );
}

export default PatientHome;
