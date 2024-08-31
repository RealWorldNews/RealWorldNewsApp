import { prisma } from "@/lib/prisma";
import { Article } from "../types/article";
import { revalidatePath } from "next/cache";

export async function getArticles(): Promise<Article[]> {
  try {
    const articles = await prisma.article.findMany({
      orderBy: {
        id: "asc",
      },
    });
    await prisma.$disconnect();
    return articles;
  } catch (error) {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

export async function getArticle(slug: string): Promise<Article> {
  try {
    const article = await prisma.article.findUnique({
      where: {
        slug: slug,
      },
    });
    await prisma.$disconnect();
    if (article === null) {
      throw new Error(`Article with slug '${slug}' not found.`);
    }
    return article;
  } catch (error) {
    console.error(error);
    await prisma.$disconnect();
    throw error; // Rethrow the error instead of process.exit
  }
}

// import { Article } from "../types/article";
// import cheerio from "cheerio";
// import axios from "axios";
// import puppeteer from "puppeteer";

// const baseUrl = "https://www.aljazeera.com";

// export async function scrapeArticles() {
//   console.log(`Scraping data from ${baseUrl} ...`);
//   const browser = await puppeteer.launch();
//   const page = await browser.newPage();
//   await page.goto(baseUrl, { waitUntil: "networkidle2" });

//   // Extract the first 12 article links
//   const articleLinks = await page.evaluate(() => {
//     const links: string[] = [];
//     const articleElements = document.querySelectorAll('.three-col-layout__stories article a.u-clickable-card__link');
//     articleElements.forEach((element) => {
//       const href = (element as HTMLAnchorElement).href; // Type assertion
//       if (href) links.push(href);
//     });
//     return links;
//   });

//   const articles = [];
//   for (const link of articleLinks) {
//     const articleDetails = await scrapeArticleDetails(browser, link);
//     articles.push(articleDetails);
//   }

//   await browser.close();
//   console.log(`Found ${articles.length} articles.`);
//   return articles;
// }

// async function scrapeArticleDetails(browser, articleUrl) {
//   const page = await browser.newPage();
//   await page.goto(articleUrl, { waitUntil: "networkidle2" });

//   const headline = await page.$eval("h1", (el) => el.innerText);
//   const body = await page.$eval(".wysiwyg", (el) => el.innerText);

//   let media = await extractMainImage(page);

//   // Extract additional images within the body
//   const bodyImages = await page.evaluate(() => {
//     const images = Array.from(document.querySelectorAll('.wysiwyg img'));
//     return images.map(img => (img as HTMLImageElement).src);
//   });

//   // Concatenate all images' URLs, including main and body images
//   const allImages = [media, ...bodyImages].filter(url => url).join(', ');

//   const article = {
//     headline,
//     slug: articleUrl.replace(baseUrl, ""),
//     body,
//     media: allImages,
//     date: new Date(),
//   };

//   await page.close();
//   return article;
// }

// async function extractMainImage(page: any): Promise<string> {
//     try {
//       const mediaSelector = '.featured-media__image-wrap img';
//       return await page.$eval(mediaSelector, (img: Element) => (img as HTMLImageElement).src);
//     } catch (error) {
//       console.log('Main image not found, using fallback.');
//       return "/"; // or a fallback URL/image you'd prefer
//     }
//   }
