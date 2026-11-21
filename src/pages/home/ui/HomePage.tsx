import { useEffect, useState } from 'react';

import { useAnalyzeQuestion } from '../../../features/analyze-question';
import { AppHeader } from '../../../features/app-header';
import { DataExplorer } from '../../../features/data-explorer';

import { AnalysisSection } from './AnalysisSection';
import styles from './HomePage.module.css';

type HomeSection = 'explore' | 'analysis';

export function HomePage() {
  const [section, setSection] = useState<HomeSection>('explore');
  const {question,
         setQuestion,
         results,
         loading,
         error,
         analyze} = useAnalyzeQuestion();

  useEffect(()=> {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth',
    });
  }, [results])

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
            onExplore={() => setSection('explore')} 
            question={question} 
            setQuestion={setQuestion} 
            results={results} 
            loading={loading} 
            error={error} 
            analyze={analyze}/>
      )}

    </main>
  );
}
