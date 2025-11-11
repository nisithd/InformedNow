import cron from "node-cron";
import axios from "axios";
import { Article } from "../models/Article";

const NEWS_API_KEY = process.env.NEWSDATA_API_KEY;
let API_URL = `https://newsdata.io/api/1/latest?apikey=${NEWS_API_KEY}&country=us,ca&language=en`;

// helper to pause between requests if paginating
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function fetchNews() {
    console.log(API_URL);
  cron.schedule("* */1 * * *", async () => {
    console.log("🕒 Running news fetcher at", new Date().toISOString());
  try {
    let pageCount = 1;
    let page = "";
    let totalFetched = 0;

    while (pageCount <= 2) { // fetch 3 pages (~30 articles per run)
      const res = await axios.get(API_URL);

      const articles = res.data.results || [];
      console.log(`Fetched ${articles.length} articles on page ${page}`);

      for (const art of articles) {
        await Article.updateOne(
          { url: art.link },
          {
            $setOnInsert: {
              title: art.title,
              description: art.description,
              url: art.link,
              image_url: art.image_url,
              country: art.country,
              language: art.language,
              source_id: art.source_id,
              published_at: art.pubDate,
              fetchedAt: new Date(),
            },
          },
          { upsert: true }
        );
      }

      totalFetched += articles.length;

      // If API includes a "nextPage" field, handle it dynamically
      if (!res.data.nextPage) break;
      pageCount++;
      page = res.data.nextPage;
      API_URL = `https://newsdata.io/api/1/latest?apikey=${NEWS_API_KEY}&country=us,ca&language=en&page=${page}`;
      await sleep(1000); // small delay between pages to avoid hitting rate limit
    }

    console.log(`✅ Completed run. Total fetched: ${totalFetched}`);
  } catch (error) {
    console.error("❌ Error fetching news:", error);
  }
  });
  
};
