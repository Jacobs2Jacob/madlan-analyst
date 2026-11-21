import { analyzeQuestion } from '../server/analyze';

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
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

    return Response.json(await analyzeQuestion(question));
  } 
  catch (error) { 
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Unknown server error',
      },
      { status: 500 },
    );
  }
} 