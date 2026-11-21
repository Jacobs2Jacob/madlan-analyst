import type { ExplorerFilters as ExplorerFiltersState } from '../model/types';
import styles from './ExplorerFilters.module.css';

type ExplorerFiltersProps = {
  filters: ExplorerFiltersState;
  cities: string[];
  rooms: number[];
  propertyTypes: string[];
  update: (patch: Partial<ExplorerFiltersState>) => void;
  clear: () => void;
};

export function ExplorerFilters({
  filters,
  cities,
  rooms,
  propertyTypes,
  update,
  clear,
}: ExplorerFiltersProps) {
  return (
    <section className={styles.panel}>
      <div className={styles.grid}>
        <label>
          חיפוש
          <input
            value={filters.search}
            onChange={(event) => update({ search: event.target.value })}
            placeholder="עיר, שכונה, רחוב או מזהה"
          />
        </label>

        <label>
          עיר
          <select
            value={filters.city}
            onChange={(event) => update({ city: event.target.value })}
          >
            <option value="">כל הערים</option>
            {cities.map((city) => (
              <option key={city}>{city}</option>
            ))}
          </select>
        </label>

        <label>
          חדרים
          <select
            value={filters.rooms}
            onChange={(event) => update({ rooms: event.target.value })}
          >
            <option value="">כל מספרי החדרים</option>
            {rooms.map((room) => (
              <option key={room}>{room}</option>
            ))}
          </select>
        </label>

        <label>
          סוג נכס
          <select
            value={filters.propertyType}
            onChange={(event) => update({ propertyType: event.target.value })}
          >
            <option value="">כל סוגי הנכסים</option>
            {propertyTypes.map((propertyType) => (
              <option key={propertyType}>{propertyType}</option>
            ))}
          </select>
        </label>

        <label>
          חניה
          <select
            value={filters.parking}
            onChange={(event) => update({ parking: event.target.value })}
          >
            <option value="">לא משנה</option>
            <option value="yes">יש חניה</option>
            <option value="no">אין חניה</option>
          </select>
        </label>
      </div>

      <div className={styles.footer}>
        <span>הסינון מתבצע מקומית על הדאטה המנורמל</span>
        <button onClick={clear}>נקה סינון</button>
      </div>
    </section>
  );
}
