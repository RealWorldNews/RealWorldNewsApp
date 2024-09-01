import { getArticle } from "@/lib/articles";
import classes from "./page.module.css";
import Image from "next/image";
import { notFound } from "next/navigation";
import Video from "@/components/video";
import Link from "next/link";
interface ArticleDetailParams {
  params: {
    slug: string;
  };
}
const isVideo = (media: string): boolean => {
  const videoIndicators = ["video", ".mp4", ".webm", ".ogg"];
  return videoIndicators.some((indicator) => media.includes(indicator));
};

export default async function ArticleDetailPage({
  params,
}: ArticleDetailParams) {
  const article = await getArticle(params.slug);
  const mediaIsVideo = isVideo(article.media);
  const humanReadableDate = new Date(article.date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  if (!article) {
    notFound();
  }

  article.body = article.body.replace(/\n/g, "<br />");

  return (
    <>
      <header className={classes.header}>
        <div className={classes.headerText}>
          <h1>{article.headline}</h1>
          <Link href={article.link}>
            <div className={classes.image}>
              {mediaIsVideo ? (
                <Video media={article.media} />
              ) : (
                <Image src={article.media} alt={article.slug} fill />
              )}
            </div>
          </Link>
          <div className={classes.info}>
            {article.author !== "See article for details" && (
              <p>article by: {article.author}</p>
            )}
            <p>{article.resource}</p>
            <p>{humanReadableDate}</p>
          </div>
        </div>
        <main>
          <p
            className={classes.description}
            dangerouslySetInnerHTML={{
              __html: article.body,
            }}
          ></p>
        </main>
      </header>
    </>
  );
}
