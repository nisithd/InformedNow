import { Schema, model, Document } from "mongoose";

export interface LLMContext {
  preferenceString: string;
  categoryCount: number;
  prompt: string;
}

export interface IUserPreference extends Document {
  userId: string;
  categories: string[];
  createdAt: Date;
  updatedAt: Date;
  llmContext: LLMContext;
}

const UserPreferenceSchema = new Schema<IUserPreference>(
  {
    userId: { type: String, required: true, unique: true },
    categories: { type: [String], default: [] },
    llmContext: {
      preferenceString: { type: String, default: "" },
      categoryCount: { type: Number, default: 0 },
      prompt: { type: String, default: "User interests: None selected" },
    },
  },
  { timestamps: true }
);

export const UserPreference = model<IUserPreference>(
  "UserPreference",
  UserPreferenceSchema
);
