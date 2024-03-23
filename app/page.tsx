import ArticleGrid from "@/components/articles/article-grid";
import { Article } from "../types/article";
import classes from "./page.module.css";
import { getArticles } from "@/lib/articles";


const humanReadableDate = (date: Date) => {
  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
};

export default async function Home() {
  const articles: Article[]= await getArticles();
  console.log(articles.length)

  return (
    <main className={classes.header}>
      <ArticleGrid articles={articles} />
    </main>
  );
}
