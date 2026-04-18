import styles from './NewsCard.module.css';

/**
 * News as typography — headline, source, time.
 * No image cards; the text carries the weight.
 * compact prop renders an even tighter inline version.
 */
export default function NewsCard({ article, compact = false }) {
  const published = new Date(article.publishedAt).toLocaleString('en-US', {
    month: 'short',
    day:   'numeric',
    hour:  '2-digit',
    minute: '2-digit',
  });

  return (
    <a
      href={article.url}
      className={compact ? styles.compact : styles.card}
      target="_blank"
      rel="noreferrer"
    >
      <div className={styles.meta}>
        {article.isBreaking && (
          <span className="breaking-dot" />
        )}
        <span className={styles.source}>{article.source}</span>
        <span className={styles.dot}>·</span>
        <time className={styles.time}>{published}</time>
      </div>
      <p className={styles.headline}>{article.headline}</p>
      {!compact && (
        <p className={styles.summary}>{article.summary}</p>
      )}
    </a>
  );
}
