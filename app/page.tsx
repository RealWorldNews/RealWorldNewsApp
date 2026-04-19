import ArticleGrid from "@/components/articles/article-grid";
import { Article } from "../types/article";
import classes from "./page.module.css";
import { getArticles } from "@/lib/articles";
import SearchBar from "@/components/search/search-bar";
import ScrollRestorationWrapper from "@/components/articles/scroll-restoration-wrapper";
import PaginationWrapper from "@/components/ui/pagination/pagination-wrapper"; // Use the new wrapper

export const dynamic = 'force-dynamic';

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
