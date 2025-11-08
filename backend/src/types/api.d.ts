// src/types/api.d.ts

// Example: response from the LLM service
export interface LLMResponse {
  response: string;
}

// Example: location API endpoint body
export interface LocationRequestBody {
  latitude: number;
  longitude: number;
}

// Example: generic error structure used in responses
export interface ErrorResponse {
  error: string;
}
