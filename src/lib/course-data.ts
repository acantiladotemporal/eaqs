export type EnrollmentStatus = 'pending' | 'paid' | 'cancelled' | 'refunded';
export type ModuleAvailability = 'locked_by_date' | 'available' | 'completed_quiz';
export type EmailEventType = 'newsletter_sent' | 'transactional_sent' | 'opened' | 'clicked';

export interface CourseModule {
  id: string;
  numero: string;
  title: string;
  description: string;
  overview: string;
  unlockAtIso: string;
}

export interface CaptureWeek {
  id: string;
  label: string;
  startIso: string;
  endIso: string;
  focus: string;
}

export const COURSE_LAUNCH_PRICE_EUR = 390;
export const COURSE_STANDARD_PRICE_EUR = 490;
export const COURSE_SEAT_LIMIT = 20;
export const CHECKOUT_CLOSE_AT_ISO = '2026-04-12T23:59:00+02:00';

export const COURSE_TIMELINE = [
  {
    id: 'launch',
    label: 'Lanzamiento',
    dateRange: '12 marzo 2026',
    detail: 'Web abierta, checkout activo y captacion iniciada.',
  },
  {
    id: 'capture-1',
    label: 'Captacion semana 1',
    dateRange: '16 marzo - 22 marzo',
    detail: 'Posicionamiento, problema y deseo de aula.',
  },
  {
    id: 'capture-2',
    label: 'Captacion semana 2',
    dateRange: '23 marzo - 29 marzo',
    detail: 'Metodologia, autoridad y casos aplicados.',
  },
  {
    id: 'capture-3',
    label: 'Captacion semana 3',
    dateRange: '30 marzo - 5 abril',
    detail: 'Semana Santa: valor ligero y objeciones.',
  },
  {
    id: 'capture-4',
    label: 'Captacion semana 4',
    dateRange: '6 abril - 12 abril',
    detail: 'Cierre final con urgencia y plazas limitadas.',
  },
  {
    id: 'close',
    label: 'Cierre comercial',
    dateRange: '12 abril 23:59',
    detail: 'Cierre automatico por fecha o por plazas completas.',
  },
] as const;

export const CAPTURE_WEEKS: CaptureWeek[] = [
  {
    id: 'week-1',
    label: 'Semana 1',
    startIso: '2026-03-16T00:00:00+01:00',
    endIso: '2026-03-22T23:59:59+01:00',
    focus: 'Posicionamiento y problema real del aula.',
  },
  {
    id: 'week-2',
    label: 'Semana 2',
    startIso: '2026-03-23T00:00:00+01:00',
    endIso: '2026-03-29T23:59:59+01:00',
    focus: 'Metodo, autoridad y demostraciones.',
  },
  {
    id: 'week-3',
    label: 'Semana 3',
    startIso: '2026-03-30T00:00:00+02:00',
    endIso: '2026-04-05T23:59:59+02:00',
    focus: 'Semana Santa: contenido ligero + objeciones.',
  },
  {
    id: 'week-4',
    label: 'Semana 4',
    startIso: '2026-04-06T00:00:00+02:00',
    endIso: '2026-04-12T23:59:59+02:00',
    focus: 'Cierre de carrito y conversion final.',
  },
];

