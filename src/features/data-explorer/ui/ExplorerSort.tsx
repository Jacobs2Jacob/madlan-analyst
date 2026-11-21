import type { SortKey } from '../model/useExplorerSort';

type ExplorerSortProps = {
  value: SortKey;
  onChange: (value: SortKey) => void;
};

export function ExplorerSort({ value, onChange }: ExplorerSortProps) {
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 13,
        color: '#666',
      }}
    >
      מיון
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as SortKey)}
        style={{
          height: 36,
          border: '1px solid #ddd',
          borderRadius: 8,
          padding: '0 8px',
          background: '#fff',
        }}
      >
        <option value="date">תאריך עסקה</option>
        <option value="price">מחיר</option>
        <option value="sqm">מחיר למ״ר</option>
      </select>
    </label>
  );
}
