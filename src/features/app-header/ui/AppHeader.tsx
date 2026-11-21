import styles from './AppHeader.module.css';

type AppSection = 'explore' | 'analysis';

type AppHeaderProps = {
  section: AppSection;
  onSectionChange: (section: AppSection) => void;
};

export function AppHeader({
  section,
  onSectionChange,
}: AppHeaderProps) {
  return (
    <header className={styles.header}>
      <div>
        <div className={styles.logo}>Madlan Data Explorer</div> 
      </div>

      <nav>
        <button
          className={section === 'explore' ? styles.active : ''}
          onClick={() => onSectionChange('explore')}
        >
          עסקאות נדל"ן
        </button>
        <button
          className={section === 'analysis' ? styles.active : ''}
          onClick={() => onSectionChange('analysis')}
        >
          סוכן AI
        </button>
      </nav>
    </header>
  );
}
