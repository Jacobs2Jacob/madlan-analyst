import { QueryComposer } from '../../../features/analyze-question';
import { AnalysisResult } from '../../../features/analyze-question';
import { QuestionSuggestions } from '../../../features/question-suggestions';
import type { AnalysisResult as AnalysisResultType } from '../../../entities/analysis';

import styles from './AnalysisSection.module.css';

type AnalysisSectionProps = {
  question: string;
  setQuestion: (value: string) => void;
  result: AnalysisResultType | null;
  loading: boolean;
  error: string;
  analyze: () => void;
  onExplore: () => void;
};

export function AnalysisSection({
  question,
  setQuestion,
  result,
  loading,
  error,
  analyze,
  onExplore,
}: AnalysisSectionProps) {
  return (
    <>
      <div className={styles.block}>
        <QuestionSuggestions onSelect={setQuestion} />
        <QueryComposer
          value={question}
          onChange={setQuestion}
          onSubmit={analyze}
          loading={loading}
        />
      </div>

      {loading && (
        <div className={styles.loading}>
          מפרש את השאלה ומחשב את הנתונים…
        </div>
      )}

      {error && <div className={styles.error}>{error}</div>}

      {result && <AnalysisResult result={result} onExplore={onExplore} />}
    </>
  );
}
