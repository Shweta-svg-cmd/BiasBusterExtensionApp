import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { analyzeArticle, compareSources } from "./lib/openai";
import { ArticleAnalysisRequest, insertArticleSchema, SourceComparisonRequest } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes
  app.post("/api/analyze", async (req, res) => {
    try {
      const request: ArticleAnalysisRequest = req.body;
      
      if (!request.url && !request.text) {
        return res.status(400).json({ message: "Either URL or text must be provided" });
      }

      const result = await analyzeArticle(request);
      
      // Store the analyzed article
      const article = await storage.createArticle({
        title: result.title,
        source: result.source,
        url: request.url,
        content: result.content,
        biasScore: result.biasScore,
        biasAnalysis: result.biasAnalysis,
        neutralText: result.neutralText,
        biasedPhrases: result.biasedPhrases,
      });
      
      res.json(article);
    } catch (error) {
      console.error("Error analyzing article:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "An unexpected error occurred" });
    }
  });

  app.get("/api/articles/latest", async (req, res) => {
    try {
      const article = await storage.getLatestArticle();
      if (!article) {
        return res.status(404).json({ message: "No articles found" });
      }
      res.json(article);
    } catch (error) {
      console.error("Error fetching latest article:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "An unexpected error occurred" });
    }
  });

  app.get("/api/articles/recent", async (req, res) => {
    try {
      const articles = await storage.getRecentArticles(5);
      res.json(articles);
    } catch (error) {
      console.error("Error fetching recent articles:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "An unexpected error occurred" });
    }
  });

  app.get("/api/articles/history", async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const source = req.query.source as string;
      
      const articles = await storage.getArticleHistory(page, limit, source !== "all" ? source : undefined);
      res.json(articles);
    } catch (error) {
      console.error("Error fetching article history:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "An unexpected error occurred" });
    }
  });

  app.get("/api/articles/count", async (req, res) => {
    try {
      const source = req.query.source as string;
      const searchTerm = req.query.search as string;
      
      const count = await storage.getArticleCount(source !== "all" ? source : undefined, searchTerm);
      res.json(count);
    } catch (error) {
      console.error("Error fetching article count:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "An unexpected error occurred" });
    }
  });

  app.post("/api/compare", async (req, res) => {
    try {
      const request: SourceComparisonRequest = req.body;
      
      if (!request.topic || !request.sources || request.sources.length === 0) {
        return res.status(400).json({ message: "Topic and at least one source must be provided" });
      }

      const results = await compareSources(request);
      res.json(results);
    } catch (error) {
      console.error("Error comparing sources:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "An unexpected error occurred" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
