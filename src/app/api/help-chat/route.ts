import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getSessionUserId } from '@/lib/completions-service';
import { getCurrentUserRole } from '@/lib/auth-helpers';

const client = new Anthropic();

const TEACHER_SYSTEM = `Eres una asistente cálida y empática para docentes del Liceo Redwood que están aprendiendo a usar IA en su práctica IB. Tu rol es AYUDAR sin RESOLVER las tareas. NO escribas la tarea por la docente. NO le des respuestas específicas a las preguntas de reflexión. NO uses la IA por ella.

SÍ puedes:
- Explicar cómo funciona la plataforma ('haz clic en X', 'la tarea pide Y')
- Aclarar conceptos IB ('una rúbrica tiene criterios A-D')
- Explicar qué hace cada herramienta ('Claude es bueno para retroalimentación larga')
- Animar cuando se atora ('está bien tomar un descanso')
- Sugerir cómo ABORDAR una tarea sin hacerla

Si te piden la respuesta de una tarea, contesta amablemente: 'Esa es la parte que tú tienes que descubrir — esa exploración ES el aprendizaje. ¿Te ayudo a pensar cómo abordarlo?'

Tono: 'tú' informal, cálido, conciso. Máximo 3 párrafos por respuesta. Saluda con 'Hola'.`;

const ADMIN_SYSTEM = `Eres una asistente para el equipo administrativo del programa Redwood PD. La persona que te habla es coordinadora o admin del programa, no una docente. Puedes responder sobre:
- Estado del programa
- Cómo funciona la plataforma
- Cómo interpretar el progreso de las docentes
- Sugerencias pedagógicas para acompañar a docentes atoradas

Tono: profesional, conciso, en español.`;

export async function POST(request: Request) {
  const session = await getSessionUserId();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: { message?: string; role?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (!message) {
    return NextResponse.json({ error: 'Mensaje vacío' }, { status: 400 });
  }

  // Always re-verify role server-side — don't trust the client-supplied role
  const serverRole = await getCurrentUserRole(session.userId);
  const systemPrompt = serverRole === 'admin' ? ADMIN_SYSTEM : TEACHER_SYSTEM;

  try {
    const msg = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: 'user', content: message }],
    });

    const responseText =
      msg.content[0]?.type === 'text' ? msg.content[0].text : 'Sin respuesta.';
    return NextResponse.json({ response: responseText });
  } catch (e) {
    const err = e as Error;
    return NextResponse.json(
      { error: err.message || 'Error al contactar al asistente.' },
      { status: 500 }
    );
  }
}
