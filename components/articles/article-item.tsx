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
  author,
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
      <Link href={`/articles/${slug}`} className={classes.card}>
        <article className={classes.article}>
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
          <header className={classes.header}>
            <h2 className={classes.title}>{headline}</h2>
            <div className={classes.meta}>
              {author && <span>By {author}</span>}
              {location && <span>{location}</span>}
              <span>{humanReadableDate}</span>
            </div>
          </header>
          {summary && <p className={classes.summary}>{summary}</p>}
          <div className={classes.actions} aria-hidden="true">
            View Details →
          </div>
        </article>
      </Link>
    </li>
  );
}
