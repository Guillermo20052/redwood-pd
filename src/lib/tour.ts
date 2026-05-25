import Shepherd, { type StepOptionsButton, type Tour } from 'shepherd.js';
import { isWelcomeComplete, type WelcomeProfile } from '@/lib/welcome-gate';

export type TourProfile = WelcomeProfile & {
  tour_completed_at?: string | null;
};

export function shouldAutoStartTour(profile: TourProfile): boolean {
  if (profile.role === 'admin') return false;
  if (profile.tour_completed_at) return false;
  return isWelcomeComplete(profile);
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

type CreateTourOptions = {
  onFinish: () => void | Promise<void>;
  onStartNivel1: () => void;
};

export function createTour({ onFinish, onStartNivel1 }: CreateTourOptions): Tour {
  const reduced = prefersReducedMotion();

  const tour = new Shepherd.Tour({
    useModalOverlay: true,
    defaultStepOptions: {
      classes: 'redwood-tour-step',
      scrollTo: { behavior: reduced ? 'auto' : 'smooth', block: 'center' },
      cancelIcon: { enabled: true },
    },
  });

  let finished = false;
  const finishOnce = async () => {
    if (finished) return;
    finished = true;
    await onFinish();
  };

  tour.on('complete', () => {
    void finishOnce();
  });
  tour.on('cancel', () => {
    void finishOnce();
  });

  const skipButton = (): StepOptionsButton => ({
    text: 'Saltar tour',
    secondary: true,
    action() {
      void this.cancel();
    },
  });

  const nextButton = (): StepOptionsButton => ({
    text: 'Siguiente →',
    action() {
      this.next();
    },
  });

  tour.addStep({
    id: 'welcome-hero',
    attachTo: { element: '.personalized-hero', on: 'bottom' },
    title: 'Bienvenida a tu Ruta de Desarrollo Profesional',
    text: 'Aquí es donde verás tu progreso cada vez que entres. Tu nombre, tus horas, y tu próximo paso siempre visibles.',
    buttons: [skipButton(), nextButton()],
  });

  tour.addStep({
    id: 'camino',
    attachTo: { element: '[data-tour="camino"]', on: 'bottom' },
    title: 'Tu camino visual',
    text: 'Este mapa te muestra dónde estás en tu viaje hacia los 3 Diplomas. Cada milestone alcanzado se ilumina. Haz clic en los diplomas para ver detalles.',
    buttons: [skipButton(), nextButton()],
  });

  tour.addStep({
    id: 'levels',
    attachTo: { element: '[data-tour="levels"]', on: 'top' },
    title: 'Los 3 Niveles',
    text: 'Empezarás en Nivel 1 con herramientas fundamentales. Avanza a tu ritmo — cada nivel se desbloquea al completar el anterior.',
    buttons: [skipButton(), nextButton()],
  });

  tour.addStep({
    id: 'nav-tareas',
    attachTo: { element: '[data-tour="nav-tareas-extra"]', on: 'bottom' },
    title: 'Tareas Level Up',
    text: 'Después de cada nivel, desbloquearás 10 Tareas Level Up. Necesitas completar al menos 4 de cada nivel para obtener tu Diploma — son parte central de tu camino.',
    buttons: [skipButton(), nextButton()],
  });

  tour.addStep({
    id: 'nav-comunidad',
    attachTo: { element: '[data-tour="nav-comunidad"]', on: 'bottom' },
    title: 'Comunidad',
    text: 'Conecta con otras docentes del programa. Comparte aprendizajes en el chat, haz preguntas y consulta el leaderboard de horas.',
    buttons: [skipButton(), nextButton()],
  });

  tour.addStep({
    id: 'nav-logros',
    attachTo: { element: '[data-tour="nav-logros"]', on: 'bottom' },
    title: 'Tus Diplomas',
    text: 'Aquí están tus 3 diplomas — Bronce, Plata y Oro. Al ganar uno, puedes verlo, imprimirlo y compartirlo.',
    buttons: [skipButton(), nextButton()],
  });

  tour.addStep({
    id: 'chatbot',
    attachTo: { element: '[data-tour="chatbot"]', on: 'top-start' },
    title: 'Tu coach IA',
    text: 'Si tienes dudas sobre la plataforma en cualquier momento, haz clic aquí. Tu coach IA responde 24/7 sobre navegación, tareas y requisitos del programa.',
    buttons: [skipButton(), nextButton()],
  });

  tour.addStep({
    id: 'start-nivel1',
    attachTo: { element: '[data-tour="level-b"]', on: 'top' },
    title: '¡Listo para empezar!',
    text: 'Tu Nivel 1 te está esperando. Recuerda: avanza a tu ritmo, sé honesta en tus reflexiones, y pide ayuda cuando la necesites.',
    buttons: [
      skipButton(),
      {
        text: 'Empezar Nivel 1',
        action() {
          this.complete();
          onStartNivel1();
        },
      },
    ],
  });

  return tour;
}
