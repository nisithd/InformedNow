import { IArticle } from '../models/Article';

interface NewsletterData {
  username: string;
  articles: IArticle[];
  isWelcome?: boolean;
}

// Helper type for lean documents
type LeanArticle = IArticle & { _id: string };

export function generateNewsletterHTML({ username, articles, isWelcome = false }: NewsletterData): string {
  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const headerText = isWelcome 
    ? `Welcome to InformedNow, ${username}!` 
    : `Your Weekly News Digest`;

  const subheaderText = isWelcome
    ? `Here are today's top headlines to get you started:`
    : `Top headlines for the week of ${currentDate}`;

  // Generate article cards
  const articleCards = articles.map(article => {
    // Handle both regular IArticle and lean documents
    const articleId = (article as any)._id ? (article as any)._id.toString() : (article as any).id;
    const imageUrl = article.image_url;
    const title = article.title;
    const description = article.description;
    const url = article.url;
    const sourceId = article.source_id;

    return `
    <tr>
      <td style="padding: 20px 0;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          ${imageUrl ? `
          <tr>
            <td>
              <img src="${imageUrl}" alt="${title}" style="width: 100%; height: 200px; object-fit: cover; display: block;" />
            </td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding: 20px;">
              <h2 style="margin: 0 0 10px 0; color: #1a1a1a; font-size: 20px; line-height: 1.4;">
                <a href="${url}" style="color: #1a1a1a; text-decoration: none;">${title}</a>
              </h2>
              ${description ? `
              <p style="margin: 10px 0; color: #666666; font-size: 14px; line-height: 1.6;">
                ${description}
              </p>
              ` : ''}
              <table cellpadding="0" cellspacing="0" border="0" style="margin-top: 15px;">
                <tr>
                  <td>
                    <a href="${url}" style="display: inline-block; padding: 10px 20px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 600;">
                      Read More →
                    </a>
                  </td>
                  ${sourceId ? `
                  <td style="padding-left: 15px; color: #999999; font-size: 12px;">
                    Source: ${sourceId}
                  </td>
                  ` : ''}
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `}).join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${headerText}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f3f4f6; padding: 40px 0;">
    <tr>
      <td align="center">
        <table cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; width: 100%;">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%); padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700;">
                📰 InformedNow
              </h1>
              <p style="margin: 10px 0 0 0; color: #e0e7ff; font-size: 16px;">
                Clear, Relevant, Unbiased News
              </p>
            </td>
          </tr>

          <!-- Welcome Message -->
          <tr>
            <td style="background-color: #ffffff; padding: 30px;">
              <h2 style="margin: 0 0 10px 0; color: #1a1a1a; font-size: 24px;">
                ${headerText}
              </h2>
              <p style="margin: 0; color: #666666; font-size: 14px;">
                ${subheaderText}
              </p>
            </td>
          </tr>

          <!-- Articles -->
          <tr>
            <td style="background-color: #f9fafb; padding: 0 30px;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                ${articleCards}
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #ffffff; padding: 30px; text-align: center; border-radius: 0 0 12px 12px;">
              <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px;">
                You're receiving this email because you opted in to weekly newsletters from InformedNow.
              </p>
              <p style="margin: 0; color: #999999; font-size: 12px;">
                © ${new Date().getFullYear()} InformedNow. All rights reserved.
              </p>
              <p style="margin: 10px 0 0 0; color: #999999; font-size: 12px;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/preferences" style="color: #2563eb; text-decoration: none;">
                  Manage preferences
                </a>
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

// Generate plain text version as fallback
export function generateNewsletterText({ username, articles, isWelcome = false }: NewsletterData): string {
  const headerText = isWelcome 
    ? `Welcome to InformedNow, ${username}!` 
    : `Your Weekly News Digest`;

  const articlesText = articles.map((article, index) => `
${index + 1}. ${article.title}
${article.description || ''}
Read more: ${article.url}
${article.source_id ? `Source: ${article.source_id}` : ''}
  `).join('\n---\n');

  return `
${headerText}

${articlesText}

---
You're receiving this email because you opted in to weekly newsletters from InformedNow.
© ${new Date().getFullYear()} InformedNow. All rights reserved.
  `.trim();
}