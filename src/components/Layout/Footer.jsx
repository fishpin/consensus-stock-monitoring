import { APP_NAME } from '../../constants/app';
import styles from './Footer.module.css';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <p className={styles.text}>
        © {year} {APP_NAME} — for educational purposes only. Not financial advice.
      </p>
    </footer>
  );
}
