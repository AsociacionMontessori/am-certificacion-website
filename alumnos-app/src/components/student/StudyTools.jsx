import {
  ArrowTopRightOnSquareIcon,
  BookOpenIcon,
  CalendarDaysIcon,
  EnvelopeIcon,
  FolderIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';

const STUDY_TOOLS = [
  {
    name: 'Google Classroom',
    href: 'https://classroom.google.com',
    icon: BookOpenIcon,
    iconClass: 'bg-[#fff8dc] text-[#b68900] ring-[#fbd116]/25',
  },
  {
    name: 'Correo escolar',
    href: 'https://mail.google.com',
    icon: EnvelopeIcon,
    iconClass: 'bg-red/5 text-red ring-red/10',
  },
  {
    name: 'Drive',
    href: 'https://drive.google.com',
    icon: FolderIcon,
    iconClass: 'bg-green/10 text-[#4ca72e] ring-green/20',
  },
  {
    name: 'Google Calendar',
    href: 'https://calendar.google.com',
    icon: CalendarDaysIcon,
    iconClass: 'bg-blue/10 text-blue ring-blue/15',
  },
];

export const StudyToolsList = ({ className = '', compactGrid = false }) => (
  <div className={`${compactGrid ? 'grid grid-cols-4 gap-2' : 'divide-y divide-slate-200/80 dark:divide-white/10'} ${className}`}>
    {STUDY_TOOLS.map((tool) => (
      <a
        key={tool.name}
        href={tool.href}
        target="_blank"
        rel="noopener noreferrer"
        className={`apple-press group flex rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5 ${
          compactGrid
            ? 'min-h-28 min-w-0 flex-col items-center gap-2 px-1 py-3 text-center'
            : 'min-h-16 items-center gap-3 px-2 py-2'
        }`}
      >
        <span className={`flex shrink-0 items-center justify-center rounded-2xl ring-1 ${compactGrid ? 'h-14 w-14' : 'h-10 w-10 rounded-xl'} ${tool.iconClass}`}>
          <tool.icon className={compactGrid ? 'h-7 w-7' : 'h-5 w-5'} aria-hidden="true" />
        </span>
        <span className={`min-w-0 font-semibold text-slate-800 dark:text-slate-100 ${compactGrid ? 'text-xs leading-tight' : 'flex-1 text-sm'}`}>
          {tool.name}
        </span>
        {!compactGrid && (
          <ArrowTopRightOnSquareIcon className="h-5 w-5 text-slate-400 transition-colors group-hover:text-blue" aria-hidden="true" />
        )}
      </a>
    ))}
  </div>
);

const StudyToolsSheet = ({ open, onClose }) => (
  <Dialog open={open} onClose={onClose} className="relative z-[90] lg:hidden" transition>
    <DialogBackdrop className="fixed inset-x-0 top-0 bottom-[calc(4.55rem+env(safe-area-inset-bottom))] bg-slate-950/30 backdrop-blur-[2px] transition duration-300 ease-out data-closed:opacity-0 motion-reduce:duration-150" />
    <div className="fixed inset-x-0 top-0 bottom-[calc(4.55rem+env(safe-area-inset-bottom))] flex items-end justify-center">
      <DialogPanel className="sheet-material w-full max-w-xl rounded-t-[2rem] px-4 pb-3 pt-3 shadow-[0_-20px_70px_rgba(15,23,42,0.18)] transition duration-300 ease-out data-closed:translate-y-full motion-reduce:transform-none motion-reduce:data-closed:opacity-0">
        <div className="mx-auto h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-600" aria-hidden="true" />
        <div className="mt-4 flex items-center justify-between">
          <DialogTitle className="text-xl font-bold tracking-[-0.025em] text-slate-900 dark:text-white">
            Herramientas de estudio
          </DialogTitle>
          <button
            type="button"
            onClick={onClose}
            className="apple-press flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/15"
            aria-label="Cerrar herramientas"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <StudyToolsList className="mt-3" compactGrid />
      </DialogPanel>
    </div>
  </Dialog>
);

export default StudyToolsSheet;
