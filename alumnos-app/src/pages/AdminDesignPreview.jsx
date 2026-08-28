import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AcademicCapIcon,
  ChevronRightIcon,
  DocumentTextIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  Squares2X2Icon,
  TableCellsIcon,
  UserGroupIcon,
  UserPlusIcon,
} from '@heroicons/react/24/outline';
import AdminLayout from '../components/AdminLayout';

const PREVIEW_ADMIN = {
  id: 'preview-admin',
  nombre: 'Ana Martínez',
  email: 'admin@certificacionmontessori.com',
  rol: 'admin',
};

const STUDENTS = [
  { id: 1, nombre: 'María Fernanda López Ruiz', matricula: 'CM-2024-0012', email: 'maria.lopez@example.com', nivel: 'Asistente Montessori 0 a 3 años', estado: 'Activo' },
  { id: 2, nombre: 'Jorge Andrés Ramírez Solís', matricula: 'CM-2024-0024', email: 'jorge.ramirez@example.com', nivel: 'Guía Montessori 3 a 6 años', estado: 'Activo' },
  { id: 3, nombre: 'Lucía Natalia Pérez Gómez', matricula: 'CM-2023-0187', email: 'lucia.perez@example.com', nivel: 'Guía Montessori 6 a 12 años', estado: 'Graduado' },
  { id: 4, nombre: 'Diego Alejandro Torres Meza', matricula: 'CM-2023-0156', email: 'diego.torres@example.com', nivel: 'Asistente Montessori 0 a 3 años', estado: 'Graduado' },
  { id: 5, nombre: 'Paulina Sofía García Núñez', matricula: 'CM-2024-0048', email: 'paulina.garcia@example.com', nivel: 'Guía Montessori 3 a 6 años', estado: 'Inactivo' },
  { id: 6, nombre: 'Héctor Manuel Vargas León', matricula: 'CM-2022-0093', email: 'hector.vargas@example.com', nivel: 'Guía Montessori 6 a 12 años', estado: 'Inactivo' },
];

const getStatusClass = (status) => {
  if (status === 'Activo') return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300';
  if (status === 'Graduado') return 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300';
  return 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300';
};

