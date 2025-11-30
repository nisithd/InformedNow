import cron from "node-cron";
import { User } from "../models/User";
import { Article, IArticle } from "../models/Article";
import { UserPreference } from "../models/UserPreference";
import { sendEmail } from "../utils/emailService";
import { generateNewsletterHTML, generateNewsletterText } from "../utils/newsletterGenerator";

export function startWeeklyNewsletter() {
  // Run every Monday at 8:00 AM
  // Cron format: minute hour day-of-month month day-of-week
  // '0 8 * * 1' = At 8:00 AM on Monday
  cron.schedule("0 8 * * 1", async () => {
    console.log("📰 Running weekly newsletter job at", new Date().toISOString());
    await sendWeeklyNewsletters();
  });

  console.log("✅ Weekly newsletter cron job scheduled (Every Monday at 8:00 AM)");
}

async function sendWeeklyNewsletters() {
  try {
    // Find all users who opted in to newsletters
    const users = await User.find({ newsletterOptIn: true });
    
    if (users.length === 0) {
      console.log("ℹ️ No users opted in to newsletters");
      return;
    }

    console.log(`📧 Sending newsletters to ${users.length} users...`);

    // Get articles from the past week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    let successCount = 0;
    let failCount = 0;

    for (const user of users) {
      try {
        // Get user preferences
        const userPrefs = await UserPreference.findOne({ userId: user._id });
        
        let articles;
        
        if (userPrefs && userPrefs.categories && userPrefs.categories.length > 0) {
          // Fetch articles from the past week, sorted by recency
          articles = await Article.find({
            fetchedAt: { $gte: oneWeekAgo }
          })
            .sort({ published_at: -1, fetchedAt: -1 })
            .limit(10)
            .lean<IArticle[]>(); // Fix: Use generic type with lean()
        } else {
          // If no preferences, send top general headlines
          articles = await Article.find({
            fetchedAt: { $gte: oneWeekAgo }
          })
            .sort({ published_at: -1, fetchedAt: -1 })
            .limit(10)
            .lean<IArticle[]>(); // Fix: Use generic type with lean()
        }

        if (!articles || articles.length === 0) {
          console.log(`⚠️ No articles available for ${user.email}`);
          continue;
        }

        const html = generateNewsletterHTML({
          username: user.username,
          articles,
          isWelcome: false,
        });

        const text = generateNewsletterText({
          username: user.username,
          articles,
          isWelcome: false,
        });

        const success = await sendEmail({
          to: user.email,
          subject: `Your Weekly News Digest from InformedNow 📰`,
          html,
          text,
        });

        if (success) {
          // Update lastNewsletterSent
          user.lastNewsletterSent = new Date();
          await user.save();
          successCount++;
          console.log(`✅ Newsletter sent to ${user.email}`);
        } else {
          failCount++;
          console.log(`❌ Failed to send newsletter to ${user.email}`);
        }

        // Add a small delay between emails to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        failCount++;
        console.error(`❌ Error sending newsletter to ${user.email}:`, error);
      }
    }

    console.log(`📊 Newsletter job complete: ${successCount} sent, ${failCount} failed`);
    
  } catch (error) {
    console.error("❌ Error in weekly newsletter job:", error);
  }
}

// Export for manual testing
export { sendWeeklyNewsletters };