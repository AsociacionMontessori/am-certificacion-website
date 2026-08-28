import { useState } from 'react';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import classroomImage from '../assets/login-montessori-classroom.webp';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);
    if (result.success) {
      navigate('/');
      return;
    }

    setError(result.error || 'Error al iniciar sesión');
    setLoading(false);
  };

  return (
    <main className="login-screen min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-white">
      <section className="login-brand-panel" aria-labelledby="portal-title">
        <div className="login-brand-copy">
          <img
            src="/images/lasc.png"
            alt="Asociación Montessori de México"
            className="h-24 w-24 object-contain sm:h-28 sm:w-28"
          />
          <div>
            <h1 id="portal-title" className="text-4xl font-bold tracking-[-0.035em] text-slate-900 dark:text-white sm:text-5xl">
              Portal Alumnos
            </h1>
            <p className="mt-2 text-2xl font-bold tracking-[-0.025em] text-blue sm:text-3xl">
              Certificación Montessori
            </p>
            <p className="mt-3 text-base font-medium text-slate-600 dark:text-slate-300 sm:text-lg">
              Asociación Montessori de México A.C.
            </p>
          </div>
        </div>
        <img
          src={classroomImage}
          alt="Ambiente Montessori preparado con materiales de aprendizaje"
          className="login-classroom-image"
          fetchPriority="high"
        />
      </section>

      <section className="login-form-panel" aria-labelledby="login-title">
        <form className="login-form-surface" onSubmit={handleSubmit} noValidate={false}>
          <h2 id="login-title" className="text-3xl font-bold tracking-[-0.03em] text-slate-900 dark:text-white sm:text-4xl">
            Inicia sesión
          </h2>

          {error && (
            <div className="mt-6 rounded-2xl border border-red/20 bg-red/5 px-4 py-3 text-sm font-medium text-red" role="alert" aria-live="polite">
              {error}
            </div>
          )}

          <div className="mt-8 space-y-5">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-800 dark:text-slate-100">
                Correo electrónico
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="apple-input"
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-800 dark:text-slate-100">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="apple-input pr-14"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="apple-press absolute inset-y-1 right-1 flex w-11 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="apple-press mt-7 flex min-h-12 w-full items-center justify-center rounded-2xl bg-blue px-5 text-base font-bold text-white shadow-[0_10px_28px_rgba(0,151,178,0.2)] hover:bg-[#0087a0] disabled:cursor-wait disabled:opacity-60"
          >
            {loading ? 'Iniciando sesión…' : 'Iniciar sesión'}
          </button>
        </form>

        <p className="mt-10 text-center text-xs font-medium text-slate-500 dark:text-slate-400">
          © {new Date().getFullYear()} Asociación Montessori de México
        </p>
      </section>
    </main>
  );
};

export default Login;
