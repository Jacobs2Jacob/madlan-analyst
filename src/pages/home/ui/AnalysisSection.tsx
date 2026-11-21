import { AnalysisResult, QueryComposer } from '../../../features/analyze-question';
import { QuestionSuggestions } from '../../../features/question-suggestions';
import type { AnalysisResult as AnalysisResultType } from '../../../entities/analysis';

import styles from './AnalysisSection.module.css';

type AnalysisSectionProps = {
  question: string;
  setQuestion: (value: string) => void;
  results: AnalysisResultType[];
  loading: boolean;
  error: string;
  analyze: (question?: string) => void;
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
  return (
    <>
      <div className={styles.block}>
        <QuestionSuggestions onSelect={analyze} />
        <QueryComposer
          value={question}
          onChange={setQuestion}
          onSubmit={() => analyze()}
          loading={loading}
        />
      </div>

      {results.map((result, index) => (
        <AnalysisResult
          key={`${result.question}-${index}`}
          result={result}
          onExplore={onExplore}
        />
      ))}

      {loading && (
        <div className={styles.loading}>
          <span className={styles.spinner} aria-hidden="true" />
          מפרש את השאלה, מחשב את הנתונים ומכין את התשובה…
        </div>
      )}

      {error && <div className={styles.error}>{error}</div>}
 
    </>
  );
}
