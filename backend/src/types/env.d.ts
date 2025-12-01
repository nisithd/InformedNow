declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: "dev" | "prod";
    PORT?: string;
    SESSION_SECRET?: string;
    
    // Email Configuration
    EMAIL_USER?: string;
    EMAIL_PASSWORD?: string;
    
    // Frontend & Backend URLs
    FRONTEND_URL?: string;
    BACKEND_URL?: string;
    
    // GitHub OAuth
    GITHUB_CLIENT_ID?: string;
    GITHUB_CLIENT_SECRET?: string;
    
    // APIs
    NEWSDATA_API_KEY?: string;
    GEMINI_API_KEY?: string;
  }
}