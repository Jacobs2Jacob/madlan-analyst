import { QueryComposer } from '../../../features/analyze-question';
import { AnalysisResult } from '../../../features/analyze-question';
import { QuestionSuggestions } from '../../../features/question-suggestions';
import type { AnalysisResult as AnalysisResultType } from '../../../entities/analysis';

import styles from './AnalysisSection.module.css';

type AnalysisSectionProps = {
  question: string;
  setQuestion: (value: string) => void;
  results: AnalysisResultType[];
  loading: boolean;
  error: string;
  analyze: (question?: string) => Promise<void>;
  onExplore: () => void;
};

export function AnalysisSection({
  question,
  setQuestion,
  results,
  loading,
  error,
  analyze,
  onExplore,
}: AnalysisSectionProps) {
  const handleSuggestionSelect = (selectedQuestion: string) => {
    setQuestion(selectedQuestion);
    void analyze(selectedQuestion);
  };

  return (
    <>
      <div className={styles.block}>
        <QuestionSuggestions onSelect={handleSuggestionSelect} />
        <QueryComposer
          value={question}
          onChange={setQuestion}
          onSubmit={() => void analyze()}
          loading={loading}
        />
      </div>

      {loading && (
        <div className={styles.loading} role="status" aria-live="polite">
          <span className={styles.spinner} aria-hidden="true" />
          <span>מפרש את השאלה, מחשב את הנתונים ומכין את התשובה…</span>
        </div>
      )}

      {error && (
        <div className={styles.error} role="alert">
          {error}
        </div>
      )}

      {results.map((result, index) => (
        <AnalysisResult
          key={`${result.question}-${index}`}
          result={result}
          onExplore={onExplore}
        />
      ))}
    </>
  );
}
