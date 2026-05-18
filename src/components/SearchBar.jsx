import { useRef } from 'react'
import styles from './SearchBar.module.css'

export default function SearchBar({ value, onChange, onFilterOpen, activeFilterCount, resultCount, total }) {
  const inputRef = useRef(null)

  return (
    <div className={styles.wrapper}>
      <div className={styles.bar}>
        <span className={styles.icon}>🔍</span>
        <input
          ref={inputRef}
          className={styles.input}
          type="search"
          placeholder="Sök gatunamn…"
          value={value}
          onChange={e => onChange(e.target.value)}
          autoComplete="off"
          autoCorrect="off"
          spellCheck="false"
        />
        {value && (
          <button className={styles.clear} onClick={() => { onChange(''); inputRef.current?.focus() }}>
            ✕
          </button>
        )}
        <button
          className={`${styles.filterBtn} ${activeFilterCount > 0 ? styles.filterActive : ''}`}
          onClick={onFilterOpen}
          aria-label="Filter"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 3h12M4 8h8M6 13h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          {activeFilterCount > 0 && (
            <span className={styles.filterBadge}>{activeFilterCount}</span>
          )}
        </button>
      </div>
      {(value || activeFilterCount > 0) && (
        <div className={styles.badge}>
          {resultCount} av {total}
        </div>
      )}
    </div>
  )
}
