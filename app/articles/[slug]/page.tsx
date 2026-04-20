import { getArticle } from "@/lib/articles";
import classes from "./page.module.css";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Video from "@/components/video/video";
import AgeGate from "@/components/articles/age-gate";

const SENSITIVE_SOURCES = new Set(["Borderland Beat"]);

export const revalidate = 60;

interface ArticleDetailParams {
  params: Promise<{
    slug: string;
  }>;
}

export default async function ArticleDetailPage({ params }: ArticleDetailParams) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) notFound();
  const humanReadableDate = new Date(article.date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });

  const paragraphs = article.body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const isSensitive = SENSITIVE_SOURCES.has(article.source);

  const content = (
    <article className={classes.wrap}>
      <Link href="/" className={classes.backLink}>← All articles</Link>

      <header className={classes.head}>
        <h1 className={classes.title}>{article.headline}</h1>
        {article.summary && <p className={classes.summary}>{article.summary}</p>}
        <div className={classes.meta}>
          {article.location && <span>{article.location}</span>}
          <span>{humanReadableDate}</span>
        </div>
      </header>

      {article.videoUrl ? (
        <div className={classes.image}>
          <Video media={article.videoUrl} poster={article.media || undefined} />
        </div>
      ) : article.media ? (
        <div className={classes.image}>
          <Image
            src={article.media}
            alt={article.slug}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 800px"
          />
        </div>
      ) : null}

      <div className={classes.body}>
        {paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>

      {article.sourceUrl && (
        <div className={classes.sourceLinkWrap}>
          <a
            className={classes.sourceLink}
            href={article.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Read the full story on {article.source || "the original source"} →
          </a>
        </div>
      )}
    </article>
  );

  if (isSensitive) {
    return <AgeGate sourceLabel={article.source}>{content}</AgeGate>;
  }
  return content;
}
