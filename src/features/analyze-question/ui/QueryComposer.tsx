type QueryComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  loading: boolean;
};

import styles from './QueryComposer.module.css';

export function QueryComposer({
  value,
  onChange,
  onSubmit,
  loading,
}: QueryComposerProps) {
  return (
    <div className={styles.composer}>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        maxLength={500}
        placeholder="לדוגמה: אילו ערים הכי יקרות לדירות 4 חדרים?"
        rows={4}
      />
      <div className={styles.footer}>
        <span>{value.length}/500</span>
        <button
          type="button"
          onClick={onSubmit}
          disabled={loading || !value.trim()}
        >
          {loading ? 'מנתח…' : 'נתח'}
        </button>
      </div>
    </div>
  );
}
