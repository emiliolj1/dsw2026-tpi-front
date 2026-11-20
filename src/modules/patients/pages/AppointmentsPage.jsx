import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../shared/components/Card';
import Button from '../../shared/components/Button';
import useAuth from '../../auth/hook/useAuth';
import { getApiError } from '../../shared/api/apiError';
import { cancelAppointment, getMyAppointments } from '../services/patientApi';
import { formatLongDate, formatTime } from '../helpers/dateFormat';

function AppointmentsPage() {
  const navigate = useNavigate();
  const { session } = useAuth();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // Turno que el paciente quiere cancelar (null = ningún cuadro de confirmación abierto).
  const [appointmentToCancel, setAppointmentToCancel] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  // Al abrir la pantalla: traer los turnos del paciente (usa su DNI de la sesión).
  useEffect(() => {
    let ignore = false;

    getMyAppointments(session.dni)
      .then((list) => {
        if (!ignore) setAppointments(list);
      })
      .catch((e) => {
        if (!ignore) setError(getApiError(e).message);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [session.dni]);

  async function handleConfirmCancel() {
    setCancelling(true);
    setError('');

    try {
      await cancelAppointment(appointmentToCancel.appointmentsId);

      // Lo sacamos de la lista sin volver a pedir todo al backend.
      setAppointments((list) =>
        list.filter(
          (a) => a.appointmentsId !== appointmentToCancel.appointmentsId
        )
      );
      setNotice('El turno fue cancelado.');
    } catch (e) {
      setError(getApiError(e).message);
    } finally {
      setCancelling(false);
      setAppointmentToCancel(null);
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-med-text-main">
            Mis turnos
          </h1>
          <p className="text-sm text-med-text-sub mt-1">
            Consultá y cancelá tus próximos turnos médicos.
          </p>
        </div>
        <Button onClick={() => navigate('/')}>+ Solicitar nuevo turno</Button>
      </div>

      {notice && (
        <div
          role="status"
          className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-700"
        >
          {notice}
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {loading && (
        <p className="text-sm text-med-text-sub">Cargando tus turnos...</p>
      )}

      {!loading && !error && appointments.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-sm text-med-text-sub">No tenés turnos próximos.</p>
          <Button className="mt-4" onClick={() => navigate('/')}>
            Reservar un turno
          </Button>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {appointments.map((appt) => (
          <Card
            key={appt.appointmentsId}
            className="flex flex-col justify-between gap-4 p-6"
          >
            <div>
              <div className="flex items-center justify-between mb-3 gap-2">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-med-primary-100 text-med-primary-700">
                  {appt.doctor.specialty?.name}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-med-active-bg text-med-active-text">
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  {/* El backend llama BOOKED a un turno reservado */}
                  {appt.appointmentsStatus === 'BOOKED'
                    ? 'Confirmado'
                    : appt.appointmentsStatus}
                </span>
              </div>
              <h3 className="text-lg font-bold text-med-primary-900">
                {appt.doctor.name}
              </h3>
              <p className="text-sm text-med-text-sub mt-2">
                {formatLongDate(appt.date)} a las{' '}
                <strong className="text-med-text-main font-semibold">
                  {formatTime(appt.startTime)} hs
                </strong>
              </p>
              <p className="text-xs text-med-text-muted mt-2">
                Motivo: {appt.reason}
              </p>
            </div>
            <div className="pt-3 border-t border-med-border">
              <Button
                variant="outline"
                className="w-full text-xs"
                onClick={() => setAppointmentToCancel(appt)}
              >
                Cancelar turno
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Cuadro de confirmación antes de cancelar */}
      {appointmentToCancel && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center">
            <h2 className="text-lg font-bold text-med-primary-900">
              ¿Cancelar este turno?
            </h2>
            <p className="text-sm text-med-text-sub mt-2">
              {appointmentToCancel.doctor.name} —{' '}
              {formatLongDate(appointmentToCancel.date)},{' '}
              {formatTime(appointmentToCancel.startTime)} hs
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Button
                variant="secondary"
                className="w-full text-sm"
                onClick={() => setAppointmentToCancel(null)}
                disabled={cancelling}
              >
                Volver
              </Button>
              <Button
                variant="danger"
                className="w-full text-sm disabled:opacity-50"
                onClick={handleConfirmCancel}
                disabled={cancelling}
              >
                {cancelling ? 'Cancelando...' : 'Sí, cancelar turno'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AppointmentsPage;
