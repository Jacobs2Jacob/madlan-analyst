import { useCallback, useState } from 'react';

import type { AnalysisResult } from '../../../entities/analysis';

export function useAnalyzeQuestion() {
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const analyze = useCallback(async () => {
    if (!question.trim() || loading) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: question.trim() }),
      });

      const text = await response.text();
      let body: { error?: string } & Partial<AnalysisResult>;

      try {
        body = JSON.parse(text);
      } catch {
        throw new Error(
          response.ok
            ? 'השרת החזיר תשובה שאינה JSON.'
            : `שגיאת שרת (${response.status}).`,
        );
      }

      if (!response.ok) {
        throw new Error(body.error || 'אירעה שגיאה בניתוח');
      }

      setResult(body as AnalysisResult);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'אירעה שגיאה לא צפויה',
      );
    } finally {
      setLoading(false);
    }
  }, [loading, question]);

  return {
    question,
    setQuestion,
    result,
    loading,
    error,
    analyze,
  };
}
