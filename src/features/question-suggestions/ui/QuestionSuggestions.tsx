import styles from './QuestionSuggestions.module.css';

export const suggestions = [
  {
    title: 'השוואת ערים',
    text: 'אילו ערים הכי יקרות לדירות 4 חדרים?',
  },
  {
    title: 'חניה ומחיר',
    text: 'האם דירות עם חניה נמכרות במחיר גבוה יותר?',
  },
  {
    title: 'מגמות',
    text: 'איך השתנה המחיר למ״ר לאורך זמן?',
  },
  {
    title: 'עסקאות חריגות',
    text: 'מצא עסקאות שנראות חריגות ביחס לעסקאות דומות.',
  },
];

type QuestionSuggestionsProps = {
  onSelect: (question: string) => void;
  disabled: boolean
};

export function QuestionSuggestions({
  onSelect,
  disabled
}: QuestionSuggestionsProps) {
  return (
    <div className={styles.grid}>
      {suggestions.map((suggestion) => (
        <button
          key={suggestion.title}
          className={styles.card}
          disabled={disabled}
          onClick={() => onSelect(suggestion.text)}
        >
          <span>{suggestion.title}</span>
          <strong>{suggestion.text}</strong>
        </button>
      ))}
    </div>
  );
}
