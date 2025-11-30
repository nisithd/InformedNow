import { IUser } from '../models/User';
import { Article, IArticle } from '../models/Article';
import { sendEmail } from './emailService';
import { generateNewsletterHTML, generateNewsletterText } from './newsletterGenerator';

export async function sendWelcomeNewsletter(user: IUser): Promise<boolean> {
  try {
    console.log(`📧 Preparing welcome newsletter for ${user.email}...`);

    // Always fetch top 10 articles for welcome email (shows off the feature!)
    const articles = await Article.find()
      .sort({ published_at: -1, fetchedAt: -1 })
      .limit(10)
      .lean<IArticle[]>(); // Fix: Use generic type with lean()

    if (!articles || articles.length === 0) {
      console.log('⚠️ No articles available for welcome newsletter');
      // Still send a welcome email, just without articles
      const html = generateWelcomeOnlyHTML(user.username);
      const text = generateWelcomeOnlyText(user.username);
      
      const success = await sendEmail({
        to: user.email,
        subject: `Welcome to InformedNow, ${user.username}! 🎉`,
        html,
        text,
      });

      if (success) {
        user.lastNewsletterSent = new Date();
        await user.save();
      }
      return success;
    }

    const html = generateNewsletterHTML({
      username: user.username,
      articles,
      isWelcome: true,
    });

    const text = generateNewsletterText({
      username: user.username,
      articles,
      isWelcome: true,
    });

    const success = await sendEmail({
      to: user.email,
      subject: `Welcome to InformedNow, ${user.username}! 🎉`,
      html,
      text,
    });

    if (success) {
      // Update lastNewsletterSent
      user.lastNewsletterSent = new Date();
      await user.save();
      console.log(`✅ Welcome newsletter sent successfully to ${user.email}`);
    }

    return success;
  } catch (error) {
    console.error('❌ Error sending welcome newsletter:', error);
    return false;
  }
}

// Fallback HTML if no articles available
function generateWelcomeOnlyHTML(username: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to InformedNow</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f3f4f6; padding: 40px 0;">
    <tr>
      <td align="center">
        <table cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; width: 100%;">
          <tr>
            <td style="background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%); padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700;">📰 InformedNow</h1>
              <p style="margin: 10px 0 0 0; color: #e0e7ff; font-size: 16px;">Clear, Relevant, Unbiased News</p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #ffffff; padding: 40px 30px; border-radius: 0 0 12px 12px;">
              <h2 style="margin: 0 0 20px 0; color: #1a1a1a; font-size: 24px;">Welcome to InformedNow, ${username}! 🎉</h2>
              <p style="margin: 0 0 15px 0; color: #666666; font-size: 16px; line-height: 1.6;">
                Thank you for joining InformedNow! We're excited to have you on board.
              </p>
              <p style="margin: 0 0 15px 0; color: #666666; font-size: 16px; line-height: 1.6;">
                You'll receive your personalized news digest every week with top headlines based on your interests.
              </p>
              <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.6;">
                Set up your preferences to start getting the news that matters to you!
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" style="display: inline-block; padding: 12px 30px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600;">
                  Get Started →
                </a>
              </div>
              <p style="margin: 20px 0 0 0; color: #999999; font-size: 12px; text-align: center;">
                © ${new Date().getFullYear()} InformedNow. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

// Fallback text if no articles available
function generateWelcomeOnlyText(username: string): string {
  return `
Welcome to InformedNow, ${username}!

Thank you for joining InformedNow! We're excited to have you on board.

You'll receive your personalized news digest every week with top headlines based on your interests.

Set up your preferences to start getting the news that matters to you!

© ${new Date().getFullYear()} InformedNow. All rights reserved.
  `.trim();
}