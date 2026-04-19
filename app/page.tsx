import ArticleGrid from "@/components/articles/article-grid";
import { Article } from "../types/article";
import classes from "./page.module.css";
import { getArticles } from "@/lib/articles";

export const dynamic = 'force-dynamic';

export default async function Home() {
  const articles: Article[]= await getArticles();

  return (
    <main className={classes.header}>
      <ArticleGrid articles={articles} />
    </main>
  );
}
