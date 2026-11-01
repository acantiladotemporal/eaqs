export type EnrollmentStatus = 'pending_payment' | 'active' | 'cancelled' | 'refunded';
export type ModuleAvailability = 'locked_by_date' | 'available' | 'completed_quiz';
export type EmailEventType = 'newsletter_sent' | 'transactional_sent' | 'opened' | 'clicked';
export interface CourseModule { id: string; numero: string; title: string; description: string; overview: string; unlockAtIso: string | null; }
export const COURSE_LAUNCH_PRICE_EUR = 390;
export const COURSE_STANDARD_PRICE_EUR = 490;
export const COURSE_SEAT_LIMIT = 20;
export const COURSE_COHORT_ID = '11111111-1111-4111-8111-111111111111';
export const COURSE_NAME = 'Neuroeducación musical para la primera infancia';
const program = [
  ['Arquitectura Cerebral', 'Bases biológicas del procesamiento sonoro y la atención infantil.', 'Comprender cómo se relacionan sonido, atención y aprendizaje.'],
  ['Sincronía Rítmica', 'Pulso, movimiento y coordinación para acompañar la energía del grupo.', 'Explorar el pulso y el movimiento en el aula.'],
  ['Neurofonía', 'Voz, escucha y lenguaje musical para la comunicación expresiva.', 'Observar el lugar de la voz y la escucha en la expresión.'],
  ['Sistema Límbico', 'Emoción, memoria y experiencias sonoras desde un enfoque vincular.', 'Conectar la experiencia musical con la vida emocional.'],
  ['Laboratorio De Aula', 'Secuencias prácticas para docentes de niños y niñas de 0 a 6 años.', 'Llevar la reflexión a propuestas para el aula real.'],
  ['Diseño Multisensorial', 'Ritmo, juego y narrativa corporal en las sesiones.', 'Diseñar experiencias que integren cuerpo, escucha y juego.'],
  ['Evaluación Sensible', 'Indicadores observables para acompañar el progreso sin rigidez.', 'Mirar el proceso y documentar lo que ocurre.'],
  ['Mentoría De Casos', 'Análisis de situaciones reales y ajustes metodológicos.', 'Compartir preguntas y revisar decisiones docentes.'],
  ['Integración Transversal', 'Conexiones con lenguaje, psicomotricidad y convivencia escolar.', 'Relacionar la experiencia musical con otros aprendizajes.'],
  ['Certificación Final', 'Síntesis del recorrido y trabajo final aplicado.', 'Integrar el aprendizaje y presentar el trabajo para su revisión docente.'],
];
export const COURSE_MODULES: CourseModule[] = program.map(([title, description, overview], index) => ({
  id: String(index + 1), numero: String(index + 1).padStart(2, '0'), title, description, overview, unlockAtIso: null,
}));
/** Dates are deliberately unset until the next cohort calendar is confirmed. */
export function moduleIsAvailable(module: CourseModule, now = new Date()) { return module.unlockAtIso !== null && now.getTime() >= new Date(module.unlockAtIso).getTime(); }
export function resolveModuleAvailability(module: CourseModule, completed: Record<string, boolean> = {}, now = new Date()): ModuleAvailability {
  if (!moduleIsAvailable(module, now)) return 'locked_by_date';
  return completed[module.id] ? 'completed_quiz' : 'available';
}
export function formatMadridDate(iso: string | null, locale = 'es-ES') {
  if (!iso) return 'Fecha por confirmar';
  return new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Europe/Madrid' }).format(new Date(iso));
}
export function getModuleById(moduleId: string) { return COURSE_MODULES.find((module) => module.id === moduleId); }
