import {
  analyzeQuestion,
  AnalysisUnavailableError,
  UnsupportedQuestionError,
} from '../server/analyze.js';

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

    if (!question) {
      return json({ error: 'נא להזין שאלה.' }, 400);
    }

    if (question.length > 500) {
      return json({ error: 'השאלה ארוכה מדי. ניתן להזין עד 500 תווים.' }, 400);
    }

    const aiEnabled =
      typeof body === 'object' &&
      body !== null &&
      'aiEnabled' in body &&
      typeof body.aiEnabled === 'boolean'
        ? body.aiEnabled
        : true;

    const result = await analyzeQuestion(question, aiEnabled);
    return json(result);
  } catch (error) {
    if (error instanceof UnsupportedQuestionError) {
      return json({ error: error.message }, error.statusCode);
    }

    if (error instanceof AnalysisUnavailableError) {
      return json({ error: error.message }, error.statusCode);
    }

    console.error('Analysis request failed:', error);

    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'אירעה שגיאה לא צפויה.',
      },
      500,
    );
  }
}
