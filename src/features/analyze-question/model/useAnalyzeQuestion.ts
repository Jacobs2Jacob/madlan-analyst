import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import type { AnalysisResult } from '../../../entities/analysis';

const ANALYSIS_STALE_TIME = 10 * 60 * 1000;

function normalizeQuestion(question: string) {
  return question.trim().replace(/\s+/g, ' ');
}

export function useAnalyzeQuestion() {
  const queryClient = useQueryClient();
  const [question, setQuestion] = useState('');
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const analyze = useCallback(
    async (questionOverride?: string) => {
      const currentQuestion = normalizeQuestion(questionOverride ?? question);

      if (!currentQuestion || loading) {
        return;
      }

      setQuestion(currentQuestion);
      setLoading(true);
      setError('');

      try {
        const result = await queryClient.fetchQuery({
          queryKey: ['analysis', currentQuestion],
          queryFn: async (): Promise<AnalysisResult> => {
            const response = await fetch('/api/analyze', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ question: currentQuestion }),
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

            return body as AnalysisResult;
          },
          staleTime: ANALYSIS_STALE_TIME,
        });

        setResults((current) => [...current, result]);
      } catch (cause) {
        setError(
          cause instanceof Error ? cause.message : 'אירעה שגיאה לא צפויה',
        );
      } finally {
        setLoading(false);
      }
    },
    [loading, question, queryClient],
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
