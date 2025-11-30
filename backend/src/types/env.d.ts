declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: "dev" | "prod";
    PORT?: string;
    SESSION_SECRET?: string;
    
    // Email Configuration
    EMAIL_USER?: string;
    EMAIL_PASSWORD?: string;
    
    // Frontend
    FRONTEND_URL?: string;
    
    // APIs
    NEWSDATA_API_KEY?: string;
    GEMINI_API_KEY?: string;
  }
}