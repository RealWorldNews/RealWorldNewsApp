import {getArticle} from '@/lib/articles';
import classes from './page.module.css'
import Image
 from 'next/image';
interface ArticleDetailParams {
    params: {
        slug: string;
    }
}
export default function ArticleDetailPage({ params }: ArticleDetailParams) {
    const article = getArticle(params.slug);

    return (
        <>
        <header className={classes.header}>
        <div className={classes.image}>
          <Image
            src={article.media}
            alt={article.headline}
            fill
          />
        </div>
        <div className={classes.headerText}>
          <h1>{article.headline}</h1>
          <p className={classes.summary}>{article.summary}</p>
        </div>
      </header>
      <main>
        <p
          className={classes.instructions}
          dangerouslySetInnerHTML={{
            __html: article.body,
          }}
        ></p>
      </main>
        </>)
}