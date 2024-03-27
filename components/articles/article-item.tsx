import classes from "./article-item.module.css";
import Video from "../video";
import Image from "next/image";
import Link from "next/link";


interface ArticleItemProps {
  slug: string;
  headline: string;
  summary: string;
  location: string;
  media: string;
  date: Date;
}

const isVideo = (media: string): boolean => {
  const videoIndicators = ["video", ".mp4", ".webm", ".ogg"];
  return videoIndicators.some((indicator) => media.includes(indicator));
};

export default function ArticleItem({
  slug,
  headline,
  summary,
  location,
  media,
  date,
}: ArticleItemProps) {
  const mediaIsVideo = isVideo(media);
  const humanReadableDate = new Date(date).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })
  return (
    <article className={classes.article}>
      <header className={classes.header}>
        <div className={classes.headerText}>
          <h2>{headline}</h2>
          <p>{location}</p>
          <p>{humanReadableDate}</p>
        </div>
          </header>
          <hr/>
        <div className={classes.image}>
          {mediaIsVideo ? (
            <Video media={media} />
            ) : (
              <Image src={media} alt={slug} fill />
              )}
        </div>
      <div className={classes.body}>
        <p className={classes.summary}>{summary}</p>
        <div className={classes.actions}>
          <Link href={`/articles/${slug}`}>View Details</Link>
        </div>
      </div>
    </article>
  );
}
