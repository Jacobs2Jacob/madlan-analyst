import { useState } from 'react';
import type { AnalysisResult as AnalysisResultEntity } from '../../../entities/analysis';
import { MetricCard } from '../../../shared/ui/MetricCard'; 
import styles from './AnalysisResult.module.css';

type AnalysisResultProps = {
  result: AnalysisResultEntity;
  onExplore: () => void;
  query: string;
};

export function AnalysisResult({ result, onExplore, query }: AnalysisResultProps) {
  
  const [question] = useState(query);
  
  return (
    <section className={styles.result}>
      <label>{question}</label>
      
      <div className={styles.title}>
        <div>
          <span>תוצאת הניתוח</span>
          <h2>{result.interpretation}</h2>
        </div>

        {!result.aiAvailable && (
          <em>AI לא זמין - הוצגו תוצאות סטטיסטיות בלבד</em>
        )}
      </div>

      {result.metrics.length > 0 && (
        <div className={styles.metrics}>
          {result.metrics.map((metric) => (
            <MetricCard key={metric.label} label={metric.label} value={metric.value} />
          ))}
        </div>
      )}

      <div className={styles.summary}>{result.summary}</div>

      {result.evidence.length > 0 && (
        <div className={styles.evidence}>
          <h3>הראיות שעליהן התבסס הניתוח</h3>
          <div className={styles.evidenceGrid}>
            {result.evidence.map((row, index) => (
              <div className={styles.evidenceRow} key={index}>
                {Object.entries(row).map(([key, value]) => (
                  <span key={key}>
                    <b>{key}</b>
                    {String(value ?? '—')}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.limitations}>
        <h3>מגבלות</h3>
        <ul>
          {result.limitations.map((limitation) => (
            <li key={limitation}>{limitation}</li>
          ))}
        </ul>
      </div> 
    </section>
  );
}
