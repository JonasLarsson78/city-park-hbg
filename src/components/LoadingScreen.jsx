import styles from './LoadingScreen.module.css'

export default function LoadingScreen() {
  return (
    <div className={styles.container}>
      <div className={styles.badge}>P</div>
      <p className={styles.text}>Laddar parkeringsdata…</p>
    </div>
  )
}
