import styles from './ParkingSheet.module.css'
import { TelePLogo, EasyParkLogo } from './AppLogos'

function Row({ label, value }) {
  if (!value) return null
  return (
    <div className={styles.row}>
      <span className={styles.label}>{label}</span>
      <span className={styles.value}>{value}</span>
    </div>
  )
}

function AppRow({ logo, number }) {
  if (!number) return null
  return (
    <div className={styles.appRow}>
      {logo}
      <span className={styles.appNumber}>{number}</span>
    </div>
  )
}

export default function ParkingSheet({ feature, onClose }) {
  if (!feature) return null

  const p = feature.properties
  const avgift = p.Taxa_avgbeltid && !['fri','gr_oreg'].includes(p.Taxa_avgbeltid) ? `${p.Taxa_avgbeltid} kr/tim` : null
  const avgiftOvrig = p.Taxa_ovrig_tid ? `${p.Taxa_ovrig_tid} kr/tim (övrig tid)` : null
  const typeLabel = p._type === 'pr' ? 'Park & Ride' : p._type === 'priv' ? 'Privat parkering' : p._type === 'stad' ? 'Kommunal parkering' : null
  const platstyp = p.Parkeringsplatstyp === 'gatum_P' ? 'Gatumarkerad parkering' : p.Parkeringsplatstyp === 'kvart_P' ? 'Kvarters-/däcksparkering' : null

  return (
    <>
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.sheet}>
        <div className={styles.handle} />

        <div className={styles.header}>
          <div className={styles.pBadge}>P</div>
          <div>
            <h2 className={styles.title}>{p.Namn}</h2>
            {p.Antal_plats
              ? <p className={styles.subtitle}>{[typeLabel, `${p.Antal_plats} platser`].filter(Boolean).join(' · ')}</p>
              : typeLabel && <p className={styles.subtitle}>{typeLabel}</p>
            }
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Stäng">✕</button>
        </div>

        <div className={styles.body}>
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Avgiftstider</h3>
            <Row label="Vardagar" value={p.Avgbeltid_vardag} />
            <Row label="Lör/helg" value={p.Avgbeltid_vard_helg} />
            <Row label="Helgdagar" value={p.Avgbeltid_helg} />
          </div>

          {(platstyp || p.Kom_ext) && (
            <div className={styles.section}>
              <Row label="Typ" value={platstyp} />
              <Row label="Operatör" value={p.Kom_ext} />
            </div>
          )}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Taxa</h3>
            <Row label="Avgiftstid" value={avgift} />
            <Row label="Övrig tid" value={avgiftOvrig} />
            <Row label="Maxtid" value={p.Tid_avgbeltid} />
          </div>

          {(p.Tele_P_nr || p.EasyPark_nr) && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Betala med app</h3>
              <AppRow logo={<TelePLogo />} number={p.Tele_P_nr} />
              <AppRow logo={<EasyParkLogo />} number={p.EasyPark_nr} />
            </div>
          )}
          {p.Kom_ext && (
            <div className={styles.section}>
              <p style={{ fontSize: 13, color: '#555', lineHeight: 1.5, margin: 0 }}>{p.Kom_ext}</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
