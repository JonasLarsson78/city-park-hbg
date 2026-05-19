import styles from './FilterSheet.module.css'

const PRICES = ['5', '10', '15', '20']
const APPS = [
  { id: 'telep', label: 'TeleP' },
  { id: 'easypark', label: 'EasyPark' },
]
const TYPES = [
  { id: 'stad',  label: 'Kommunal parkering' },
  { id: 'priv',  label: 'Privat parkering' },
  { id: 'pr',    label: 'Park & Ride' },
]

function Chip({ label, active, onClick }) {
  return (
    <button
      className={`${styles.chip} ${active ? styles.chipActive : ''}`}
      onClick={onClick}
    >
      {label}
    </button>
  )
}

export default function FilterSheet({ filters, onChange, onClose, totalVisible, total }) {
  const toggle = (key, value) => {
    const current = filters[key]
    const next = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value]
    onChange({ ...filters, [key]: next })
  }

  const reset = () => onChange({ prices: [], apps: [], hiddenTypes: [] })
  const hasFilters = filters.prices.length > 0 || filters.apps.length > 0 || filters.hiddenTypes.length > 0

  return (
    <>
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.sheet}>
        <div className={styles.handle} />

        <div className={styles.header}>
          <h2 className={styles.title}>Filter</h2>
          {hasFilters && (
            <button className={styles.resetBtn} onClick={reset}>Rensa</button>
          )}
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Pris per timme</h3>
          <div className={styles.chips}>
            {PRICES.map(p => (
              <Chip
                key={p}
                label={`${p} kr`}
                active={filters.prices.includes(p)}
                onClick={() => toggle('prices', p)}
              />
            ))}
          </div>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Betala med app</h3>
          <div className={styles.chips}>
            {APPS.map(app => (
              <Chip
                key={app.id}
                label={app.label}
                active={filters.apps.includes(app.id)}
                onClick={() => toggle('apps', app.id)}
              />
            ))}
          </div>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Dölj parkeringstyp</h3>
          <div className={styles.chips}>
            {TYPES.map(t => (
              <Chip
                key={t.id}
                label={t.label}
                active={filters.hiddenTypes.includes(t.id)}
                onClick={() => toggle('hiddenTypes', t.id)}
              />
            ))}
          </div>
        </div>

        <div className={styles.footer}>
          <button className={styles.applyBtn} onClick={onClose}>
            Visa {totalVisible} av {total} automater
          </button>
        </div>
      </div>
    </>
  )
}