const AdminDesignPreview = () => {
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('table');
  const [statusFilter, setStatusFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [sortMode, setSortMode] = useState('recientes');
  const students = useMemo(() => {
    const term = search.trim().toLowerCase();
    const filtered = STUDENTS.filter((student) => {
      const matchesSearch = !term || Object.values(student).some((value) => String(value).toLowerCase().includes(term));
      const matchesStatus = !statusFilter || student.estado === statusFilter;
      const matchesLevel = !levelFilter || student.nivel.includes(levelFilter);
      return matchesSearch && matchesStatus && matchesLevel;
    });

    return [...filtered].sort((a, b) => {
      if (sortMode === 'nombre') return a.nombre.localeCompare(b.nombre, 'es');
      if (sortMode === 'nivel') return a.nivel.localeCompare(b.nivel, 'es');
      return b.id - a.id;
    });
  }, [levelFilter, search, sortMode, statusFilter]);

  const stats = [
    { label: 'Total alumnos', value: 128, icon: UserGroupIcon, iconClass: 'bg-blue/10 text-blue', valueClass: 'text-slate-900 dark:text-white' },
    { label: 'Activos', value: 104, icon: AcademicCapIcon, iconClass: 'bg-emerald-50 text-emerald-600', valueClass: 'text-emerald-600' },
    { label: 'Graduados', value: 18, icon: DocumentTextIcon, iconClass: 'bg-amber-50 text-amber-600', valueClass: 'text-amber-600' },
    { label: 'Inactivos', value: 6, icon: UserGroupIcon, iconClass: 'bg-red-50 text-red-600', valueClass: 'text-red-600' },
  ];

  return (
    <AdminLayout previewUserData={PREVIEW_ADMIN} previewCanEdit>
      <div className="admin-page space-y-7">
        <header className="admin-page-header flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1>Panel de Administración</h1>
            <p className="mt-2">Gestión de alumnos y certificaciones</p>
          </div>
          <Link to="/admin-form-preview" className="apple-press inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-2xl bg-blue px-5 text-sm font-bold text-white shadow-[0_10px_28px_rgba(0,151,178,0.2)]">
            <UserPlusIcon className="h-5 w-5" aria-hidden="true" />
            Crear usuario
          </Link>
        </header>

        <section className="admin-metrics-rail grid grid-cols-2 lg:grid-cols-4" aria-label="Resumen de alumnos">
          {stats.map((stat) => (
            <div key={stat.label} className="admin-metric">
              <div className="flex items-center gap-3">
                <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${stat.iconClass}`}>
                  <stat.icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{stat.label}</p>
                  <p className={`mt-0.5 text-2xl font-bold tracking-[-0.03em] ${stat.valueClass}`}>{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </section>

        <section className="admin-toolbar space-y-4" aria-label="Búsqueda y filtros">
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="relative min-w-0 flex-1">
              <span className="sr-only">Buscar alumnos</span>
              <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} className="w-full py-3 pl-12 pr-4" placeholder="Buscar por nombre, email, matrícula o nivel…" />
            </label>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setShowFilters((visible) => !visible)} className={`apple-press inline-flex min-h-11 items-center gap-2 rounded-2xl px-4 text-sm font-bold ${showFilters ? 'bg-blue text-white' : 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200'}`}>
                <FunnelIcon className="h-5 w-5" />
                Filtros
              </button>
              <div className="flex rounded-2xl bg-slate-100 p-1 dark:bg-white/10">
                <button type="button" onClick={() => setViewMode('table')} className={`apple-press flex h-11 w-11 items-center justify-center rounded-xl ${viewMode === 'table' ? 'bg-blue text-white shadow-sm' : 'text-slate-500'}`} aria-label="Vista de tabla">
                  <TableCellsIcon className="h-5 w-5" />
                </button>
                <button type="button" onClick={() => setViewMode('rows')} className={`apple-press flex h-11 w-11 items-center justify-center rounded-xl ${viewMode === 'rows' ? 'bg-blue text-white shadow-sm' : 'text-slate-500'}`} aria-label="Vista compacta">
                  <Squares2X2Icon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
          {showFilters && (
            <div className="grid gap-3 border-t border-slate-200/80 pt-4 sm:grid-cols-3 dark:border-white/10">
              <select aria-label="Filtrar por nivel" value={levelFilter} onChange={(event) => setLevelFilter(event.target.value)}><option value="">Todos los niveles</option><option>Asistente Montessori</option><option>Guía Montessori</option></select>
              <select aria-label="Filtrar por estado" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="">Todos los estados</option><option>Activo</option><option>Graduado</option><option>Inactivo</option></select>
              <select aria-label="Ordenar alumnos" value={sortMode} onChange={(event) => setSortMode(event.target.value)}><option value="recientes">Ingreso reciente</option><option value="nombre">Nombre</option><option value="nivel">Nivel</option></select>
            </div>
          )}
        </section>

        <section className="admin-table-surface overflow-hidden" aria-label="Alumnos">
          <div className={`${viewMode === 'table' ? 'hidden overflow-x-auto md:block' : 'hidden'}`}>
            <table className="min-w-full divide-y divide-slate-200 dark:divide-white/10">
              <thead><tr>{['Nombre', 'Matrícula', 'Email', 'Nivel', 'Estado', 'Acciones'].map((heading) => <th key={heading} className="px-5 py-4 text-left">{heading}</th>)}</tr></thead>
              <tbody className="divide-y divide-slate-200 bg-white dark:divide-white/10 dark:bg-slate-900">
                {students.map((student) => (
                  <tr key={student.id}>
                    <td className="px-5 py-4 text-sm font-semibold text-slate-900 dark:text-white">{student.nombre}</td>
                    <td className="px-5 py-4 text-sm">{student.matricula}</td>
                    <td className="px-5 py-4 text-sm">{student.email}</td>
                    <td className="max-w-48 px-5 py-4 text-sm">{student.nivel}</td>
                    <td className="px-5 py-4"><span className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-bold ${getStatusClass(student.estado)}`}>{student.estado}</span></td>
                    <td className="px-5 py-4 text-sm"><span className="font-bold text-blue">Ver</span><span className="mx-2 text-slate-300">|</span><span className="font-bold text-blue">Público</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={`${viewMode === 'rows' ? 'hidden divide-y divide-slate-200 dark:divide-white/10 md:block' : 'hidden'}`}>
            {students.map((student) => (
              <div key={student.id} className="grid min-h-20 grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1.2fr)_auto] items-center gap-5 px-5 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{student.nombre}</p>
                  <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">{student.email}</p>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300">{student.matricula}</p>
                <p className="text-sm text-slate-600 dark:text-slate-300">{student.nivel}</p>
                <span className={`rounded-lg px-2.5 py-1 text-xs font-bold ${getStatusClass(student.estado)}`}>{student.estado}</span>
              </div>
            ))}
          </div>

          <div className="divide-y divide-slate-200 dark:divide-white/10 md:hidden">
            {students.slice(0, 5).map((student) => (
              <button key={student.id} type="button" className="apple-press flex min-h-20 w-full items-center gap-3 bg-white px-4 py-3 text-left dark:bg-slate-900">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue/10 text-xs font-bold text-blue">{student.nombre.split(' ').slice(0, 2).map((part) => part[0]).join('')}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-slate-900 dark:text-white">{student.nombre}</span>
                  <span className="mt-1 block truncate text-xs text-slate-500 dark:text-slate-400">{student.matricula} · {student.nivel}</span>
                </span>
                <span className={`rounded-lg px-2 py-1 text-[0.68rem] font-bold ${getStatusClass(student.estado)}`}>{student.estado}</span>
                <ChevronRightIcon className="h-5 w-5 shrink-0 text-slate-400" />
              </button>
            ))}
          </div>
          {students.length === 0 && (
            <div className="px-6 py-14 text-center">
              <p className="font-bold text-slate-900 dark:text-white">No encontramos alumnos</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Prueba con otra búsqueda o limpia los filtros.</p>
            </div>
          )}
        </section>
      </div>
    </AdminLayout>
  );
};

export default AdminDesignPreview;
