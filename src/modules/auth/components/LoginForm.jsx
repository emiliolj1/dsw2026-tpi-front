import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate } from 'react-router-dom';
import { getApiError } from '../../shared/api/apiError';
import Button from '../../shared/components/Button';
import Card from '../../shared/components/Card';
import Input from '../../shared/components/Input';
import useAuth from '../hook/useAuth';

function LoginForm({ role }) {
  const { session, signInAdmin, signInPatient, logoutWarningRole } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm();
  const isAdmin = role === 'ADMINISTRADOR';
  const home = isAdmin ? '/admin/home' : '/';

  async function onValid({ email, password, dni }) {
    setApiError(null);

    try {
      if (isAdmin) {
        await signInAdmin(email.trim(), password);
      } else {
        await signInPatient(email.trim(), Number(dni));
      }
    } catch (error) {
      const failure = getApiError(error);
      const fields = ['email', isAdmin ? 'password' : 'dni'];
      const otherDetails = [];

      for (const detail of failure.details) {
        const field = detail.field?.toLowerCase();

        if (fields.includes(field)) {
          setError(field, { type: 'server', message: detail.issue });
        } else if (detail.issue) {
          otherDetails.push(detail.issue);
        }
      }

      setApiError({
        message:
          failure.status === 401
            ? isAdmin
              ? 'El correo o la contraseña son incorrectos.'
              : 'Revisá el correo y el DNI que ingresaste.'
            : failure.message,
        details: otherDetails,
      });
    }
  }

  if (session?.role === role) {
    return <Navigate to={home} replace />;
  }

  return (
    <main className="min-h-dvh grid place-items-center bg-med-primary-950 px-4 py-8 sm:px-6">
      <div className="w-full max-w-md">
        <header className="mb-5 px-1">
          <p className="font-serif text-4xl leading-tight text-med-primary-50">
            Turno Norte
          </p>
        </header>
        <Card className="p-6 sm:p-8">
          <h1 className="text-3xl text-med-primary-900">
            {isAdmin ? 'Administración' : 'Portal de pacientes'}
          </h1>
          <p className="mt-2 mb-6 text-sm text-med-text-sub">
            {isAdmin
              ? 'Ingresá para gestionar la agenda de la clínica.'
              : 'Ingresá con tu correo y DNI para reservar o consultar tus turnos.'}
          </p>

          {logoutWarningRole === role && (
            <p
              role="status"
              className="mb-4 rounded-lg bg-med-leave-bg p-3 text-sm text-med-leave-text"
            >
              Cerraste la sesión en este navegador. El servidor no confirmó el
              cierre.
            </p>
          )}

          <form
            onSubmit={handleSubmit(onValid)}
            className="space-y-4"
            noValidate
          >
            <Input
              label="Correo electrónico"
              type="email"
              autoComplete="username"
              required
              error={errors.email?.message}
              {...register('email', {
                required: 'Ingresá tu correo electrónico.',
                validate: (value) =>
                  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ||
                  'Ingresá un correo electrónico válido.',
              })}
            />

            {isAdmin ? (
              <div>
                <Input
                  label="Contraseña"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  error={errors.password?.message}
                  {...register('password', {
                    required: 'Ingresá tu contraseña.',
                    minLength: {
                      value: 8,
                      message:
                        'La contraseña debe tener al menos 8 caracteres.',
                    },
                  })}
                />
                <button
                  type="button"
                  className="mt-2 rounded px-1 text-sm font-medium text-med-primary-700 hover:underline"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                </button>
              </div>
            ) : (
              <Input
                label="DNI"
                type="text"
                inputMode="numeric"
                required
                error={errors.dni?.message}
                {...register('dni', {
                  required: 'Ingresá tu DNI.',
                  pattern: {
                    value: /^[1-9][0-9]{6,7}$/,
                    message: 'Ingresá 7 u 8 dígitos, sin puntos ni espacios.',
                  },
                })}
              />
            )}

            {apiError && (
              <div
                role="alert"
                className="rounded-lg bg-med-danger-bg p-3 text-sm text-med-danger-text"
              >
                <p>{apiError.message}</p>
                {apiError.details.length > 0 && (
                  <ul className="mt-1 list-disc pl-4">
                    {apiError.details.map((detail) => (
                      <li key={detail}>{detail}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3"
            >
              {isSubmitting ? 'Ingresando…' : 'Ingresar'}
            </Button>
          </form>
        </Card>

        <Link
          to={isAdmin ? '/login' : '/admin/login'}
          className="mt-5 inline-block rounded px-1 py-1.5 text-sm font-medium text-med-primary-200 hover:underline"
        >
          {isAdmin ? 'Ir al portal de pacientes' : 'Acceso de administración'}
        </Link>
      </div>
    </main>
  );
}

export default LoginForm;
