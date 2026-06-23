import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useNotifications } from '../../contexts/NotificationContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import { ShoppingBagIcon } from '@heroicons/react/24/outline';

const estadoBadge = (estado) => {
  const map = {
    pagado: 'bg-green/10 text-green',
    pendiente: 'bg-yellow/10 text-yellow-700',
    expirado: 'bg-gray-200 text-gray-600',
    fallido: 'bg-red/10 text-red',
  };
  return map[estado] || 'bg-gray-100 text-gray-700';
};

const OrdenesPublicas = () => {
  const { error: showError } = useNotifications();
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDocs(collection(db, 'ordenes'));
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => {
          const ta = a.createdAt?.toDate?.()?.getTime() || 0;
          const tb = b.createdAt?.toDate?.()?.getTime() || 0;
          return tb - ta;
        });
        setOrdenes(list.slice(0, 50));
      } catch (err) {
        console.error(err);
        showError('No se pudieron cargar las órdenes');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [showError]);

  if (loading) {
    return (
      <LoadingSpinner
        size="lg"
        variant="montessori"
        message="Cargando órdenes…"
        className="h-64"
      />
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0 space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <ShoppingBagIcon className="w-8 h-8 text-blue" />
          Órdenes del sitio público
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400 text-sm">
          Pagos de inscripción y libros procesados con Stripe
        </p>
      </div>

      {ordenes.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No hay órdenes registradas aún.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 list-none p-0">
          {ordenes.map((orden) => {
            const cliente = orden.cliente || {};
            const created = orden.createdAt?.toDate?.();
            return (
              <li
                key={orden.id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${estadoBadge(orden.estado)}`}>
                    {orden.estado}
                  </span>
                  <span className="text-xs text-gray-500">{orden.tipo}</span>
                </div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {cliente.nombre || 'Sin nombre'}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{cliente.email}</p>
                {orden.monto != null && (
                  <p className="mt-2 text-lg font-bold text-blue">
                    {orden.monto} {orden.moneda || 'MXN'}
                  </p>
                )}
                {orden.programa && (
                  <p className="text-sm text-gray-500 mt-1">Programa: {orden.programa}</p>
                )}
                <p className="text-xs text-gray-400 mt-2 font-mono">ID: {orden.id}</p>
                {created && (
                  <p className="text-xs text-gray-400">
                    {created.toLocaleString('es-MX')}
                  </p>
                )}
                {orden.stripeCheckoutSessionId && (
                  <a
                    href={`https://dashboard.stripe.com/test/payments`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-2 text-xs text-blue underline"
                  >
                    Ver en Stripe Dashboard
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default OrdenesPublicas;
