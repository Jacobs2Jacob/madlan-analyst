import { useState } from 'react';

import { useAnalyzeQuestion } from '../../../features/analyze-question';
import { AppHeader } from '../../../features/app-header';
import { DataExplorer } from '../../../features/data-explorer';

import { AnalysisSection } from './AnalysisSection';
import styles from './HomePage.module.css';

type HomeSection = 'explore' | 'analysis';

export function HomePage() {
  const [section, setSection] = useState<HomeSection>('explore');
  const analysis = useAnalyzeQuestion();

  return (
    <main className={styles.page}>
      <AppHeader
        section={section}
        onSectionChange={setSection}
      />

      {section === 'explore' ? (
        <DataExplorer onAsk={() => setSection('analysis')} />
      ) : (
        <AnalysisSection
          {...analysis}
          onExplore={() => setSection('explore')}
        />
      )}
    </main>
  );
}
