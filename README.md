# InformedNow

## Links

> Provide the link to your deployed application. Please make sure the link works.
- Deployed URL:
https://project-informednow.amazingcloud.space/


> Provide the link to your youtube video. Please make sure the link works.
- Video URL: https://youtu.be/jfxig72KA10

## Project Description

> Provide a detailed description of your app
Our app is a centralized platform where users can access the latest news article headlines, along with getting AI based summaries of the articles and historical context. The app fetches over 1000 articles per day, from numerous sources in over 100 countries. Users can define their interests when first signing up, and at any point afterwards. These preferences are used to personalize the feed and find articles that align with the user’s interests. Additionally users can view an interactive globe where some of the latest headlines for many countries will appear.

## Development

> Leaving deployment aside, explain how the app is built. Please describe the overall code design and be specific about the programming languages, framework, libraries and third-party api that you have used.

For the code design we used what we have learned in lecture and mixed it with the documentation from the different APIs we’ve tried to combine our knowledge from both in order to create a well-implemented smoothly running application.
We used React Js for the frontend specifically, next js, and we use node js for the backend. We used tailwind for styling, and mongo db for the database.

Here are the third-party APIs used in your InformedNow project as dot points:

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

## Deployment

> Explain how you have deployed your application.
For our deployment setup, we are using a docker compose configuration. We use jwilder/nginx-proxy to act as an automated reverse proxy between clients and our server. It forwards requests to either the acme-companion for SSL certificates or the frontend-proxy which forwards requests to the frontend, backend, or localgpt docker containers. 

## Challenges

>What is the top 3 most challenging things that you have learned/developed for you app? Please restrict your answer to only three items. 

Adding security was a big challenge while working with many different kinds of API and took a long time.
Being able to create a working interactive map was something completely new that we had to learn how to do, there are many difficulties such as the current offset to use, how many articles to fetch to maximize 
Fetching articles based on criteria required us to think about how we ingested data from the external API, particularly how far we could go with using the existing attributes from the API response.

## Contributions

> Describe the contribution of each team member to the project. Please provide the full name of each team member (but no student number).

Rohithkumar Sridharan
- User preferences, sign in, sign up authentication, 3rd party authentication via Github, ui optimization, and generally styling and ui for home page, landing page and sign in, sign up pages. Attempted to do weekly news letter emails.

Devansh Patel
-Docker configuration file, I added another reverse proxy for the frontend and backend containers
-Interactive 3D globe using Nominatim API
- Added Historical Context button
- Added the get ai summary button
- Did the Gemini Api aspects

Nisith Desilva
- Backend structure/typescript setup
- Article fetching using newsdata API
- News Feed fetching using user preferences
- Pagination on frontend and styling

## One more thing? 

> Any additional comment you want to share with the course staff

I wish we had more time, maybe less homeworks and more time on the assignments/project since the assignment knowledge was used extensively during the project.






