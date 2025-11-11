import mongoose, { Schema, Document } from "mongoose";

export interface IArticle extends Document {
  title: string;
  description?: string;
  url: string;
  image_url?: string;
  country: string[];
  language: string;
  source_id?: string;
  published_at?: string;
  fetchedAt: Date;
}

const ArticleSchema: Schema = new Schema({
  title: { type: String, required: true },
  description: String,
  url: { type: String, required: true, unique: true },
  image_url: String,
  country: [String],
  language: String,
  source_id: String,
  published_at: String,
  fetchedAt: { type: Date, default: Date.now },
});

export const Article = mongoose.model<IArticle>("Article", ArticleSchema);
