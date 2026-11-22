import styles from './AppHeader.module.css';

type AppSection = 'explore' | 'analysis';

type AppHeaderProps = {
  section: AppSection;
  onSectionChange: (section: AppSection) => void;
  aiEnabled: boolean;
  onAiToggle: () => void;
};

export function AppHeader({
  section,
  onSectionChange,
  aiEnabled,
  onAiToggle,
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
          ניתוח נתונים מבוסס AI
        </button>

        <button
          className={styles.aiToggle}
          onClick={onAiToggle}
          aria-pressed={aiEnabled}
          type="button"
        >
          <span className={styles.aiToggleLabel}>AI</span>
          <span
            className={`${styles.aiSwitch} ${
              aiEnabled ? styles.aiSwitchOn : ''
            }`}
          >
            <span className={styles.aiSwitchThumb} />
          </span>
          <span>{aiEnabled ? 'פעיל' : 'כבוי'}</span>
        </button>
      </nav>
    </header>
  );
}