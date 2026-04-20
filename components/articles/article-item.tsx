import classes from "./article-item.module.css";
import Image from "next/image";
import Link from "next/link";
import { Article } from "@/types/article";

export default function ArticleItem({
  slug,
  headline,
  summary,
  location,
  media,
  videoUrl,
  date,
}: Article) {
  const humanReadableDate = new Date(date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
  return (
    <li>
      <article className={classes.article}>
        <Link href={`/articles/${slug}`} className={classes.imageLink}>
          <div className={classes.image}>
            {media && (
              <Image
                src={media}
                alt={slug}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            )}
            {videoUrl && (
              <span className={classes.videoBadge} aria-label="Video">▶ Video</span>
            )}
          </div>
        </Link>
        <header className={classes.header}>
          <Link href={`/articles/${slug}`}>
            <h2>{headline}</h2>
          </Link>
          <div className={classes.meta}>
            {location && <span>{location}</span>}
            <span>{humanReadableDate}</span>
          </div>
        </header>
        {summary && <p className={classes.summary}>{summary}</p>}
        <div className={classes.actions}>
          <Link href={`/articles/${slug}`}>View Details →</Link>
        </div>
      </article>
    </li>
  );
}
