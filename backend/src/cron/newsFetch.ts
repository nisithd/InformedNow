import cron from "node-cron";
import axios from "axios";
import { Article } from "../models/Article";

const NEWS_API_KEY = process.env.NEWSDATA_API_KEY;
let API_URL = `https://newsdata.io/api/1/latest?apikey=${NEWS_API_KEY}&country=us,ca&language=en`;
const API_URLs = {
  business: `https://newsdata.io/api/1/latest?apikey=${NEWS_API_KEY}&qInMeta=NOT%20entertainment&language=en&category=business&excludecountry=in&prioritydomain=top&removeduplicate=1&size=10`,
  crime: `https://newsdata.io/api/1/latest?apikey=${NEWS_API_KEY}&qInMeta=NOT%20obituaries&language=en&category=crime&prioritydomain=medium&removeduplicate=1&size=10`,
  entertainment: `https://newsdata.io/api/1/latest?apikey=${NEWS_API_KEY}&language=en&category=entertainment&excludecountry=in&prioritydomain=top&removeduplicate=1&size=10`,
  environment: `https://newsdata.io/api/1/latest?apikey=${NEWS_API_KEY}&qInMeta=NOT%20weather&language=en&category=environment&prioritydomain=medium&removeduplicate=1&size=10`,
  food: `https://newsdata.io/api/1/latest?apikey=${NEWS_API_KEY}&language=en&category=food&excludecountry=in&prioritydomain=medium&removeduplicate=1&size=10`,
  gaming: `https://newsdata.io/api/1/latest?apikey=${NEWS_API_KEY}&qInMeta=gaming%20OR%20video%20games%20OR%20esports&language=en&category=technology&prioritydomain=low&removeduplicate=1&size=10`,
  health: `https://newsdata.io/api/1/latest?apikey=${NEWS_API_KEY}&qInMeta=NOT%20obituaries&language=en&category=health&prioritydomain=medium&removeduplicate=1&size=10`,
  politics: `https://newsdata.io/api/1/latest?apikey=${NEWS_API_KEY}&language=en&category=politics&prioritydomain=top&removeduplicate=1&size=10`,
  science: `https://newsdata.io/api/1/latest?apikey=${NEWS_API_KEY}&language=en&category=science&excludecountry=in&prioritydomain=top&removeduplicate=1&size=10`,
  sports: `https://newsdata.io/api/1/latest?apikey=${NEWS_API_KEY}&language=en&category=sports,breaking&prioritydomain=medium&removeduplicate=1&size=10`,
  technology: `https://newsdata.io/api/1/latest?apikey=${NEWS_API_KEY}&qInMeta=NOT%20sports&language=en&category=technology&prioritydomain=top&removeduplicate=1&size=10`,
  tourism: `https://newsdata.io/api/1/latest?apikey=${NEWS_API_KEY}&language=en&category=tourism&prioritydomain=medium&removeduplicate=1&size=10`,
  world: `https://newsdata.io/api/1/latest?apikey=${NEWS_API_KEY}&language=en&category=world&prioritydomain=top&removeduplicate=1&size=10`,
}
const excluded_URLs = {
  business: `https://newsdata.io/api/1/latest?apikey=${NEWS_API_KEY}&qInMeta=NOT%20entertainment&language=en&category=business&prioritydomain=medium&removeduplicate=1&size=10`,
  entertainment: `https://newsdata.io/api/1/latest?apikey=${NEWS_API_KEY}&language=en&category=entertainment&prioritydomain=top&removeduplicate=1&size=10`,
  science: `https://newsdata.io/api/1/latest?apikey=${NEWS_API_KEY}&qInMeta=NOT%20obituaries&language=en&category=science&prioritydomain=medium&removeduplicate=1&size=10`,

}

// helper to pause between requests if paginating
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const retrieve = async (urls: Object) => {
  for (const [category, url] of Object.entries(urls)) {
      try {
        let totalFetched = 0;

        const res = await axios.get(url);
        await sleep(1000);

        const articles = res.data.results || [];
        console.log(`Fetched ${articles.length} articles from category: ${category}`);

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
              $addToSet: {
                categories: category,
              },
            },
            { upsert: true }
          );

          totalFetched += articles.length;

          await sleep(1000); // small delay between pages to avoid hitting rate limit
        }
        

        console.log(`✅ Completed run. Total fetched: ${totalFetched}`);
      } catch (error) {
        console.error("❌ Error fetching news:", error);
      }
    }
}

export function fetchNews() {

  // run baseline retrieve every 3 hours
  cron.schedule("0 */3 * * *", async () => {
    console.log("🕒 Running news fetcher at", new Date().toISOString());
    
    await retrieve(API_URLs);
  });
  
  // run retrieve for excluded every 12 hours
  cron.schedule("30 */12 * * *", async () => {
    console.log("🕒 Running news fetcher at", new Date().toISOString());

    await retrieve(excluded_URLs);
  });
};
