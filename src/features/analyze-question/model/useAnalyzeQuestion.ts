import { useCallback, useState } from 'react';

import type { AnalysisResult } from '../../../entities/analysis';

export function useAnalyzeQuestion() {
  const [question, setQuestion] = useState('');
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const analyze = useCallback(
    async (questionToAnalyze = question) => {
      const normalizedQuestion = questionToAnalyze.trim();

      if (!normalizedQuestion || loading) {
        return;
      }

      setQuestion(normalizedQuestion);
      setLoading(true);
      setError('');

      try {
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ question: normalizedQuestion }),
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

        setResults((current) => [...current, body as AnalysisResult]);
      } catch (cause) {
        setError(
          cause instanceof Error ? cause.message : 'אירעה שגיאה לא צפויה',
        );
      } finally {
        setLoading(false);
      }
    },
    [loading, question],
  );

  return {
    question,
    setQuestion,
    results,
    loading,
    error,
    analyze,
  };
}