export const COURSE_MODULES: CourseModule[] = [
  {
    id: '1',
    numero: '01',
    title: 'Arquitectura Cerebral',
    description: 'Bases biologicas del procesamiento sonoro y la atencion infantil.',
    overview: 'Bases neurobiologicas del sonido para crear seguridad y foco en clase.',
    unlockAtIso: '2026-04-17T09:00:00+02:00',
  },
  {
    id: '2',
    numero: '02',
    title: 'Sincronia Ritmica',
    description: 'Pulso, movimiento y coordinacion para regular energia grupal.',
    overview: 'Pulso y movimiento como eje para atencion sostenida.',
    unlockAtIso: '2026-04-17T09:00:00+02:00',
  },
  {
    id: '3',
    numero: '03',
    title: 'Neurofonia',
    description: 'Voz, escucha y lenguaje musical para comunicacion expresiva.',
    overview: 'Voz y escucha activa para lenguaje y expresion.',
    unlockAtIso: '2026-04-24T09:00:00+02:00',
  },
  {
    id: '4',
    numero: '04',
    title: 'Sistema Limbico',
    description: 'Emocion, memoria y anclajes sonoros con enfoque vincular.',
    overview: 'Emocion y memoria para aprendizaje significativo.',
    unlockAtIso: '2026-04-24T09:00:00+02:00',
  },
  {
    id: '5',
    numero: '05',
    title: 'Laboratorio de Aula',
    description: 'Secuencias practicas para 0-6 transferibles a 0-9.',
    overview: 'Diseno de secuencias aplicables en aula real.',
    unlockAtIso: '2026-05-08T09:00:00+02:00',
  },
  {
    id: '6',
    numero: '06',
    title: 'Diseno Multisensorial',
    description: 'Integracion de ritmo, juego y narrativa corporal en sesiones.',
    overview: 'Ritmo, juego y narrativa corporal en sesiones completas.',
    unlockAtIso: '2026-05-08T09:00:00+02:00',
  },
  {
    id: '7',
    numero: '07',
    title: 'Evaluacion Sensible',
    description: 'Indicadores observables para medir progreso sin rigidez.',
    overview: 'Evaluar con criterios claros sin romper el clima del aula.',
    unlockAtIso: '2026-05-15T09:00:00+02:00',
  },
  {
    id: '8',
    numero: '08',
    title: 'Mentoria de Casos',
    description: 'Analisis de situaciones reales y ajustes metodologicos.',
    overview: 'Resolucion de casos reales y toma de decisiones docentes.',
    unlockAtIso: '2026-05-15T09:00:00+02:00',
  },
  {
    id: '9',
    numero: '09',
    title: 'Integracion Transversal',
    description: 'Conexion con lenguaje, psicomotricidad y convivencia escolar.',
    overview: 'Transferencia interdisciplinar y continuidad pedagogica.',
    unlockAtIso: '2026-05-22T09:00:00+02:00',
  },
  {
    id: '10',
    numero: '10',
    title: 'Certificacion Final',
    description: 'Cierre de cohorte, evidencia aplicada y acreditacion.',
    overview: 'Sintesis, evidencia de impacto y certificacion de Escuela.',
    unlockAtIso: '2026-05-22T09:00:00+02:00',
  },
];

export const INTEGRATION_WEEKEND = {
  startIso: '2026-05-01T00:00:00+02:00',
  endIso: '2026-05-03T23:59:59+02:00',
  title: 'Semana de integracion',
  detail: 'Sin modulo nuevo: practica guiada, Q&A y consolidacion.',
} as const;

export function getCheckoutState(paidSeats = 0, now = new Date()) {
  const closeAt = new Date(CHECKOUT_CLOSE_AT_ISO);
  const soldOut = paidSeats >= COURSE_SEAT_LIMIT;
  const closedByDate = now.getTime() > closeAt.getTime();
  const open = !soldOut && !closedByDate;

  return {
    open,
    soldOut,
    closedByDate,
    paidSeats,
    seatsLeft: Math.max(COURSE_SEAT_LIMIT - paidSeats, 0),
    closesAtIso: CHECKOUT_CLOSE_AT_ISO,
  };
}

export function moduleIsAvailable(module: CourseModule, now = new Date()) {
  return now.getTime() >= new Date(module.unlockAtIso).getTime();
}

export function resolveModuleAvailability(
  module: CourseModule,
  completedQuizMap: Record<string, boolean> = {},
  now = new Date()
): ModuleAvailability {
  if (!moduleIsAvailable(module, now)) return 'locked_by_date';
  if (completedQuizMap[module.id]) return 'completed_quiz';
  return 'available';
}

export function formatMadridDate(iso: string, locale = 'es-ES') {
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Europe/Madrid',
  }).format(new Date(iso));
}

export function getModuleById(moduleId: string) {
  return COURSE_MODULES.find((module) => module.id === moduleId);
}

