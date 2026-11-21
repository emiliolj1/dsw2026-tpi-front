import { useEffect, useState } from 'react';
import { getApiError } from '../../shared/api/apiError';
import {
  getAvailableSlots,
  getDoctors,
  getSpecialties,
} from '../services/patientApi';

// Datos que la reserva pide al backend en cascada:
// especialidades -> médicos de la especialidad -> horarios del médico.
// "ignore" descarta respuestas viejas si el paciente cambia rápido de opción.
function useBookingCatalog({ specialtyId, doctorId, slotsReloadKey }) {
  const [specialties, setSpecialties] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loadingSpecialties, setLoadingSpecialties] = useState(true);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState('');

  // 1) Al abrir la pantalla: traer las especialidades.
  useEffect(() => {
    let ignore = false;

    getSpecialties()
      .then((list) => {
        if (!ignore) setSpecialties(list);
      })
      .catch((e) => {
        if (!ignore) setError(getApiError(e).message);
      })
      .finally(() => {
        if (!ignore) setLoadingSpecialties(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  // 2) Cuando cambia la especialidad: traer SUS médicos.
  useEffect(() => {
    if (!specialtyId) return;

    let ignore = false;

    setLoadingDoctors(true);
    getDoctors(specialtyId)
      .then((list) => {
        if (!ignore) setDoctors(list);
      })
      .catch((e) => {
        if (!ignore) setError(getApiError(e).message);
      })
      .finally(() => {
        if (!ignore) setLoadingDoctors(false);
      });

    return () => {
      ignore = true;
    };
  }, [specialtyId]);

  // 3) Cuando cambia el médico (o hay que recargar): traer sus horarios.
  useEffect(() => {
    if (!doctorId) return;

    let ignore = false;

    setLoadingSlots(true);
    getAvailableSlots(doctorId)
      .then((list) => {
        if (!ignore) setSlots(list);
      })
      .catch((e) => {
        if (!ignore) setError(getApiError(e).message);
      })
      .finally(() => {
        if (!ignore) setLoadingSlots(false);
      });

    return () => {
      ignore = true;
    };
  }, [doctorId, slotsReloadKey]);

  return {
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
  };
}

export default useBookingCatalog;
