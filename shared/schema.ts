import { pgTable, text, serial, integer, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const articles = pgTable("articles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  source: text("source"),
  url: text("url"),
  content: text("content").notNull(),
  biasScore: integer("bias_score").notNull(),
  biasAnalysis: text("bias_analysis"),
  neutralText: text("neutral_text"),
  analyzedAt: timestamp("analyzed_at").defaultNow().notNull(),
  biasedPhrases: json("biased_phrases").$type<Array<BiasedPhrase>>()
});

export const insertArticleSchema = createInsertSchema(articles).pick({
  title: true,
  source: true,
  url: true,
  content: true,
  biasScore: true,
  biasAnalysis: true,
  neutralText: true,
  biasedPhrases: true,
});

export type BiasedPhrase = {
  text: string;
  explanation: string;
};

export type ArticleAnalysisRequest = {
  url?: string;
  text?: string;
};

export type InsertArticle = z.infer<typeof insertArticleSchema>;
export type Article = typeof articles.$inferSelect;

export type SourceComparisonRequest = {
  topic: string;
  sources: string[];
};

export type SourceComparisonResult = {
  source: string;
  headline: string;
  biasScore: number;
  keyNarrative: string;
  contentAnalysis: string[];
};
