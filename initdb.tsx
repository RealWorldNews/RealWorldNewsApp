const sql = require("better-sqlite3");
const db = sql("articles.db");

interface Article {
  id?: string;
  slug: string;
  headline: string;
  summary: string;
  body: string;
  location: string;
  media: string;
  date: Date;
}

const dummyArticles: Article[] = [
  {
    slug: "articl01",
    headline: "US top diplomat holds talks in Israel as Netanyahu vows Rafah invasion",
    summary: "Gunmen in combat fatigues",
    body: "Following a meeting with visiting US Secretary of State Antony Blinken on Friday, Netanyahu said he told the US official there was no other way to defeat Hamas.",
    location: "Gaza",
    media: "https://www.aljazeera.com/wp-content/uploads/2024/03/2024-03-22T083006Z_1718081939_RC2WQ6A6Z8Z6_RTRMADP_3_ISRAEL-PALESTINIANS-BLINKEN-1711122687.jpg?resize=770%2C513&quality=80",
    date: new Date(),
},
{
    slug: "article3",
    headline: "How Israeli settlers are expanding illegal outposts amid Gaza war",
    summary: "An investigation by Al Jazeera shows how Israeli settlers have been expanding in the occupied West Bank at unprecedented rate, since Israel’s war on Gaza began.",
    body: "An investigation by Al Jazeera shows how Israeli settlers have been expanding in the occupied West Bank at unprecedented rate, since Israel’s war on Gaza began.",
    location: "Gaza",
    media: "https://ajmn-aje-vod.akamaized.net/media/v1/pmp4/static/clear/665003303001/d919508e-f412-49a7-8f22-6ca3f7e32717/2bf1cbe9-cc16-4e86-ab67-a5fdd8c18815/main.mp4",
    date: new Date(),
},
{
    slug: "article2",
    headline: "Gunfire and explosion reported at concert hall in Russia’s Moscow",
    summary: "Gunmen in combat fatigues burst into a big concert hall in Moscow and fired automatic weapons at the crowd, causing deaths and injuries, Russian media has reported.",
    body: "Gunmen in combat fatigues burst into a big concert hall in Moscow and fired automatic weapons at the crowd, causing deaths and injuries, Russian media has reported.",
    location: "Russia",
    media: "https://www.aljazeera.com/wp-content/uploads/2024/03/2024-03-22T184006Z_375273691_RC26R6A1WENR_RTRMADP_3_RUSSIA-SHOOTING-1711132877.jpg?resize=770%2C513&quality=80",
    date: new Date(),
}
];

db.prepare(
  `
   CREATE TABLE IF NOT EXISTS articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    headline TEXT NOT NULL,
    summary TEXT NOT NULL,
    body TEXT NOT NULL,
    location TEXT NOT NULL,
    media TEXT NOT NULL,
    date TEXT NOT NULL
    )
`
).run();

async function initData(): Promise<void> {
  const stmt = db.prepare(`
      INSERT INTO articles VALUES (
         null,
         @slug,
         @headline,
         @summary,
         @body,
         @location,
         @media,
         @date
      )
   `);

   for (const article of dummyArticles) {
    // Convert the date to an ISO string format
    const articleWithIsoDate = {
      ...article,
      date: article.date.toISOString(),
    };

    stmt.run(articleWithIsoDate);
  }
}


initData().catch(console.error);
