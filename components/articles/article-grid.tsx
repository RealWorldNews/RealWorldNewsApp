import { Article } from "@/types/article";
import ArticleItem from "./article-item";
import classes from "./article-grid.module.css";
interface ArticleGridProps {
  articles: Article[];
}

export default function ArticleGrid({ articles }: ArticleGridProps) {
  return (
    <ul className={classes.article}>
      {articles.map((a) => (
        <ArticleItem key={a.id} {...a} />
      ))}
    </ul>
  );
}
