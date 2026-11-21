import styles from './QueryComposer.module.css';

type QueryComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  loading: boolean;
};

export function QueryComposer({
  value,
  onChange,
  onSubmit,
  loading,
}: QueryComposerProps) {
  const trimmedValue = value.trim();
  const validationMessage =
    value.length > 500
      ? 'השאלה ארוכה מדי. ניתן להזין עד 500 תווים.'
      : '';

  return (
    <div className={styles.composer}>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        maxLength={500}
        placeholder="לדוגמה: אילו ערים הכי יקרות לדירות 4 חדרים?"
        rows={4}
        aria-invalid={Boolean(validationMessage)}
        aria-describedby={validationMessage ? 'question-validation' : undefined}
      />
      <div className={styles.footer}>
        {validationMessage ? (
          <span id="question-validation" role="alert">
            {validationMessage}
          </span>
        ) : (
          <span>{value.length}/500</span>
        )}
        <button
          type="button"
          onClick={onSubmit}
          disabled={loading || !trimmedValue || Boolean(validationMessage)}
        >
          {loading ? 'מנתח…' : 'נתח'}
        </button>
      </div>
    </div>
  );
}
