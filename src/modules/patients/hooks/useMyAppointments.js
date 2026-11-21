import { useEffect, useState } from 'react';
import { getApiError } from '../../shared/api/apiError';
import { getMyAppointments } from '../services/patientApi';

// Trae los turnos del paciente (por DNI) y expone el estado de la carga.
function useMyAppointments(dni) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;

    getMyAppointments(dni)
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
  }, [dni]);

  return { appointments, setAppointments, loading, error, setError };
}

export default useMyAppointments;
