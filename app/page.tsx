import ArticleGrid from "@/components/articles/article-grid";
import { Article } from "../types/article";
import classes from "./page.module.css";
import { getArticles } from "@/lib/articles";
import SearchBar from "@/components/search/search-bar";

interface HomeProps {
  searchParams: { q?: string };
}

export default async function Home({ searchParams }: HomeProps) {
  const searchQuery = searchParams.q || "";
  const articles: Article[] = await getArticles(searchQuery);

  return (
    <main className={classes.header}>
      <SearchBar initialQuery={searchQuery} />
      {articles.length > 0 ? (
        <div>
          <p className={classes.results}>{articles.length} articles found</p>
          <ArticleGrid articles={articles} />
        </div>
      ) : (
        <p className={classes.noResults}>no articles found...</p>
      )}
    </main>
  );
}
