import ArticleGrid from "@/components/articles/article-grid";
import { Article } from "../types/article";
import classes from "./page.module.css";
import { getArticles } from "@/lib/articles";
import SearchBar from "@/components/search/search-bar";
import ScrollRestorationWrapper from "@/components/articles/scroll-restoration-wrapper";
import PaginationWrapper from "@/components/ui/pagination/pagination-wrapper"; // Use the new wrapper

interface HomeProps {
  searchParams: { q?: string; page?: string };
}

export default async function Home({ searchParams }: HomeProps) {
  const searchQuery = searchParams.q || "";
  const currentPage = parseInt(searchParams.page || "1", 10);

  // Fetch articles and total number of articles
  const { articles, totalArticles } = await getArticles(searchQuery, currentPage);

  const totalPages = Math.ceil(totalArticles / 10); // Assuming 10 articles per page

  return (
    <ScrollRestorationWrapper>
      <main className={classes.header}>
        <SearchBar initialQuery={searchQuery} />
        {searchQuery && articles.length > 0 && (
          <p className={classes.results}>
            {articles.length} {articles.length === 1 ? "article" : "articles"} found
          </p>
        )}
        <ArticleGrid articles={articles} />
        {searchQuery && articles.length === 0 && (
          <p className={classes.noResults}>No articles found...</p>
        )}
        <PaginationWrapper currentPage={currentPage} totalPages={totalPages} />
      </main>
    </ScrollRestorationWrapper>
  );
}
