# InformedNow

A centralized platform where users can access the latest news article headlines, along with getting AI based summaries of the articles and historical context. To use the historical context feature, users can select part of the text that makes up the article description. The AI summaries are generated based off the description as well. The app fetches over 1000 articles per day, from numerous sources in over 100 countries. Users can define their interests when first signing up, and at any point afterwards. These preferences are used to personalize the feed and find articles that align with the user’s interests. Additionally users can view an interactive globe where some of the latest headlines for many countries will appear.

## Third-Party APIs Used:

• NewsData.io API – For fetching news articles and headlines

• Google Gemini API – For AI-powered article summarization and historical context generation

• Gmail SMTP API – For sending email newsletters and welcome emails via Nodemailer

• MongoDB – As the primary database service for data storage

• Express Session with MongoDB Store – For user session management and authentication

• GitHub OAuth API – For enabling secure third-party login using GitHub accounts

• Nominatim API - For fetching geographic data based on text 


## API Integration Flow:

• NewsData.io API → Fetches articles → Stores in MongoDB

• Google Gemini API → Generates summaries → Returns to frontend

• Gmail SMTP API → Sends newsletters → Delivers to users

• GitHub OAuth API → Authenticates users → Creates or finds user in database → Generates session

• MongoDB → Stores users, articles, preferences → Serves application data

• Nominatim API -> Sends longitude and latitude coordinates based on search-> displayed on 3D interactive globe 


## Rate Limited APIs:

• Google Gemini API – Free tier usage limits (manual summary buttons added)

• NewsData.io API – Request limits based on free subscription plan (200 per day, max 30 per 15 minutes)

• Gmail SMTP API – 500 emails/day limit for free Gmail accounts

• GitHub OAuth API – Rate limits based on GitHub API usage (login endpoints)

•  Nominatim API – Rate limits based on number of requests, limit of 1 request per second






