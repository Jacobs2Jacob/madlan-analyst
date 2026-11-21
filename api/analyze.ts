import { analyzeQuestion } from '../server/analyze';

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
}

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  try {
    const body: unknown = await req.json();
    const question =
      typeof body === 'object' &&
      body !== null &&
      'question' in body &&
      typeof body.question === 'string'
        ? body.question.trim()
        : '';

    if (!question || question.length > 500) {
      return json({ error: 'נא להזין שאלה באורך סביר.' }, 400);
    }

    return json(await analyzeQuestion(question));
  } catch (error) {
    console.error('Analyze request failed:', error);
    return json(
      { error: 'לא הצלחנו להשלים את הניתוח. אפשר לנסות שוב.' },
      500,
    );
  }
}
