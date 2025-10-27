
# InformedNow Project Proposal
InformedNow is a news/information aggregation website.

## InformedNow 
InformedNow is a web application that aggregates and simplifies news from multiple sources.
It summarizes articles, identifies political biases, and allows users to filter news by time, topic, and location.
The purpose of InformedNow is to help users access clear, relevant, concise, trending, contextualized, 
and unbiased information/news efficiently.

## Beta Version Features
- Users can have news articles summarized
  - This will be done via backend that communicates with an LLM which devs host locally
- Users can allow or reject user location being given, if given then the website will display news most relevant to 
the user based on their location data (within a radius of the user’s preference)
  - The browser will request “Allow location” call and the user can click allow or reject
- Users will choose their news preferences upon account registration using bubbles 
(such as news, politics, cooking, sports, gaming, pop culture, entertainment, gossip etc.), and this can be changed at 
any time in the User's settings page
- Users can have any article summarized by AI through web scrapers
    - Web scrape, have AI summarize
- Users can click the “Add context” button in every news summary to see historical context relating to the article for 
more context
- Users will see a bias indicator on every news article on its political bias on a left/right political spectrum.
    - Done using the locally hosted LLM
- Users can access an interactive map and view news by location by clicking on bubbles of headlines with an image which 
will expand once clicked on

## Final Version Additional Features
- Users can sign up either through 3rd party auth (like google) or username/password
- Users can sign in
- Users can make comments
- Users can like/dislike articles and comments
- Users can change the UI to night mode or light mode
- Users can report comments or posts for violating terms of service
- Users can report bugs
- Users can choose to receive weekly newsletters on the latest most relevant news that week, personalized to cater to 
their preferences
- Users can view different types of news by choosing the current news section via the headbar which contains the 
different types of news (e.g. sports, political etc.)
- User can view headline section showing current top 10/25 most searched news topics in the world with links to articles
- User can view tags/badges like trending, controversial etc. on news articles

## Technology Stack will include:
- React/Next.js for the Frontend
- Express.js for the Backend
- MongoDB NoSQL Database 

## Top 5 Technical Challenges:
- Hosting LLM locally
    - By hosting an LLM locally, we will have greater control over what data will be processed, and which models will 
      be used. Another reason is to avoid per API request fees, which would be costly otherwise (given the 
      frequency/number of calls the app relies on). Allowing the backend to make API calls to the LLM will prove to be 
      difficult. 

- Getting Historical data through Wikipedia API
    - Documentation and structure are somewhat complex, so we will need some time to figure it out. When it comes to 
      actually making requests, Wikipedia has rate limits on API calls, so we need to carefully manage the 
      frequency of making requests.
- Web scraping
  - There is the possibility of getting IP banned if we make too many requests, which compromises a main source of data.
    Some news websites have a paywall, or require login, which is something we need to find a workaround for. CAPTCHAs 
    are another issue and could prevent getting data from certain websites, since they require a visitor to manually 
    interact with whatever the presented challenge is.
- Building an interactive spatial news Map
    - We need to figure out how exactly we want to display the map, what sorts of resources it will take, and how we 
      want it to update dynamically. Handling frame rate to ensure it is smooth for users, and rendering in 3D (which 
      is something we have not worked with before) will definitely be challenging.
- Adding an “Add Context” button for every article or article summary
    - We need to figure out how to process the summary data for each article and use that to get information using the 
      Wikipedia API. We need to split up the summary points that require context in such a way that we can minimize the 
      number of API calls made, and prevent any issues brought upon by rate limits. There needs to be enough of a 
      balance so that users don’t experience excessive loading times, but the context added still provides enough 
      useful information.